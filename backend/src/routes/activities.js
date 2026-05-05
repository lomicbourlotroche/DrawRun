/**
 * ============================================================
 * ACTIVITIES ROUTES
 * ============================================================
 * Gestion des activités sportives
 * 
 * @swagger
 * tags:
 *   name: Activities
 *   description: Activity tracking & management
 */

'use strict';

const express = require('express');
const { verifyToken } = require('../auth');
const { getUserDb, dbGetUser, dbRunUser, dbAllUser, dbGetMain, dbAllMain } = require('../database');
const { validatePagination, validateBody, validateActivityBody } = require('../validators');
const metrics = require('../metrics_calculator');
const { logger } = require('../logger');
const { enrichActivitiesWithDraws } = require('../services/queryOptimizer');

const router = express.Router();

/**
 * @swagger
 * /activities:
 *   get:
 *     summary: List user activities with pagination
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: per_page
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Items per page (max 100)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by activity type (Run, Bike, Swim, etc.)
 *       - in: query
 *         name: start_date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter activities from this date
 *       - in: query
 *         name: start_date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter activities to this date
 *     responses:
 *       200:
 *         description: Paginated list of activities
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Activity'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     per_page:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     total_pages:
 *                       type: integer
 *                     has_next:
 *                       type: boolean
 *                     has_prev:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 */

router.get('/', verifyToken, async (req, res) => {
    try {
        const userDb = await getUserDb(req.user.id);
        const { page = 1, per_page = 20, type, start_date_from, start_date_to } = req.query;
        const { page: safePage, perPage: safePerPage } = validatePagination(page, per_page);
        const offset = (safePage - 1) * safePerPage;
        
        // Build WHERE clause for filters
        const whereConditions = [];
        const whereParams = [];
        
        if (type) {
            whereConditions.push('type = ?');
            whereParams.push(type);
        }
        if (start_date_from) {
            whereConditions.push('start_date >= ?');
            whereParams.push(start_date_from);
        }
        if (start_date_to) {
            whereConditions.push('start_date <= ?');
            whereParams.push(start_date_to);
        }
        
        const whereClause = whereConditions.length > 0 
            ? 'WHERE ' + whereConditions.join(' AND ') 
            : '';
        
        // Get total count for pagination metadata
        const countResult = await dbGetUser(userDb, 
            `SELECT COUNT(*) as total FROM activities ${whereClause}`,
            whereParams
        );
        const total = countResult?.total || 0;
        const totalPages = Math.ceil(total / safePerPage);
        
        // Get activities with pagination
        const activities = await dbAllUser(userDb, `
            SELECT id, name, type, start_date, distance, moving_time, 
                   average_speed, average_heartrate, calories, total_elevation_gain
            FROM activities 
            ${whereClause}
            ORDER BY start_date DESC
            LIMIT ? OFFSET ?
        `, [...whereParams, safePerPage, offset]);
        
        // Enrich activities with draw counts and user draw status (optimized batch loading)
        let enrichedActivities = activities;
        try {
            enrichedActivities = await enrichActivitiesWithDraws(activities, req.user.id);
        } catch (drawError) {
            // If draw queries fail, still return activities without draw data
            logger.warn('Failed to enrich activities with draw data:', drawError.message);
            enrichedActivities = activities.map(activity => ({
                ...activity,
                user_id: req.user.id,
                draw_count: 0,
                has_drawn: false
            }));
        }
        
        // Build pagination response
        const response = {
            data: enrichedActivities,
            pagination: {
                page: safePage,
                per_page: safePerPage,
                total: total,
                total_pages: totalPages,
                has_next: safePage < totalPages,
                has_prev: safePage > 1
            }
        };
        
        res.json(response);
    } catch (error) {
        logger.error('Get activities error', { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Failed to fetch activities' });
    }
});

/**
 * @swagger
 * /activities/create:
 *   post:
 *     summary: Create manual activity
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, name, start_date]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [Run, Bike, Swim, Other]
 *               name:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               distance:
 *                 type: number
 *               moving_time:
 *                 type: integer
 *               average_speed:
 *                 type: number
 *               average_heartrate:
 *                 type: number
 *     responses:
 *       200:
 *         description: Activity created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/create', verifyToken, validateBody(validateActivityBody), async (req, res) => {
    try {
        const { type, name, start_date, distance, moving_time, average_speed, 
                average_heartrate, max_heartrate, calories, map_polyline,
                elev_high, elev_low } = req.body;
        
        const userDb = await getUserDb(req.user.id);
        
        await dbRunUser(userDb, `
            INSERT INTO activities (user_id, source, source_id, name, type, start_date, distance, moving_time,
                        average_speed, average_heartrate, max_heartrate, calories,
                        map_polyline, elev_high, elev_low, is_manual)
            VALUES (?, 'manual', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, [req.user.id, 'manual-' + Date.now(), name, type, start_date, distance, moving_time, 
             average_speed, average_heartrate, max_heartrate, calories,
             map_polyline, elev_high, elev_low]);
        
        // Calculer les métriques
        if (average_heartrate) {
            await metrics.calculateAndStoreMetrics(req.user.id, userDb);
        }
        
        res.json({ success: true, message: 'Activity created successfully' });
    } catch (error) {
        logger.error('Create activity error', { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Failed to create activity' });
    }
});

module.exports = router;
