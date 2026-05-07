/* eslint-disable unused-imports/no-unused-vars */
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
            INSERT INTO activities (source, source_id, name, type, start_date, distance, moving_time,
                        average_speed, average_heartrate, max_heartrate, calories,
                        map_polyline, elev_high, elev_low, is_manual)
            VALUES ('manual', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, ['manual-' + Date.now(), name, type, start_date, distance, moving_time, 
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
        const streams = await dbGetUser(userDb,
            `SELECT streams_data FROM activities WHERE id = ?`, [activityId]);
        if (!streams) {
            return res.status(404).json({ error: 'Activity not found' });
        }
        if (!streams.streams_data) {
            return res.json({});
        }
        try {
            res.json(JSON.parse(streams.streams_data));
        } catch {
            res.json({});
        }
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
            `SELECT distance, moving_time, average_heartrate, max_heartrate, average_cadence, streams_data FROM activities WHERE id = ?`,
            [activityId]);
        if (!activity) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        // Parse streams pour calculer les splits
        let streams = {};
        if (activity.streams_data) {
            try { streams = JSON.parse(activity.streams_data); } catch { /* ignore */ }
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

                splits.push({
                    split: splitNum++,
                    duration: Math.round(splitDuration),
                    distance: Math.round(splitDistance),
                    speed: Math.round(speed * 10) / 10,
                    pace: pace ? Math.round(pace) : null,
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

        const avgHR = activity.average_heartrate;
        const maxHR = activity.max_heartrate;
        const dist = activity.distance || 0;
        const time = activity.moving_time || 0;
        const elev = activity.total_elevation_gain || 0;

        const analysis = {};

        // FC analysis
        if (avgHR && fcm) {
            analysis.avgHrPercent = Math.round((avgHR / fcm) * 100);
            analysis.maxHrPercent = maxHR ? Math.round((maxHR / fcm) * 100) : null;
            analysis.hrReserve = Math.round(((avgHR - restingHR) / (fcm - restingHR)) * 100);
            analysis.profileFcm = fcm;

            // TRIMP
            const hrRatio = (avgHR - restingHR) / (fcm - restingHR);
            const gender = 1.92; // male default
            analysis.trimp = Math.round((time / 60) * hrRatio * 0.64 * Math.exp(gender * hrRatio));

            // Zones (5 zones basées sur FCM)
            const zones = [
                { max: fcm * 0.60 },
                { max: fcm * 0.70 },
                { max: fcm * 0.80 },
                { max: fcm * 0.90 },
                { max: fcm },
            ];
            const zone = zones.findIndex(z => avgHR <= z.max);
            analysis.zone1Percent = zone === 0 ? 100 : 0;
            analysis.zone2Percent = zone === 1 ? 100 : 0;
            analysis.zone3Percent = zone === 2 ? 100 : 0;
            analysis.zone4Percent = zone === 3 ? 100 : 0;
            analysis.zone5Percent = zone >= 4 ? 100 : 0;
        }

        // Elevation
        if (elev > 0) {
            analysis.elevMin = null;
            analysis.elevMax = null;
            analysis.estimatedGrade = dist > 0 ? Math.round((elev / dist) * 100 * 10) / 10 : 0;
        }

        // Pace & VDOT
        if (dist > 0 && time > 0) {
            const paceSecPerKm = time / (dist / 1000);
            analysis.paceFormatted = `${Math.floor(paceSecPerKm / 60)}'${String(Math.round(paceSecPerKm % 60)).padStart(2, '0')}`;
            analysis.tss = activity.tss || null;

            // VDOT estimé depuis la performance
            if (dist >= 1000) {
                const { RunningPerformance } = require('../algorithms/index');
                try {
                    const estVdot = RunningPerformance.estimateVDOT(dist / 1000, time / 60);
                    analysis.estimatedVdot = estVdot ? Math.round(estVdot * 10) / 10 : null;
                    if (estVdot) {
                        const preds = RunningPerformance.predictRaceTimes(estVdot);
                        analysis.predicted5k = preds?.['5k'] ? Math.round(preds['5k'] * 60) : null;
                        analysis.predicted10k = preds?.['10k'] ? Math.round(preds['10k'] * 60) : null;
                        analysis.predictedHalfMarathon = preds?.['half'] ? { time: `${Math.floor(preds['half'])}:${String(Math.round((preds['half'] % 1) * 60)).padStart(2, '0')}` } : null;
                        analysis.predictedMarathon = preds?.['marathon'] ? { time: `${Math.floor(preds['marathon'])}:${String(Math.round((preds['marathon'] % 1) * 60)).padStart(2, '0')}` } : null;
                    }
                } catch { /* ignore */ }
            }
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

        // Parser le GPX (XML simple)
        const parseGpx = (xml) => {
            const getTag = (str, tag) => {
                const m = str.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i'));
                return m ? m[1].trim() : null;
            };
            const getAllTags = (str, tag) => {
                const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'gi');
                const results = [];
                let m;
                while ((m = re.exec(str)) !== null) results.push(m[1]);
                return results;
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
            const latlng = [];
            const hrArr = [];
            const altArr = [];
            const cadArr = [];
            const distArr = [0];
            const timeArr = [0];

            for (let i = 1; i < trkpts.length; i++) {
                const p1 = trkpts[i - 1], p2 = trkpts[i];
                // Haversine
                const R = 6371000;
                const dLat = (p2.lat - p1.lat) * Math.PI / 180;
                const dLon = (p2.lon - p1.lon) * Math.PI / 180;
                const a = Math.sin(dLat / 2) ** 2 + Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
                const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                totalDist += d;
                distArr.push(Math.round(totalDist));

                if (p2.ele > p1.ele) elevGain += p2.ele - p1.ele;
                if (p2.hr) hrArr.push(p2.hr);
                if (p2.ele) altArr.push(p2.ele);
                if (p2.cad) cadArr.push(p2.cad);
                latlng.push([p2.lat, p2.lon]);

                if (p1.time && p2.time) {
                    timeArr.push(Math.round((p2.time - trkpts[0].time) / 1000));
                } else {
                    timeArr.push(i);
                }
            }
            latlng.unshift([trkpts[0].lat, trkpts[0].lon]);

            const duration = trkpts[0].time && trkpts[trkpts.length - 1].time
                ? Math.round((trkpts[trkpts.length - 1].time - trkpts[0].time) / 1000)
                : trkpts.length;

            const avgHR = hrArr.length ? Math.round(hrArr.reduce((a, b) => a + b, 0) / hrArr.length) : null;
            const avgSpeed = duration > 0 ? (totalDist / duration) : 0;

            // Polyline simplifiée (premier et dernier point)
            const polyline = latlng.length > 0 ? `${latlng[0][0]},${latlng[0][1]}` : null;

            return {
                distance: Math.round(totalDist),
                duration,
                elevGain: Math.round(elevGain),
                avgHR,
                avgSpeed,
                startDate: trkpts[0].time ? trkpts[0].time.toISOString() : new Date().toISOString(),
                streams: { latlng, distance: distArr, time: timeArr, altitude: altArr, heartrate: hrArr, cadence: cadArr },
                polyline,
            };
        };

        const parsed = parseGpx(gpxData);
        if (!parsed) {
            return res.status(400).json({ error: 'Invalid GPX file or no trackpoints found' });
        }

        const activityName = name || 'Activité GPX';
        const userDb = await getUserDb(req.user.id);

        await dbRunUser(userDb, `
            INSERT INTO activities (source, source_id, name, type, start_date, distance, moving_time,
                        average_speed, average_heartrate, total_elevation_gain, map_polyline, streams_data, is_manual)
            VALUES ('gpx', ?, ?, 'run', ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, [
            'gpx-' + Date.now(),
            activityName,
            parsed.startDate,
            parsed.distance,
            parsed.duration,
            Math.round(parsed.avgSpeed * 100) / 100,
            parsed.avgHR,
            parsed.elevGain,
            parsed.polyline,
            JSON.stringify(parsed.streams),
        ]);

        // Recalculer les métriques
        try {
            await metrics.calculateAndStoreMetrics(req.user.id, userDb);
        } catch { /* non-bloquant */ }

        res.json({
            success: true,
            distance: parsed.distance,
            duration: parsed.duration,
            trackpoints: parsed.streams.latlng.length,
        });
    } catch (error) {
        logger.error('GPX import error', { error: error.message });
        res.status(500).json({ error: 'Failed to import GPX file' });
    }
});

module.exports = router;
