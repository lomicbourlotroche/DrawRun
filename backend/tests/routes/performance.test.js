/**
 * ============================================================
 * Performance Routes Tests
 * ============================================================
 */

const request = require('supertest');
const express = require('express');
const metricsRouter = require('../../src/routes/metrics');
const pmcRouter = require('../../src/routes/pmc');
const overtrainingRouter = require('../../src/routes/overtraining');

jest.mock('../../src/database', () => ({
  getUserDb: jest.fn(),
  dbGetUser: jest.fn(),
  dbAllUser: jest.fn(),
  dbRunUser: jest.fn(),
  dbGetMain: jest.fn(),
}));

jest.mock('../../src/routes/auth', () => ({
  verifyToken: (req, res, next) => {
    req.user = { id: 1, email: 'test@example.com' };
    next();
  },
}));

jest.mock('../../src/services/metricsCalculator.service', () => ({
  calculateAndStoreMetrics: jest.fn(),
}));

jest.mock('../../src/services/userConstants.service', () => ({
  resolveUserConstants: jest.fn(),
}));

jest.mock('../../src/middleware/performance', () => {
  const actual = jest.requireActual('../../src/middleware/performance');
  return {
    ...actual,
    cacheRoute: () => (req, res, next) => next(),
  };
});

const { getUserDb, dbGetUser, dbAllUser, dbRunUser, dbGetMain } = require('../../src/database');
const { calculateAndStoreMetrics } = require('../../src/services/metricsCalculator.service');
const { resolveUserConstants } = require('../../src/services/userConstants.service');

