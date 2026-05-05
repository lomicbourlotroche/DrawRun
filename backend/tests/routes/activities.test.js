/**
 * Activities Routes Tests
 * Tests the activities API endpoints with pagination
 */

const request = require('supertest');
const express = require('express');
const activitiesRouter = require('../../src/routes/activities');

// Mock database and auth
jest.mock('../../src/database', () => ({
  getUserDb: jest.fn(),
  dbGetUser: jest.fn(),
  dbAllUser: jest.fn(),
  dbRunUser: jest.fn(),
}));

jest.mock('../../src/auth', () => ({
  verifyToken: (req, res, next) => {
    req.user = { id: 1, email: 'test@example.com' };
    next();
  },
}));

jest.mock('../../src/metrics_calculator', () => ({
  calculateAndStoreMetrics: jest.fn(),
}));

const { getUserDb, dbGetUser, dbAllUser, dbRunUser } = require('../../src/database');

describe('Activities Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/activities', activitiesRouter);
    jest.clearAllMocks();
  });

  describe('GET /api/activities', () => {
    it('should return paginated activities', async () => {
      const mockActivities = [
        { id: 1, name: 'Morning Run', type: 'Run', distance: 5000 },
        { id: 2, name: 'Evening Bike', type: 'Bike', distance: 15000 },
      ];

      getUserDb.mockResolvedValue({});
      dbGetUser.mockResolvedValue({ total: 2 });
      dbAllUser.mockResolvedValue(mockActivities);

      const response = await request(app)
        .get('/api/activities')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toEqual({
        page: 1,
        per_page: 20,
        total: 2,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      });
    });

    it('should filter activities by type', async () => {
      const mockActivities = [
        { id: 1, name: 'Morning Run', type: 'Run', distance: 5000 },
      ];

      getUserDb.mockResolvedValue({});
      dbGetUser.mockResolvedValue({ total: 1 });
      dbAllUser.mockResolvedValue(mockActivities);

      const response = await request(app)
        .get('/api/activities?type=Run')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].type).toBe('Run');
    });

    it('should filter activities by date range', async () => {
      getUserDb.mockResolvedValue({});
      dbGetUser.mockResolvedValue({ total: 0 });
      dbAllUser.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/activities?start_date_from=2024-01-01&start_date_to=2024-01-31')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });

    it('should handle custom pagination parameters', async () => {
      const mockActivities = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `Activity ${i + 1}`,
        type: 'Run',
        distance: 5000,
      }));

      getUserDb.mockResolvedValue({});
      dbGetUser.mockResolvedValue({ total: 100 });
      dbAllUser.mockResolvedValue(mockActivities);

      const response = await request(app)
        .get('/api/activities?page=2&per_page=10')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.per_page).toBe(10);
      expect(response.body.pagination.total_pages).toBe(10);
      expect(response.body.pagination.has_next).toBe(true);
      expect(response.body.pagination.has_prev).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      getUserDb.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/activities')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch activities');
    });
  });

  describe('POST /api/activities/create', () => {
    it('should create a manual activity', async () => {
      getUserDb.mockResolvedValue({});
      dbRunUser.mockResolvedValue({ lastID: 123 });

      const response = await request(app)
        .post('/api/activities/create')
        .set('Authorization', 'Bearer test-token')
        .send({
          name: 'Test Run',
          type: 'Run',
          start_date: '2024-01-01T10:00:00Z',
          distance: 5000,
          moving_time: 1800,
          average_speed: 2.78,
          average_heartrate: 150,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(dbRunUser).toHaveBeenCalledWith(
        expect.any(Object),
        expect.stringContaining('INSERT INTO activities'),
        expect.arrayContaining([
          expect.stringContaining('manual-'), // source_id
          'Test Run',
          'Run',
        ])
      );
    });

    it('should return 500 on creation error', async () => {
      getUserDb.mockResolvedValue({});
      dbRunUser.mockRejectedValue(new Error('Insert failed'));

      const response = await request(app)
        .post('/api/activities/create')
        .set('Authorization', 'Bearer test-token')
        .send({
          name: 'Test Run',
          type: 'Run',
          start_date: '2024-01-01T10:00:00Z',
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to create activity');
    });
  });
});
