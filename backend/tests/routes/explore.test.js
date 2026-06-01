/**
 * Explore Routes Tests
 * Tests the explore API endpoints (segments, routes, heatmap)
 */

const request = require('supertest');
const express = require('express');
const exploreRoutes = require('../../src/routes/explore');

jest.mock('../../src/database', () => ({
    dbGetMain: jest.fn(),
    dbRunMain: jest.fn(),
    dbAllMain: jest.fn(),
}));

jest.mock('../../src/routes/auth', () => ({
    verifyToken: (req, res, next) => {
        req.user = { id: 1, email: 'test@example.com' };
        next();
    },
}));

jest.mock('../../src/services/explore/elevation.service', () => ({
  getElevationProfile: jest.fn(),
  calculateTotalGain: jest.fn(),
  calculateDistance: jest.fn(),
}));

const { dbGetMain, dbRunMain, dbAllMain } = require('../../src/database');
const elevationService = require('../../src/services/explore/elevation.service');

describe('Explore Routes', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/api/explore', exploreRoutes);
        jest.clearAllMocks();
    });

    describe('Segments', () => {
        describe('POST /api/explore/segments', () => {
            it('should create a segment', async () => {
                dbRunMain.mockResolvedValue({ lastID: 42 });

                const response = await request(app)
                    .post('/api/explore/segments')
                    .set('Authorization', 'Bearer test-token')
                    .send({
                        name: 'Test Segment',
                        start_lat: 48.8566,
                        start_lng: 2.3522,
                        end_lat: 48.8570,
                        end_lng: 2.3526,
                        distance: 100,
                        avg_grade: 2.5,
                        max_grade: 5.0,
                        polyline: 'abc123',
                    });

                expect(response.status).toBe(201);
                expect(response.body.success).toBe(true);
                expect(response.body.segment_id).toBe(42);
            });

            it('should return 400 on creation error', async () => {
                dbRunMain.mockRejectedValue(new Error('DB error'));

                const response = await request(app)
                    .post('/api/explore/segments')
                    .set('Authorization', 'Bearer test-token')
                    .send({
                        name: 'Test Segment',
                        start_lat: 48.8566,
                        start_lng: 2.3522,
                        end_lat: 48.8570,
                        end_lng: 2.3526,
                        distance: 100,
                    });

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe('GET /api/explore/segments', () => {
            it('should get nearby segments with lat/lng', async () => {
                const mockSegments = [
                    { id: 1, name: 'Segment A', distance: 100, effort_count: 5 },
                ];
                dbAllMain.mockResolvedValue(mockSegments);

                const response = await request(app)
                    .get('/api/explore/segments?lat=48.85&lng=2.35&radius=5000&type=Run')
                    .set('Authorization', 'Bearer test-token');

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.segments).toHaveLength(1);
            });

            it('should get public segments without lat/lng', async () => {
                dbAllMain.mockResolvedValue([]);

                const response = await request(app)
                    .get('/api/explore/segments')
                    .set('Authorization', 'Bearer test-token');

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });
        });

        describe('GET /api/explore/segments/:id', () => {
            it('should return segment details', async () => {
                dbGetMain
                    .mockResolvedValueOnce({ id: 1, name: 'Test Segment', created_by: 1 })
                    .mockResolvedValueOnce({ count: 5 })
                    .mockResolvedValueOnce({ count: 3 })
                    .mockResolvedValueOnce(null)
                    .mockResolvedValueOnce(null);

                const response = await request(app)
                    .get('/api/explore/segments/1')
                    .set('Authorization', 'Bearer test-token');

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });

            it('should return 404 for missing segment', async () => {
                dbGetMain.mockResolvedValue(null);

                const response = await request(app)
                    .get('/api/explore/segments/999')
                    .set('Authorization', 'Bearer test-token');

                expect(response.status).toBe(404);
            });
        });

        describe('DELETE /api/explore/segments/:id', () => {
            it('should delete a segment owned by the user', async () => {
                dbGetMain.mockResolvedValue({ id: 1, created_by: 1 });
                dbRunMain.mockResolvedValue({});

                const response = await request(app)
                    .delete('/api/explore/segments/1')
                    .set('Authorization', 'Bearer test-token');

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });

            it('should return 403 for unauthorized delete', async () => {
                dbGetMain.mockResolvedValue({ id: 1, created_by: 999 });

                const response = await request(app)
                    .delete('/api/explore/segments/1')
                    .set('Authorization', 'Bearer test-token');

                expect(response.status).toBe(403);
            });
        });
    });

    describe('Routes', () => {
        describe('POST /api/explore/routes', () => {
            it('should create a route', async () => {
                dbRunMain.mockResolvedValue({ lastID: 7 });

                const response = await request(app)
                    .post('/api/explore/routes')
                    .set('Authorization', 'Bearer test-token')
                    .send({
                        name: 'Test Route',
                        distance: 5000,
                        polyline: 'encoded_polyline',
                        difficulty: 'medium',
                    });

                expect(response.status).toBe(201);
                expect(response.body.success).toBe(true);
                expect(response.body.route_id).toBe(7);
            });
        });

        describe('GET /api/explore/routes', () => {
            it('should return public routes', async () => {
                dbAllMain.mockResolvedValue([
                    { id: 1, name: 'Route A', distance: 5000, tags: '[]', avg_rating: 4.5 },
                ]);

                const response = await request(app)
                    .get('/api/explore/routes')
                    .set('Authorization', 'Bearer test-token');

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.routes).toHaveLength(1);
            });
        });

        describe('DELETE /api/explore/routes/:id', () => {
            it('should delete a route owned by the user', async () => {
                dbGetMain.mockResolvedValue({ id: 1, created_by: 1 });
                dbRunMain.mockResolvedValue({});

                const response = await request(app)
                    .delete('/api/explore/routes/1')
                    .set('Authorization', 'Bearer test-token');

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });

            it('should return 404 for non-existent route', async () => {
                dbGetMain.mockResolvedValue(null);

                const response = await request(app)
                    .delete('/api/explore/routes/999')
                    .set('Authorization', 'Bearer test-token');

                expect(response.status).toBe(404);
            });
        });

        describe('POST /api/explore/routes/:id/rate', () => {
            it('should rate a route', async () => {
                dbGetMain
                    .mockResolvedValueOnce({ id: 1, name: 'Test Route', created_by: 1 })
                    .mockResolvedValueOnce(null)
                    .mockResolvedValueOnce({ avg_rating: 4.0, count: 1 })
                    .mockResolvedValueOnce({ id: 1, name: 'Test Route', created_by: 1, avg_rating: 4.0, rating_count: 1 });

                dbRunMain.mockResolvedValue({});

                const response = await request(app)
                    .post('/api/explore/routes/1/rate')
                    .set('Authorization', 'Bearer test-token')
                    .send({ rating: 4 });

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });

            it('should return 400 for invalid rating', async () => {
                const response = await request(app)
                    .post('/api/explore/routes/1/rate')
                    .set('Authorization', 'Bearer test-token')
                    .send({ rating: 6 });

                expect(response.status).toBe(400);
            });
        });
    });

    describe('Heatmap', () => {
        describe('GET /api/explore/heatmap', () => {
            it('should return heatmap data', async () => {
                dbGetMain.mockResolvedValue([
                    { lat: 48.85, lng: 2.35, intensity: 5 },
                ]);

                const response = await request(app)
                    .get('/api/explore/heatmap?lat=48.85&lng=2.35&radius=5000&type=Run')
                    .set('Authorization', 'Bearer test-token');

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });

            it('should return 400 without lat/lng', async () => {
                const response = await request(app)
                    .get('/api/explore/heatmap')
                    .set('Authorization', 'Bearer test-token');

                expect(response.status).toBe(400);
            });
        });
    });

    describe('Elevation', () => {
        describe('POST /api/explore/elevation', () => {
            it('should return elevation profile', async () => {
                elevationService.getElevationProfile.mockResolvedValue([
                    { lat: 48.85, lng: 2.35, elevation: 100, distance: 0 },
                    { lat: 48.86, lng: 2.36, elevation: 110, distance: 1500 },
                ]);
                elevationService.calculateTotalGain.mockReturnValue(10);

                const response = await request(app)
                    .post('/api/explore/elevation')
                    .set('Authorization', 'Bearer test-token')
                    .send({
                        locations: [
                            { lat: 48.85, lng: 2.35 },
                            { lat: 48.86, lng: 2.36 },
                        ],
                    });

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.profile).toBeDefined();
                expect(response.body.stats).toBeDefined();
            });

            it('should return 400 with insufficient locations', async () => {
                const response = await request(app)
                    .post('/api/explore/elevation')
                    .set('Authorization', 'Bearer test-token')
                    .send({ locations: [{ lat: 48.85, lng: 2.35 }] });

                expect(response.status).toBe(400);
            });
        });
    });

    describe('Community Traces', () => {
        describe('GET /api/explore/community/traces', () => {
            it('should return community traces', async () => {
                dbAllMain.mockResolvedValue([
                    { id: 1, polyline: 'abc', distance: 5000, activity_type: 'Run', difficulty: 'easy', elevation_gain: 100 },
                ]);

                const response = await request(app)
                    .get('/api/explore/community/traces')
                    .set('Authorization', 'Bearer test-token');

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.traces).toBeDefined();
            });
        });
    });
});
