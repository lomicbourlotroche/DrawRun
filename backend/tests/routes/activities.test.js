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
  dbGetMain: jest.fn(),
  dbAllMain: jest.fn(),
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

jest.mock('../../src/services/activities/gpx.service', () => ({
  parseGpx: jest.fn(),
}));

jest.mock('../../src/services/explore/heatmap.service', () => ({
  updateHeatmap: jest.fn().mockResolvedValue(),
}));

// Mock the new unified activity parser
jest.mock('../../src/services/activityParser.service', () => ({
  parseActivityFile: jest.fn(),
}));

// Mock sync utils for file upload processing
jest.mock('../../src/services/sync/utils', () => ({
  processUploadedActivityFile: jest.fn(),
}));

const { getUserDb, dbGetUser, dbAllUser, dbRunUser } = require('../../src/database');
const { parseGpx } = require('../../src/services/activities/gpx.service');
const { parseActivityFile } = require('../../src/services/activityParser.service');
const { processUploadedActivityFile } = require('../../src/services/sync/utils');

describe('Activities Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json({ limit: '10mb' }));
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

  describe('POST /api/activities/import/gpx', () => {
    it('should import a valid GPX file', async () => {
      getUserDb.mockResolvedValue({});
      dbRunUser.mockResolvedValue({ lastID: 456 });
      // Mock the new unified parser for GPX files
      parseActivityFile.mockResolvedValue({
        source: 'gpx',
        source_id: 'gpx-2024-01-01T10-00-00Z',
        name: 'Activité GPX',
        type: 'run',
        start_date: '2024-01-01T10:00:00Z',
        distance: 5000,
        moving_time: 1800,
        elapsed_time: 1800,
        total_elevation_gain: 50,
        elev_high: 150,
        elev_low: 100,
        average_heartrate: 145,
        max_heartrate: 170,
        average_speed: 2.78,
        map_polyline: '[[48.85,2.29],[48.86,2.30]]',
        _streams: {
          latlng: [[48.85,2.29],[48.86,2.30]],
          distance: [0, 5000],
          time: [0, 1800],
          altitude: [100, 150],
          heartrate: [145, 170],
          cadence: [],
        },
        _splits: []
      });

      const response = await request(app)
        .post('/api/activities/import/gpx')
        .set('Authorization', 'Bearer test-token')
        .send({
          name: 'Morning Run GPX',
          gpxData: '<?xml version="1.0"?><gpx><trk><trkseg><trkpt lat="48.85" lon="2.29"><time>2024-01-01T10:00:00Z</time></trkpt><trkpt lat="48.86" lon="2.30"><time>2024-01-01T10:30:00Z</time></trkpt></trkseg></trk></gpx>',
          type: 'run',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.id).toBe(456);
      expect(response.body.distance).toBe(5000);
      expect(response.body.duration).toBe(1800);
      expect(response.body.trackpoints).toBe(2);

      expect(parseActivityFile).toHaveBeenCalledWith('gpx_upload', expect.stringContaining('<gpx>'));
      expect(dbRunUser).toHaveBeenCalledWith(
        expect.any(Object),
        expect.stringContaining('INSERT INTO activities'),
        expect.arrayContaining(['Morning Run GPX', 'run'])
      );
      // Verify elapsed_time is now included in GPX import
      const sql = dbRunUser.mock.calls[0][1];
      expect(sql).toContain('elapsed_time');
    });

    it('should reject empty GPX data', async () => {
      const response = await request(app)
        .post('/api/activities/import/gpx')
        .set('Authorization', 'Bearer test-token')
        .send({ name: 'Test', type: 'run' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('gpxData or file is required');
    });

    it('should reject oversized GPX data', async () => {
      const largeGpx = 'X'.repeat(6 * 1024 * 1024); // 6MB > 5MB limit
      const response = await request(app)
        .post('/api/activities/import/gpx')
        .set('Authorization', 'Bearer test-token')
        .send({ name: 'Test', gpxData: largeGpx, type: 'run' });

      expect(response.status).toBe(413);
    });

    it('should reject invalid activity type', async () => {
      const response = await request(app)
        .post('/api/activities/import/gpx')
        .set('Authorization', 'Bearer test-token')
        .send({
          name: 'Test',
          gpxData: '<gpx></gpx>',
          type: 'invalid_sport',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid activity type');
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
