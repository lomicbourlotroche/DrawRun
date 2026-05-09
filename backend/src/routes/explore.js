'use strict';

/* eslint-disable unused-imports/no-unused-vars */

const express = require('express');
const { verifyToken } = require('../auth');
const segments = require('../services/segments.service');
const routes = require('../services/routes.service');
const { dbGetMain, dbAllMain } = require('../database');
const elevationService = require('../services/elevation.service');
const { logger } = require('../logger');

const router = express.Router();

const dbGet = (q, p) => dbGetMain(q, p);
const dbAll = (q, p) => dbAllMain(q, p);

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
        
        if (lat && lng) {
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
        const segment = await segments.getSegment(parseInt(req.params.id));
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
        const leaderboard = await segments.getSegmentLeaderboard(parseInt(req.params.id));
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
        const efforts = await segments.getUserSegmentEfforts(req.user.id, parseInt(req.params.id));
        res.json({ success: true, efforts });
    } catch (error) {
        logger.error('Get user efforts error:', error);
        res.status(500).json({ error: 'Failed to get efforts' });
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
        const publicRoutes = await routes.getPublicRoutes(
            type,
            difficulty,
            limit ? parseInt(limit) : 50,
            offset ? parseInt(offset) : 0
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
        const route = await routes.getRoute(parseInt(req.params.id), req.user.id);
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
        const result = await routes.addToFavorites(req.user.id, parseInt(req.params.id));
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
        const result = await routes.removeFromFavorites(req.user.id, parseInt(req.params.id));
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
        const result = await routes.incrementRouteUsage(parseInt(req.params.id));
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
        
        if (!lat || !lng) {
            return res.status(400).json({ error: 'Latitude and longitude required' });
        }
        
        // Calculate bounding box
        const latDelta = radius / 111000;
        const lngDelta = radius / (111000 * Math.cos(parseFloat(lat) * Math.PI / 180));
        
        const heatmapData = await dbGetMain(`
            SELECT lat, lng, SUM(intensity) as intensity
            FROM heatmap_data
            WHERE lat BETWEEN ? AND ?
              AND lng BETWEEN ? AND ?
              AND activity_type = ?
            GROUP BY lat, lng
            ORDER BY intensity DESC
            LIMIT 1000
        `, [
            parseFloat(lat) - latDelta,
            parseFloat(lat) + latDelta,
            parseFloat(lng) - lngDelta,
            parseFloat(lng) + lngDelta,
            type
        ]);
        
        res.json({
            success: true,
            heatmap: heatmapData || []
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
        
        const popularLocations = await dbAllMain(`
            SELECT lat, lng, intensity, activity_type
            FROM heatmap_data
            WHERE activity_type = ?
            ORDER BY intensity DESC
            LIMIT ?
        `, [type, parseInt(limit)]);
        
        res.json({
            success: true,
            locations: popularLocations || []
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

        if (!locations || !Array.isArray(locations) || locations.length < 2) {
            return res.status(400).json({ error: 'At least 2 locations required' });
        }

        // Validate coordinate format
        for (const loc of locations) {
            if (typeof loc.lat !== 'number' || typeof loc.lng !== 'number') {
                return res.status(400).json({ error: 'Each location must have lat and lng as numbers' });
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

module.exports = router;
