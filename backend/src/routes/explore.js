'use strict';

const express = require('express');
const { verifyToken } = require('../middleware/auth');
const segments = require('../services/explore/segments.service');
const routes = require('../services/explore/routes.service');
const heatmapService = require('../services/explore/heatmap.service');
const elevationService = require('../services/explore/elevation.service');
const { logger } = require('../utils/logger');
const {
    validateSegmentBody,
    validateRouteBody,
    validateRouteGenerationBody,
    validateSegmentEffortBody,
    validateLocationParams,
    validateRating,
} = require('../utils/validators');

const router = express.Router();

// Validation helper for query params
const validateQuery = (validator, query) => {
    const result = validator(query);
    if (!result.valid) {
        return { error: 'Invalid query parameters', details: result.errors };
    }
    return null;
};

// Validation helper for body
const validateRequestBody = (validator, body) => {
    const result = validator(body);
    if (!result.valid) {
        return { error: 'Validation failed', details: result.errors };
    }
    return null;
};

// ============================================================================
// SEGMENTS
// ============================================================================

/**
 * @swagger
 * /explore/segments:
 *   post:
 *     summary: Create a new segment
 *     tags: [Explore]
 *     security:
 *       - bearerAuth: []
 */
router.post('/segments', verifyToken, async (req, res) => {
    try {
        const validationError = validateRequestBody(validateSegmentBody, req.body);
        if (validationError) {
            return res.status(400).json(validationError);
        }

        const result = await segments.createSegment(req.user.id, req.body);
        if (result.success) {
            res.status(201).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        logger.error('Create segment error:', error);
        res.status(500).json({ error: 'Failed to create segment' });
    }
});

/**
 * @swagger
 * /explore/segments:
 *   get:
 *     summary: Get nearby segments
 *     tags: [Explore]
 *     security:
 *       - bearerAuth: []
 */
router.get('/segments', verifyToken, async (req, res) => {
    try {
        const { lat, lng, radius, type } = req.query;
        
        // Validate location params if provided
        if (lat && lng) {
            const validationError = validateQuery(validateLocationParams, { lat, lng, radius });
            if (validationError) {
                return res.status(400).json(validationError);
            }
            
            const nearby = await segments.getNearbySegments(
                parseFloat(lat), 
                parseFloat(lng), 
                radius ? parseInt(radius) : 5000,
                type
            );
            res.json({ success: true, segments: nearby });
        } else {
            const publicSegments = await segments.getPublicSegments();
            res.json({ success: true, segments: publicSegments });
        }
    } catch (error) {
        logger.error('Get segments error:', error);
        res.status(500).json({ error: 'Failed to get segments' });
    }
});

/**
 * @swagger
 * /explore/segments/{id}:
 *   get:
 *     summary: Get segment details
 *     tags: [Explore]
 *     security:
 *       - bearerAuth: []
 */
router.get('/segments/:id', verifyToken, async (req, res) => {
    try {
        const segmentId = parseInt(req.params.id);
        if (isNaN(segmentId) || segmentId <= 0) {
            return res.status(400).json({ error: 'Invalid segment ID' });
        }
        
        const segment = await segments.getSegment(segmentId);
        if (!segment) {
            return res.status(404).json({ error: 'Segment not found' });
        }
        res.json({ success: true, segment });
    } catch (error) {
        logger.error('Get segment error:', error);
        res.status(500).json({ error: 'Failed to get segment' });
    }
});

/**
 * @swagger
 * /explore/segments/{id}/leaderboard:
 *   get:
 *     summary: Get segment leaderboard
 *     tags: [Explore]
 *     security:
 *       - bearerAuth: []
 */
router.get('/segments/:id/leaderboard', verifyToken, async (req, res) => {
    try {
        const segmentId = parseInt(req.params.id);
        if (isNaN(segmentId) || segmentId <= 0) {
            return res.status(400).json({ error: 'Invalid segment ID' });
        }
        
        const leaderboard = await segments.getSegmentLeaderboard(segmentId);
        res.json({ success: true, leaderboard });
    } catch (error) {
        logger.error('Get leaderboard error:', error);
        res.status(500).json({ error: 'Failed to get leaderboard' });
    }
});

/**
 * @swagger
 * /explore/segments/{id}/efforts:
 *   post:
 *     summary: Record a segment effort
 *     tags: [Explore]
 *     security:
 *       - bearerAuth: []
 */
router.post('/segments/:id/efforts', verifyToken, async (req, res) => {
    try {
        const validationError = validateRequestBody(validateSegmentEffortBody, req.body);
        if (validationError) {
            return res.status(400).json(validationError);
        }

        const result = await segments.createSegmentEffort(
            req.user.id,
            parseInt(req.params.id),
            req.body.activity_id,
            req.body
        );
        if (result.success) {
            res.status(201).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        logger.error('Create effort error:', error);
        res.status(500).json({ error: 'Failed to create effort' });
    }
});

/**
 * @swagger
 * /explore/segments/{id}/efforts/me:
 *   get:
 *     summary: Get user's efforts on a segment
 *     tags: [Explore]
 *     security:
 *       - bearerAuth: []
 */
router.get('/segments/:id/efforts/me', verifyToken, async (req, res) => {
    try {
        const segmentId = parseInt(req.params.id);
        if (isNaN(segmentId) || segmentId <= 0) {
            return res.status(400).json({ error: 'Invalid segment ID' });
        }
        
        const efforts = await segments.getUserSegmentEfforts(req.user.id, segmentId);
        res.json({ success: true, efforts });
    } catch (error) {
        logger.error('Get user efforts error:', error);
        res.status(500).json({ error: 'Failed to get efforts' });
    }
});

/**
 * @swagger
 * /explore/segments/{id}:
 *   delete:
 *     summary: Delete a segment
 *     tags: [Explore]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/segments/:id', verifyToken, async (req, res) => {
    try {
        const segmentId = parseInt(req.params.id);
        if (isNaN(segmentId) || segmentId <= 0) {
            return res.status(400).json({ error: 'Invalid segment ID' });
        }
        
        const result = await segments.deleteSegment(req.user.id, segmentId);
        if (result.success) {
            res.json(result);
        } else if (result.error === 'Segment not found') {
            res.status(404).json({ error: result.error });
        } else if (result.error === 'Not authorized') {
            res.status(403).json({ error: result.error });
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        logger.error('Delete segment error:', error);
        res.status(500).json({ error: 'Failed to delete segment' });
    }
});

// ============================================================================
// ROUTES
// ============================================================================

/**
 * @swagger
 * /explore/routes:
 *   post:
 *     summary: Create a new route
 *     tags: [Explore]
 *     security:
 *       - bearerAuth: []
 */
router.post('/routes', verifyToken, async (req, res) => {
    try {
        const validationError = validateRequestBody(validateRouteBody, req.body);
        if (validationError) {
            return res.status(400).json(validationError);
        }

        const result = await routes.createRoute(req.user.id, req.body);
        if (result.success) {
            res.status(201).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        logger.error('Create route error:', error);
        res.status(500).json({ error: 'Failed to create route' });
    }
});

/**
 * @swagger
 * /explore/routes:
 *   get:
 *     summary: Get public routes
 *     tags: [Explore]
 *     security:
 *       - bearerAuth: []
 */
router.get('/routes', verifyToken, async (req, res) => {
    try {
        const { type, difficulty, limit, offset } = req.query;
        
        // Validate limit and offset
        const limitNum = limit ? parseInt(limit) : 50;
        const offsetNum = offset ? parseInt(offset) : 0;
        
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return res.status(400).json({ error: 'limit must be between 1 and 100' });
        }
        if (isNaN(offsetNum) || offsetNum < 0) {
            return res.status(400).json({ error: 'offset must be a positive number' });
        }

        const publicRoutes = await routes.getPublicRoutes(
            type,
            difficulty,
            limitNum,
            offsetNum
        );
        res.json({ success: true, routes: publicRoutes });
    } catch (error) {
        logger.error('Get routes error:', error);
        res.status(500).json({ error: 'Failed to get routes' });
    }
});

/**
 * @swagger
 * /explore/routes/{id}:
 *   get:
 *     summary: Get route details
 *     tags: [Explore]
 *     security:
 *       - bearerAuth: []
 */
router.get('/routes/:id', verifyToken, async (req, res) => {
    try {
        const routeId = parseInt(req.params.id);
        if (isNaN(routeId) || routeId <= 0) {
            return res.status(400).json({ error: 'Invalid route ID' });
        }
        
        const route = await routes.getRoute(routeId, req.user.id);
        if (!route) {
            return res.status(404).json({ error: 'Route not found' });
        }
        res.json({ success: true, route });
    } catch (error) {
        logger.error('Get route error:', error);
        res.status(500).json({ error: 'Failed to get route' });
    }
});

/**
 * @swagger
 * /explore/routes/{id}/favorite:
 *   post:
 *     summary: Add route to favorites
 *     tags: [Explore]
 *     security:
 *       - bearerAuth: []
 */
router.post('/routes/:id/favorite', verifyToken, async (req, res) => {
    try {
        const routeId = parseInt(req.params.id);
        if (isNaN(routeId) || routeId <= 0) {
            return res.status(400).json({ error: 'Invalid route ID' });
        }
        
        const result = await routes.addToFavorites(req.user.id, routeId);
        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        logger.error('Add favorite error:', error);
        res.status(500).json({ error: 'Failed to add favorite' });
    }
});

/**
 * @swagger
 * /explore/routes/{id}/favorite:
 *   delete:
 *     summary: Remove route from favorites
 *     tags: [Explore]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/routes/:id/favorite', verifyToken, async (req, res) => {
    try {
        const routeId = parseInt(req.params.id);
        if (isNaN(routeId) || routeId <= 0) {
            return res.status(400).json({ error: 'Invalid route ID' });
        }
        
        const result = await routes.removeFromFavorites(req.user.id, routeId);
        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        logger.error('Remove favorite error:', error);
        res.status(500).json({ error: 'Failed to remove favorite' });
    }
});

/**
 * @swagger
 * /explore/routes/{id}/use:
 *   post:
 *     summary: Increment route usage count
 *     tags: [Explore]
 *     security:
 *       - bearerAuth: []
 */
router.post('/routes/:id/use', verifyToken, async (req, res) => {
    try {
        const routeId = parseInt(req.params.id);
        if (isNaN(routeId) || routeId <= 0) {
            return res.status(400).json({ error: 'Invalid route ID' });
        }
        
        const result = await routes.incrementRouteUsage(routeId);
        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        logger.error('Use route error:', error);
        res.status(500).json({ error: 'Failed to use route' });
    }
});

/**
 * @swagger
 * /explore/routes/my:
 *   get:
 *     summary: Get user's routes
 *     tags: [Explore]
 *     security:
 *       - bearerAuth: []
 */
router.get('/routes/my', verifyToken, async (req, res) => {
    try {
        const userRoutes = await routes.getUserRoutes(req.user.id);
        res.json({ success: true, routes: userRoutes });
    } catch (error) {
        logger.error('Get user routes error:', error);
        res.status(500).json({ error: 'Failed to get routes' });
    }
});

/**
 * @swagger
 * /explore/routes/favorites:
 *   get:
 *     summary: Get favorite routes
 *     tags: [Explore]
 *     security:
 *       - bearerAuth: []
 */
router.get('/routes/favorites', verifyToken, async (req, res) => {
    try {
        const favorites = await routes.getFavoriteRoutes(req.user.id);
        res.json({ success: true, routes: favorites });
    } catch (error) {
        logger.error('Get favorites error:', error);
        res.status(500).json({ error: 'Failed to get favorites' });
    }
});

/**
 * @swagger
 * /explore/routes/{id}:
 *   delete:
 *     summary: Delete a route
 *     tags: [Explore]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/routes/:id', verifyToken, async (req, res) => {
    try {
        const routeId = parseInt(req.params.id);
        if (isNaN(routeId) || routeId <= 0) {
            return res.status(400).json({ error: 'Invalid route ID' });
        }
        
        const result = await routes.deleteRoute(req.user.id, routeId);
        if (result.success) {
            res.json(result);
        } else if (result.error === 'Route not found') {
            res.status(404).json({ error: result.error });
        } else if (result.error === 'Not authorized') {
            res.status(403).json({ error: result.error });
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        logger.error('Delete route error:', error);
        res.status(500).json({ error: 'Failed to delete route' });
    }
});

/**
 * @swagger
 * /explore/routes/{id}/rate:
 *   post:
 *     summary: Rate a route (1-5 stars)
 *     tags: [Explore]
 *     security:
 *       - bearerAuth: []
 */
router.post('/routes/:id/rate', verifyToken, async (req, res) => {
    try {
        const { rating } = req.body;
        
        const ratingValidation = validateRating(rating);
        if (!ratingValidation.valid) {
            return res.status(400).json({ error: ratingValidation.error });
        }
        
        const routeId = parseInt(req.params.id);
        
        // Validate routeId is a valid number
        if (isNaN(routeId) || routeId <= 0) {
            return res.status(400).json({ error: 'Invalid route ID' });
        }
        
        const route = await routes.getRoute(routeId, req.user.id);
        
        if (!route) {
            return res.status(404).json({ error: 'Route not found' });
        }
        
        const result = await routes.rateRoute(req.user.id, routeId, Math.round(rating));
        
        if (result.success) {
            const updatedRoute = await routes.getRoute(routeId, req.user.id);
            res.json({ success: true, avg_rating: updatedRoute?.avg_rating, rating_count: updatedRoute?.rating_count });
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        logger.error('Rate route error:', error);
        res.status(500).json({ error: 'Failed to rate route' });
    }
});

/**
 * @swagger
 * /explore/routes/generate:
 *   post:
 *     summary: Generate a route with OSRM and turn-by-turn directions
 *     tags: [Explore]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [waypoints]
 *             properties:
 *               waypoints:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     lat: { type: number }
 *                     lng: { type: number }
 *                 minItems: 2
 *               activity_type:
 *                 type: string
 *                 enum: [Run, Bike, Hike, Walk, Trail, Ride]
 *                 default: Run
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard, expert]
 *               is_public:
 *                 type: boolean
 *                 default: true
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 */
router.post('/routes/generate', verifyToken, async (req, res) => {
    try {
        // Validate request body for route generation
        const validationError = validateRequestBody(validateRouteGenerationBody, req.body);
        if (validationError) {
            return res.status(400).json(validationError);
        }

        const result = await routes.generateAndCreateRoute(req.user.id, req.body);

        if (result.success) {
            res.status(201).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        logger.error('Generate route error:', error);
        res.status(500).json({ error: 'Échec de la génération de route' });
    }
});

// ============================================================================
// HEATMAPS
// ============================================================================

/**
 * @swagger
 * /explore/heatmap:
 *   get:
 *     summary: Get heatmap data for an area
 *     tags: [Explore]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 5000
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [Run, Bike, Swim]
 */
router.get('/heatmap', verifyToken, async (req, res) => {
    try {
        const { lat, lng, radius = 5000, type = 'Run' } = req.query;
        
        // Validate location params
        const validationError = validateQuery(validateLocationParams, { lat, lng, radius });
        if (validationError) {
            return res.status(400).json(validationError);
        }
        
        if (!lat || !lng) {
            return res.status(400).json({ error: 'Latitude and longitude required' });
        }
        
        // Validate type
        const ALLOWED_TYPES = ['Run', 'Bike', 'Swim', 'Hike', 'Walk'];
        if (!ALLOWED_TYPES.includes(type)) {
            return res.status(400).json({ error: `type must be one of: ${ALLOWED_TYPES.join(', ')}` });
        }
        
        const heatmapData = await heatmapService.getHeatmap(
            parseFloat(lat),
            parseFloat(lng),
            parseInt(radius),
            type
        );
        
        res.json({
            success: true,
            heatmap: heatmapData
        });
    } catch (error) {
        logger.error('Get heatmap error:', error);
        res.status(500).json({ error: 'Failed to get heatmap data' });
    }
});

/**
 * @swagger
 * /explore/heatmap/popular:
 *   get:
 *     summary: Get most popular locations
 *     tags: [Explore]
 *     security:
 *       - bearerAuth: []
 */
router.get('/heatmap/popular', verifyToken, async (req, res) => {
    try {
        const { type = 'Run', limit = 50 } = req.query;
        
        const popularLocations = await heatmapService.getPopularLocations(
            type,
            parseInt(limit)
        );
        
        res.json({
            success: true,
            locations: popularLocations
        });
    } catch (error) {
        logger.error('Get popular locations error:', error);
        res.status(500).json({ error: 'Failed to get popular locations' });
    }
});

/**
 * @swagger
 * /explore/elevation:
 *   post:
 *     summary: Get elevation profile for a set of coordinates
 *     tags: [Explore]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               locations:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     lat: { type: number }
 *                     lng: { type: number }
 */
router.post('/elevation', verifyToken, async (req, res) => {
    try {
        const { locations } = req.body;

        if (!locations) {
            return res.status(400).json({ error: 'locations is required' });
        }
        if (!Array.isArray(locations)) {
            return res.status(400).json({ error: 'locations must be an array' });
        }
        if (locations.length < 2) {
            return res.status(400).json({ error: 'At least 2 locations required' });
        }
        if (locations.length > 500) {
            return res.status(400).json({ error: 'Maximum 500 locations allowed' });
        }

        // Validate coordinate format
        for (const loc of locations) {
            if (typeof loc.lat !== 'number' || typeof loc.lng !== 'number') {
                return res.status(400).json({ error: 'Each location must have lat and lng as numbers' });
            }
            
            // Validate coordinate ranges
            if (loc.lat < -90 || loc.lat > 90) {
                return res.status(400).json({ error: 'lat must be between -90 and 90' });
            }
            if (loc.lng < -180 || loc.lng > 180) {
                return res.status(400).json({ error: 'lng must be between -180 and 180' });
            }
        }

        const profile = await elevationService.getElevationProfile(locations);
        const totalGain = elevationService.calculateTotalGain(profile);

        res.json({
            success: true,
            profile,
            stats: {
                total_gain: totalGain,
                max_elevation: profile.length > 0 ? Math.max(...profile.map(p => p.elevation)) : 0,
                min_elevation: profile.length > 0 ? Math.min(...profile.map(p => p.elevation)) : 0,
            }
        });
    } catch (error) {
        logger.error('Get elevation profile error:', error);
        res.status(500).json({ error: 'Failed to get elevation profile' });
    }
});

/**
 * @swagger
 * /explore/community/traces:
 *   get:
 *     summary: Get anonymized community route traces for the map overlay
 *     tags: [Explore]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [Run, Bike, Swim, Hike]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 200
 */
router.get('/community/traces', verifyToken, async (req, res) => {
    try {
        const { type, limit } = req.query;
        
        // Validate limit
        const limitNum = limit ? parseInt(limit) : 200;
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 500) {
            return res.status(400).json({ error: 'limit must be between 1 and 500' });
        }
        
        // Validate type
        if (type) {
            const ALLOWED_TYPES = ['Run', 'Bike', 'Swim', 'Hike', 'Walk'];
            if (!ALLOWED_TYPES.includes(type)) {
                return res.status(400).json({ error: `type must be one of: ${ALLOWED_TYPES.join(', ')}` });
            }
        }
        
        const traces = await routes.getCommunityTraces(
            null,
            type || null,
            limitNum
        );
        res.json({
            success: true,
            traces,
            total: traces.length
        });
    } catch (error) {
        logger.error('Get community traces error:', error);
        res.status(500).json({ error: 'Failed to get community traces' });
    }
});

module.exports = router;
