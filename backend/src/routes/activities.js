/* eslint-disable unused-imports/no-unused-vars, security/detect-object-injection, security/detect-non-literal-regexp */
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
        const {
            type, name, start_date, distance, moving_time, average_speed,
            average_heartrate, max_heartrate, calories, map_polyline,
            elev_high, elev_low, total_elevation_gain, notes, description,
        } = req.body;

        if (!name || !String(name).trim()) {
            return res.status(400).json({ error: 'name is required' });
        }

        const userDb = await getUserDb(req.user.id);

        const result = await dbRunUser(userDb, `
            INSERT INTO activities (source, source_id, name, type, start_date, distance, moving_time,
                        average_speed, average_heartrate, max_heartrate, calories,
                        map_polyline, elev_high, elev_low, total_elevation_gain,
                        description, notes, is_manual)
            VALUES ('manual', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, [
            'manual-' + Date.now(),
            String(name).trim(),
            type,
            start_date,
            distance || null,
            moving_time || null,
            average_speed || null,
            average_heartrate || null,
            max_heartrate || null,
            calories || null,
            map_polyline || null,
            elev_high || null,
            elev_low || null,
            total_elevation_gain || null,
            description || notes || null,
            notes || null,
        ]);

        // Toujours calculer les métriques après création manuelle
        try {
            await metrics.calculateAndStoreMetrics(req.user.id, userDb);
        } catch (e) {
            logger.warn('Metrics calculation failed after manual activity creation', { error: e.message });
        }

        res.json({ success: true, id: result.lastID, message: 'Activity created successfully' });
    } catch (error) {
        logger.error('Create activity error', { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Failed to create activity' });
    }
});

// GET /api/activities/:id — détail d'une activité
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const activityId = parseInt(req.params.id);
        if (!activityId || activityId <= 0) {
            return res.status(400).json({ error: 'Invalid activity ID' });
        }
        const userDb = await getUserDb(req.user.id);
        const activity = await dbGetUser(userDb,
            `SELECT * FROM activities WHERE id = ?`, [activityId]);
        if (!activity) {
            return res.status(404).json({ error: 'Activity not found' });
        }
        res.json(activity);
    } catch (error) {
        logger.error('Get activity error', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch activity' });
    }
});

// GET /api/activities/:id/streams — données temps réel (FC, vitesse, altitude, GPS)
router.get('/:id/streams', verifyToken, async (req, res) => {
    try {
        const activityId = parseInt(req.params.id);
        if (!activityId || activityId <= 0) {
            return res.status(400).json({ error: 'Invalid activity ID' });
        }
        const userDb = await getUserDb(req.user.id);
        
        // Récupérer tous les streams depuis la table activity_streams
        const streamRows = await dbAllUser(userDb,
            `SELECT stream_type, data FROM activity_streams WHERE activity_id = ?`, 
            [activityId]
        );

        if (!streamRows || streamRows.length === 0) {
            return res.json({});
        }

        // Construire l'objet streams
        const streams = {};
        for (const row of streamRows) {
            try {
                streams[row.stream_type] = JSON.parse(row.data);
            } catch (e) {
                logger.warn(`Failed to parse stream ${row.stream_type}`, { error: e.message });
            }
        }

        res.json(streams);
    } catch (error) {
        logger.error('Get streams error', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch streams' });
    }
});

// GET /api/activities/:id/splits — splits par kilomètre
router.get('/:id/splits', verifyToken, async (req, res) => {
    try {
        const activityId = parseInt(req.params.id);
        if (!activityId || activityId <= 0) {
            return res.status(400).json({ error: 'Invalid activity ID' });
        }
        const userDb = await getUserDb(req.user.id);
        const activity = await dbGetUser(userDb,
            `SELECT distance, moving_time, average_heartrate, max_heartrate, average_cadence FROM activities WHERE id = ?`,
            [activityId]);
        if (!activity) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        // Récupérer les streams depuis activity_streams
        const streamRows = await dbAllUser(userDb,
            `SELECT stream_type, data FROM activity_streams WHERE activity_id = ?`, 
            [activityId]
        );

        const streams = {};
        for (const row of streamRows) {
            try {
                streams[row.stream_type] = JSON.parse(row.data);
            } catch (e) {
                logger.warn(`Failed to parse stream ${row.stream_type}`, { error: e.message });
            }
        }

        const unit = req.query.unit === 'mi' ? 'mi' : 'km';
        const splitDist = unit === 'mi' ? 1609.34 : 1000;

        // Si pas de streams, retourner un split global
        if (!streams.distance || !Array.isArray(streams.distance)) {
            const totalDist = activity.distance || 0;
            const totalTime = activity.moving_time || 0;
            const numSplits = Math.ceil(totalDist / splitDist);
            const splits = [];
            for (let i = 1; i <= numSplits; i++) {
                const isPartial = i === numSplits && (totalDist % splitDist) > 0;
                const splitDistance = isPartial ? (totalDist % splitDist) : splitDist;
                const splitTime = totalTime / numSplits;
                splits.push({
                    split: i,
                    duration: Math.round(splitTime),
                    distance: splitDistance,
                    speed: splitDistance / splitTime * 3.6,
                    pace: splitTime / (splitDistance / 1000),
                    avgHR: activity.average_heartrate || null,
                    maxHR: activity.max_heartrate || null,
                    elevationChange: 0,
                    gradient: 0,
                    avgCadence: activity.average_cadence || null,
                    avgWatts: null,
                    isPartial,
                });
            }
            return res.json({
                splits,
                summary: {
                    unit,
                    elevationGain: 0,
                    averageHR: activity.average_heartrate || null,
                    maxHR: activity.max_heartrate || null,
                    averageCadence: activity.average_cadence || null,
                    averageWatts: null,
                },
            });
        }

        // Calculer les splits depuis les streams
        const distArr = streams.distance;
        const timeArr = streams.time || distArr.map((_, i) => i);
        const hrArr = streams.heartrate || null;
        const altArr = streams.altitude || null;
        const cadArr = streams.cadence || null;
        const wattsArr = streams.watts || null;

        const splits = [];
        let splitStart = 0;
        let splitNum = 1;
        let totalElevGain = 0;

        for (let i = 1; i < distArr.length; i++) {
            if (distArr[i] - distArr[splitStart] >= splitDist || i === distArr.length - 1) {
                const isPartial = i === distArr.length - 1 && distArr[i] - distArr[splitStart] < splitDist;
                const splitDuration = timeArr[i] - timeArr[splitStart];
                const splitDistance = distArr[i] - distArr[splitStart];
                const speed = splitDuration > 0 ? (splitDistance / splitDuration) * 3.6 : 0;
                const pace = speed > 0 ? 3600 / speed : null;

                const hrSlice = hrArr ? hrArr.slice(splitStart, i + 1).filter(Boolean) : [];
                const altSlice = altArr ? altArr.slice(splitStart, i + 1) : [];
                const cadSlice = cadArr ? cadArr.slice(splitStart, i + 1).filter(Boolean) : [];
                const wattsSlice = wattsArr ? wattsArr.slice(splitStart, i + 1).filter(Boolean) : [];

                const avgHR = hrSlice.length ? Math.round(hrSlice.reduce((a, b) => a + b, 0) / hrSlice.length) : null;
                const maxHR = hrSlice.length ? Math.max(...hrSlice) : null;
                const avgCad = cadSlice.length ? Math.round(cadSlice.reduce((a, b) => a + b, 0) / cadSlice.length) : null;
                const avgWatts = wattsSlice.length ? Math.round(wattsSlice.reduce((a, b) => a + b, 0) / wattsSlice.length) : null;

                let elevChange = 0;
                if (altSlice.length >= 2) {
                    elevChange = Math.round(altSlice[altSlice.length - 1] - altSlice[0]);
                    const gain = altSlice.reduce((acc, v, idx) => idx > 0 && v > altSlice[idx - 1] ? acc + (v - altSlice[idx - 1]) : acc, 0);
                    totalElevGain += gain;
                }
                const gradient = splitDistance > 0 ? Math.round((elevChange / splitDistance) * 100 * 10) / 10 : 0;
                
                // Calculer GAP
                const { RunningPerformance } = require('../algorithms');
                const gap = pace ? Math.round(RunningPerformance.calculateGAP(pace, gradient / 100)) : null;

                splits.push({
                    split: splitNum++,
                    duration: Math.round(splitDuration),
                    distance: Math.round(splitDistance),
                    speed: Math.round(speed * 10) / 10,
                    pace: pace ? Math.round(pace) : null,
                    gap,
                    avgHR,
                    maxHR,
                    elevationChange: elevChange,
                    gradient,
                    avgCadence: avgCad,
                    avgWatts,
                    isPartial,
                });
                splitStart = i;
            }
        }

        const allHR = hrArr ? hrArr.filter(Boolean) : [];
        res.json({
            splits,
            summary: {
                unit,
                elevationGain: Math.round(totalElevGain),
                averageHR: allHR.length ? Math.round(allHR.reduce((a, b) => a + b, 0) / allHR.length) : null,
                maxHR: allHR.length ? Math.max(...allHR) : null,
                averageCadence: cadArr ? Math.round(cadArr.filter(Boolean).reduce((a, b) => a + b, 0) / cadArr.filter(Boolean).length) : null,
                averageWatts: wattsArr ? Math.round(wattsArr.filter(Boolean).reduce((a, b) => a + b, 0) / wattsArr.filter(Boolean).length) : null,
            },
        });
    } catch (error) {
        logger.error('Get splits error', { error: error.message });
        res.status(500).json({ error: 'Failed to compute splits' });
    }
});

// GET /api/activities/:id/analysis — analyse avancée (VDOT, zones, TRIMP)
router.get('/:id/analysis', verifyToken, async (req, res) => {
    try {
        const activityId = parseInt(req.params.id);
        if (!activityId || activityId <= 0) {
            return res.status(400).json({ error: 'Invalid activity ID' });
        }
        const userDb = await getUserDb(req.user.id);
        const activity = await dbGetUser(userDb, `SELECT * FROM activities WHERE id = ?`, [activityId]);
        if (!activity) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        // Récupérer le profil utilisateur pour FCM, VDOT
        const user = await dbGetMain('SELECT profile_data FROM users WHERE id = ?', [req.user.id]);
        let fcm = 180, vdot = null, restingHR = 60;
        if (user?.profile_data) {
            try {
                const p = JSON.parse(user.profile_data);
                fcm = p.fcm || p.max_heart_rate || 180;
                vdot = p.vdot || null;
                restingHR = p.restingHR || p.resting_heart_rate || 60;
            } catch { /* ignore */ }
        }

        const { SportAnalysis } = require('../algorithms/index');
        const profileData = user?.profile_data ? JSON.parse(user.profile_data) : {};
        const avgHR = activity.average_heartrate;
        
        // Use the centralized SportAnalysis engine
        const sportAnalysis = SportAnalysis.analyze(activity, profileData);
        
        // Merging with legacy structure expected by frontend
        const analysis = {
            ...sportAnalysis,
            avgHrPercent: sportAnalysis.zones?.percent || null,
            profileFcm: fcm,
            hrReserve: avgHR ? Math.round(((avgHR - restingHR) / (fcm - restingHR)) * 100) : null,
            estimatedVdot: sportAnalysis.vdot,
            paceFormatted: sportAnalysis.pace?.formatted,
            estimatedGrade: activity.distance > 0 ? Math.round(((activity.total_elevation_gain || 0) / activity.distance) * 100 * 10) / 10 : 0,
        };

        // Add predictions if VDOT is available
        if (analysis.estimatedVdot) {
            const { RunningPerformance } = require('../algorithms/index');
            const preds = RunningPerformance.predictRaceTimes(analysis.estimatedVdot);
            analysis.predicted5k = preds?.['5k'] ? Math.round(preds['5k'] * 60) : null;
            analysis.predicted10k = preds?.['10k'] ? Math.round(preds['10k'] * 60) : null;
            analysis.predictedHalfMarathon = preds?.['half'] ? { time: `${Math.floor(preds['half'])}:${String(Math.round((preds['half'] % 1) * 60)).padStart(2, '0')}` } : null;
            analysis.predictedMarathon = preds?.['marathon'] ? { time: `${Math.floor(preds['marathon'])}:${String(Math.round((preds['marathon'] % 1) * 60)).padStart(2, '0')}` } : null;
        }

        res.json(analysis);
    } catch (error) {
        logger.error('Get analysis error', { error: error.message });
        res.status(500).json({ error: 'Failed to compute analysis' });
    }
});

// POST /api/activities/import/gpx — import d'un fichier GPX
router.post('/import/gpx', verifyToken, async (req, res) => {
    try {
        const { name, gpxData } = req.body;
        if (!gpxData) {
            return res.status(400).json({ error: 'gpxData is required' });
        }

        // GPX size protection
        const GPX_MAX_SIZE = 5 * 1024 * 1024; // 5MB
        if (gpxData.length > GPX_MAX_SIZE) {
            return res.status(413).json({ error: 'GPX file too large (max 5MB)' });
        }

        // Parser le GPX (XML simple)
        const parseGpx = (xml) => {
            const getTag = (str, tag) => {
                const m = str.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i'));
                return m ? m[1].trim() : null;
            };
            const getAttr = (str, attr) => {
                const m = str.match(new RegExp(`${attr}="([^"]+)"`));
                return m ? m[1] : null;
            };

            // Extraire les trackpoints
            const trkpts = [];
            const trkptRe = /<trkpt([^>]*)>([\s\S]*?)<\/trkpt>/gi;
            let m;
            while ((m = trkptRe.exec(xml)) !== null) {
                const attrs = m[1];
                const content = m[2];
                const lat = parseFloat(getAttr(attrs, 'lat'));
                const lon = parseFloat(getAttr(attrs, 'lon'));
                const ele = parseFloat(getTag(content, 'ele') || '0');
                const timeStr = getTag(content, 'time');
                const hr = getTag(content, 'gpxtpx:hr') || getTag(content, 'ns3:hr') || getTag(content, 'hr');
                const cad = getTag(content, 'gpxtpx:cad') || getTag(content, 'ns3:cad') || getTag(content, 'cad');
                if (!isNaN(lat) && !isNaN(lon)) {
                    trkpts.push({ lat, lon, ele, time: timeStr ? new Date(timeStr) : null, hr: hr ? parseInt(hr) : null, cad: cad ? parseInt(cad) : null });
                }
            }

            if (trkpts.length < 2) return null;

            // Calculer distance, durée, dénivelé
            let totalDist = 0;
            let elevGain = 0;
            let elevLoss = 0;
            let minEle = trkpts[0].ele;
            let maxEle = trkpts[0].ele;
            const latlng = [[trkpts[0].lat, trkpts[0].lon]];
            const hrArr = [];
            const altArr = [trkpts[0].ele];
            const cadArr = [];
            const distArr = [0];
            const timeArr = [0];

            for (let i = 1; i < trkpts.length; i++) {
                const p1 = trkpts[i - 1], p2 = trkpts[i];
                const R = 6371000;
                const dLat = (p2.lat - p1.lat) * Math.PI / 180;
                const dLon = (p2.lon - p1.lon) * Math.PI / 180;
                const a = Math.sin(dLat / 2) ** 2 + Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
                const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                totalDist += d;
                distArr.push(Math.round(totalDist));
                latlng.push([p2.lat, p2.lon]);
                altArr.push(p2.ele);

                if (p2.ele > p1.ele) elevGain += p2.ele - p1.ele;
                else if (p2.ele < p1.ele) elevLoss += p1.ele - p2.ele;
                if (p2.ele < minEle) minEle = p2.ele;
                if (p2.ele > maxEle) maxEle = p2.ele;

                if (p2.hr) hrArr.push(p2.hr);
                if (p2.cad) cadArr.push(p2.cad);

                if (p1.time && p2.time) {
                    timeArr.push(Math.round((p2.time - trkpts[0].time) / 1000));
                } else {
                    timeArr.push(i);
                }
            }

            const duration = trkpts[0].time && trkpts[trkpts.length - 1].time
                ? Math.round((trkpts[trkpts.length - 1].time - trkpts[0].time) / 1000)
                : trkpts.length;

            const avgHR = hrArr.length ? Math.round(hrArr.reduce((a, b) => a + b, 0) / hrArr.length) : null;
            const maxHR = hrArr.length ? Math.max(...hrArr) : null;
            const avgSpeed = duration > 0 ? (totalDist / duration) : 0;

            return {
                distance: Math.round(totalDist),
                duration,
                elevGain: Math.round(elevGain),
                elevLoss: Math.round(elevLoss),
                elevMin: Math.round(minEle),
                elevMax: Math.round(maxEle),
                avgHR,
                maxHR,
                avgSpeed,
                startDate: trkpts[0].time ? trkpts[0].time.toISOString() : new Date().toISOString(),
                streams: { latlng, distance: distArr, time: timeArr, altitude: altArr, heartrate: hrArr, cadence: cadArr },
                mapPolyline: JSON.stringify(latlng),
            };
        };

        const parsed = parseGpx(gpxData);
        if (!parsed) {
            return res.status(400).json({ error: 'Invalid GPX file or no trackpoints found' });
        }

        const activityName = name || 'Activité GPX';
        const activityType = req.body.type || 'run'; // allow caller to specify type
        const userDb = await getUserDb(req.user.id);

        const result = await dbRunUser(userDb, `
            INSERT INTO activities (source, source_id, name, type, start_date, distance, moving_time,
                        average_speed, average_heartrate, max_heartrate, total_elevation_gain,
                        elev_high, elev_low, map_polyline, is_manual)
            VALUES ('gpx', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, [
            'gpx-' + Date.now(),
            activityName,
            activityType,
            parsed.startDate,
            parsed.distance,
            parsed.duration,
            Math.round(parsed.avgSpeed * 100) / 100,
            parsed.avgHR,
            parsed.maxHR,
            parsed.elevGain,
            parsed.elevMax,
            parsed.elevMin,
            parsed.mapPolyline,
        ]);

        const activityId = result.lastID;

        // Stocker les streams dans activity_streams
        if (activityId) {
            const streamTypes = {
                latlng: parsed.streams.latlng,
                distance: parsed.streams.distance,
                time: parsed.streams.time,
                altitude: parsed.streams.altitude,
                heartrate: parsed.streams.heartrate.length > 0 ? parsed.streams.heartrate : null,
                cadence: parsed.streams.cadence.length > 0 ? parsed.streams.cadence : null,
            };
            for (const [streamType, data] of Object.entries(streamTypes)) {
                if (data && (Array.isArray(data) ? data.length > 0 : true)) {
                    try {
                        await dbRunUser(userDb, `
                            INSERT OR REPLACE INTO activity_streams (activity_id, stream_type, data)
                            VALUES (?, ?, ?)
                        `, [activityId, streamType, JSON.stringify(data)]);
                    } catch (e) {
                        logger.warn(`GPX stream insert failed: ${streamType}`, { error: e.message });
                    }
                }
            }
        }

        // Recalculer les métriques
        try {
            await metrics.calculateAndStoreMetrics(req.user.id, userDb);
        } catch { /* non-bloquant */ }

        res.json({
            success: true,
            id: activityId,
            distance: parsed.distance,
            duration: parsed.duration,
            elevationGain: parsed.elevGain,
            trackpoints: parsed.streams.latlng.length,
        });
    } catch (error) {
        logger.error('GPX import error', { error: error.message });
        res.status(500).json({ error: 'Failed to import GPX file' });
    }
});

/**
 * PUT /activities/:id
 * Update activity metadata (gear, notes, etc.)
 */
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const userDb = await getUserDb(req.user.id);
        const activityId = req.params.id;
        const { gear_id, efficiency_factor, notes, name } = req.body;

        const activity = await dbGetUser(userDb, 'SELECT * FROM activities WHERE id = ?', [activityId]);
        if (!activity) {
            return res.status(404).json({ error: 'Activité non trouvée' });
        }

        // Update gear distance if gear_id changed or was added
        if (gear_id !== undefined && gear_id !== activity.gear_id) {
            const distanceKm = (activity.distance || 0) / 1000;
            
            // Add distance to new gear
            if (gear_id) {
                await dbRunUser(userDb, 'UPDATE gear SET current_distance = current_distance + ? WHERE id = ?', [distanceKm, gear_id]);
            }
            
            // Subtract distance from old gear if existed
            if (activity.gear_id) {
                await dbRunUser(userDb, 'UPDATE gear SET current_distance = current_distance - ? WHERE id = ?', [distanceKm, activity.gear_id]);
            }
        }

        await dbRunUser(userDb, `
            UPDATE activities 
            SET gear_id = ?, 
                efficiency_factor = ?, 
                description = COALESCE(?, description), 
                name = COALESCE(?, name)
            WHERE id = ?
        `, [
            gear_id !== undefined ? gear_id : activity.gear_id, 
            efficiency_factor !== undefined ? efficiency_factor : activity.efficiency_factor, 
            notes || null, 
            name || activity.name, 
            activityId
        ]);

        res.json({ success: true, message: 'Activité mise à jour' });
    } catch (error) {
        logger.error('Update activity error:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'activité' });
    }
});

module.exports = router;