describe('Metrics Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/metrics', metricsRouter);
    jest.clearAllMocks();
  });

  describe('GET /api/metrics', () => {
    it('should return metrics data', async () => {
      getUserDb.mockResolvedValue({});
      dbGetUser.mockResolvedValueOnce({ value: 50 });
      dbGetUser.mockResolvedValueOnce({ value: 30 });
      dbGetUser.mockResolvedValueOnce({ value: 40000 });

      const response = await request(app)
        .get('/api/metrics')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ctl: 50,
        atl: 30,
        tsb: 20,
        weeklyDistance: 40000,
      });
    });

    it('should return zeros when no metrics exist', async () => {
      getUserDb.mockResolvedValue({});
      dbGetUser.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/metrics')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ctl: 0,
        atl: 0,
        tsb: 0,
        weeklyDistance: 0,
      });
    });

    it('should return 500 on database error', async () => {
      getUserDb.mockRejectedValue(new Error('DB error'));

      const response = await request(app)
        .get('/api/metrics')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch metrics');
    });
  });

  describe('POST /api/metrics/recalculate', () => {
    it('should recalculate and return metrics', async () => {
      getUserDb.mockResolvedValue({});
      calculateAndStoreMetrics.mockResolvedValue({ success: true, calculated: 5, vdot: 42 });

      const response = await request(app)
        .post('/api/metrics/recalculate')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, calculated: 5, vdot: 42 });
      expect(calculateAndStoreMetrics).toHaveBeenCalledWith(1, {});
    });

    it('should return 500 on calculation error', async () => {
      getUserDb.mockRejectedValue(new Error('DB error'));

      const response = await request(app)
        .post('/api/metrics/recalculate')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to recalculate metrics');
    });
  });

  describe('POST /api/metrics/hrv', () => {
    it('should store HRV value and recalculate', async () => {
      getUserDb.mockResolvedValue({});
      dbRunUser.mockResolvedValue({});
      calculateAndStoreMetrics.mockResolvedValue({ success: true });

      const response = await request(app)
        .post('/api/metrics/hrv')
        .set('Authorization', 'Bearer test-token')
        .send({ value: 65 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(dbRunUser).toHaveBeenCalledWith(
        expect.any(Object),
        expect.stringContaining('INSERT OR REPLACE'),
        expect.arrayContaining([1, 65])
      );
    });

    it('should return 500 on HRV storage error', async () => {
      getUserDb.mockRejectedValue(new Error('DB error'));

      const response = await request(app)
        .post('/api/metrics/hrv')
        .set('Authorization', 'Bearer test-token')
        .send({ value: 65 });

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/metrics/sleep', () => {
    it('should store sleep value and recalculate', async () => {
      getUserDb.mockResolvedValue({});
      dbRunUser.mockResolvedValue({});
      calculateAndStoreMetrics.mockResolvedValue({ success: true });

      const response = await request(app)
        .post('/api/metrics/sleep')
        .set('Authorization', 'Bearer test-token')
        .send({ value: 7.5 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});

describe('PMC Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/pmc', pmcRouter);
    jest.clearAllMocks();
  });

  describe('GET /api/pmc', () => {
    it('should return PMC history', async () => {
      const mockPmc = [
        { date: '2026-01-02', ctl: 52, atl: 35, tsb: 17, acwr: 1.0 },
        { date: '2026-01-01', ctl: 50, atl: 30, tsb: 20, acwr: 0.9 },
      ];

      getUserDb.mockResolvedValue({});
      dbAllUser.mockResolvedValue(mockPmc);

      const response = await request(app)
        .get('/api/pmc')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].ctl).toBe(50);
      expect(response.body[1].date).toBe('2026-01-02');
    });

    it('should return empty array when no PMC data', async () => {
      getUserDb.mockResolvedValue({});
      dbAllUser.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/pmc')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return 500 on database error', async () => {
      getUserDb.mockRejectedValue(new Error('DB error'));

      const response = await request(app)
        .get('/api/pmc')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/pmc/recommendations', () => {
    it('should return a recommendation', async () => {
      resolveUserConstants.mockResolvedValue({ fcm: 180, vma: 14, age: 30, sex: 'M' });
      getUserDb.mockResolvedValue({});
      dbGetUser.mockResolvedValueOnce({ ctl: 50, atl: 30, tsb: 20 });
      dbGetUser.mockResolvedValueOnce({ value: 40000 });

      const response = await request(app)
        .get('/api/pmc/recommendations')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('type');
    });

    it('should return default recommendation when constants missing', async () => {
      resolveUserConstants.mockResolvedValue({ fcm: null, vma: null, age: null, sex: 'M' });
      getUserDb.mockResolvedValue({});

      const response = await request(app)
        .get('/api/pmc/recommendations')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.type).toBe('Endurance');
    });
  });
});

describe('Overtraining Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/overtraining', overtrainingRouter);
    jest.clearAllMocks();
  });

  describe('GET /api/overtraining/check', () => {
    it('should return overtraining risk data', async () => {
      getUserDb.mockResolvedValue({});
      dbGetMain.mockResolvedValue({ id: 1, email: 'test@example.com' });
      dbGetUser.mockResolvedValue({ ctl: 50, atl: 65 });

      const response = await request(app)
        .get('/api/overtraining/check')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('risk');
      expect(response.body).toHaveProperty('acwr');
      expect(response.body).toHaveProperty('ctl', 50);
    });

    it('should return low risk when ACWR is normal', async () => {
      getUserDb.mockResolvedValue({});
      dbGetMain.mockResolvedValue({ id: 1 });
      dbGetUser.mockResolvedValue({ ctl: 80, atl: 70 });

      const response = await request(app)
        .get('/api/overtraining/check')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.risk).toBe('low');
    });

    it('should return moderate risk when ACWR > 1.3', async () => {
      getUserDb.mockResolvedValue({});
      dbGetMain.mockResolvedValue({ id: 1 });
      dbGetUser.mockResolvedValue({ ctl: 50, atl: 70 });

      const response = await request(app)
        .get('/api/overtraining/check')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.risk).toBe('moderate');
    });

    it('should return high risk when ACWR > 1.5', async () => {
      getUserDb.mockResolvedValue({});
      dbGetMain.mockResolvedValue({ id: 1 });
      dbGetUser.mockResolvedValue({ ctl: 40, atl: 65 });

      const response = await request(app)
        .get('/api/overtraining/check')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.risk).toBe('high');
    });

    it('should return low risk when no user found', async () => {
      getUserDb.mockResolvedValue({});
      dbGetMain.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/overtraining/check')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.risk).toBe('low');
      expect(response.body.score).toBe(0);
    });

    it('should return low risk when no PMC data', async () => {
      getUserDb.mockResolvedValue({});
      dbGetMain.mockResolvedValue({ id: 1 });
      dbGetUser.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/overtraining/check')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.risk).toBe('low');
    });
  });
});
