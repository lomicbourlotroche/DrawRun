'use strict';

const express = require('express');

const router = express.Router();

const { verifyToken } = require('../middleware/auth');

const { logger } = require('../utils/logger');

const { getUserDb, dbGetMain } = require('../database');

const { resolveUserConstants } = require('../services/userConstants.service');

const GpxUtils = require('../utils/gpx_utils');

const { RaceStrategy, RunningPerformance, PMC, Taper, Overtraining } = require('../algorithms/index');

const {

    analyzeGpxProfile, getPacingStrategy, generateScientificSplits,

    calculateNutritionStrategy,

} = require('../services/race-planning/helpers.service');

router.post('/calculate', verifyToken, async (req, res) => {

    try {

        const userId = req.user.id;

        const { distance: distanceInput,

            targetTime,

            targetPace,

            elevationProfile: elevationProfileInput = 'flat',

            fatigue = 0,

            temperature = 15,

            humidity = 50,

            altitude = 0,

            windSpeed = 0,

            gpxData,           // NEW: GPX file content

            strategyBias = 0,  // NEW: -1 (negative split) to +1 (positive split), 0 = even

        } = req.body;

        // === GPX Mode: parse and auto-detect terrain ===

        let gpxProfile = null;

        let gpxPoints = null;

        if (gpxData) {

            gpxPoints = GpxUtils.parse(gpxData);

            if (!gpxPoints || gpxPoints.length < 2) {

                return res.status(400).json({ error: 'Fichier GPX invalide ou sans points de trace' });

            }

            gpxProfile = analyzeGpxProfile(gpxPoints);

        }

        // Use GPX-derived distance if available, else use input

        const distance = gpxProfile ? gpxProfile.totalDistM / 1000 : distanceInput;

        // Validation

        const errors = [];

        if (!distance || distance <= 0 || distance > 200) {

            errors.push('Distance must be between 0.1 and 200 km');

        }

        // targetTime/targetPace facultatif si VDOT disponible pour prédiction

        if (!targetTime && !targetPace) {

            // Sera géré plus bas via VDOT auto-prediction

        } else if (targetTime && !/^\d{1,2}:\d{2}:\d{2}$/.test(targetTime)) {

            errors.push('targetTime must be in HH:MM:SS format');

        }

        if (targetPace && (targetPace <= 0 || targetPace > 600)) {

            errors.push('targetPace must be between 1 and 600 sec/km');

        }

        if (fatigue < 0 || fatigue > 10) {

            errors.push('fatigue must be between 0 and 10');

        }

        if (strategyBias < -1 || strategyBias > 1) {

            errors.push('strategyBias must be between -1 and 1');

        }

        if (errors.length > 0) {

            return res.status(400).json({ error: 'Paramètres invalides', details: errors });

        }

        // Auto-detect elevation profile from GPX, or use input

        const elevationProfile = gpxProfile ? gpxProfile.terrainType : elevationProfileInput;

        if (!['flat', 'rolling', 'mountainous'].includes(elevationProfile)) {

            return res.status(400).json({ error: 'elevationProfile must be flat, rolling, or mountainous' });

        }

        let fcm = 180;

        let userVdot = null;

        let weight = 70;

        let restingHR = 60;

        // Fetch user constants via the unified resolver (single source of truth)

        try {

            const constants = await resolveUserConstants(userId);

            fcm = constants.fcm || fcm;

            userVdot = constants.vdot || null;

            weight = constants.weight || weight;

            restingHR = constants.restingHR || restingHR;

        } catch (error) {

            logger.warn('[RacePlanning] Failed to resolve user constants', { error: error.message });

        }

        // Parse target time to seconds (ou prédiction VDOT auto)

        let targetPaceSec = targetPace;

        if (targetTime) {

            const [hours, minutes, seconds] = targetTime.split(':').map(Number);

            const totalSeconds = hours * 3600 + minutes * 60 + seconds;

            targetPaceSec = totalSeconds / distance;

        } else if (!targetPaceSec && userVdot && userVdot > 20) {

            // Prédiction automatique depuis VDOT

            try {

                const preds = RunningPerformance.predictRaceTimes(userVdot);

                 let raceKey = 'marathon';

                 if (distance <= 5) raceKey = '5k';

                 else if (distance <= 10) raceKey = '10k';

                 else if (distance <= 21.0975) raceKey = 'half';

                 // eslint-disable-next-line security/detect-object-injection

                 const targetHours = preds[raceKey];

                const targetDist = raceKey === 'marathon' ? 42.195 : raceKey === 'half' ? 21.0975 : raceKey === '10k' ? 10 : 5;

                if (targetHours && targetHours > 0) {

                    targetPaceSec = (targetHours * 3600) / targetDist;

                    // Ajustement pour distance non-standard (ex: 15km)

                    if (Math.abs(distance - targetDist) > 1) {

                        const riegelTime = RunningPerformance.predictRiegel(targetHours * 3600, targetDist, distance);

                        targetPaceSec = riegelTime / distance;

                    }

                }

            } catch (_) {

                // Fallback: pace par défaut basé sur VDOT

                if (userVdot > 50) targetPaceSec = 240 + (50 - userVdot) * 3;

                else if (userVdot > 35) targetPaceSec = 300 + (35 - userVdot) * 4;

                else targetPaceSec = 360;

            }

        } else if (!targetPaceSec) {

            // Fallback ultime pour les tests sans VDOT

            targetPaceSec = distance <= 5 ? 240 : distance <= 10 ? 300 : distance <= 21.0975 ? 330 : 360;

        }

        const totalRaceTime = targetPaceSec * distance;

        const totalRaceHours = totalRaceTime / 3600;

        // Environmental correction

        const envCorrection = RunningPerformance.applyEnvironmentalCorrection(

            targetPaceSec,

            { temperature, humidity, altitude, windSpeed }

        );

        const correctedPace = envCorrection.correctedPace;

        const envImpact = envCorrection.impact;

        // Elevation factors

         const elevationFactors = {

             flat: { up: 1.0, down: 1.0, gainPerKm: 0 },

             rolling: { up: 1.05, down: 0.97, gainPerKm: 15 },

             mountainous: { up: 1.12, down: 0.94, gainPerKm: 40 },

         };

         // eslint-disable-next-line security/detect-object-injection

         const elev = elevationFactors[elevationProfile];

        // Pacing strategy based on distance + terrain (scientifically optimized)

        const pacingStrategy = getPacingStrategy(distance, gpxProfile ? gpxProfile.kmSegments : null);

        // Generate splits with scientific pacing, elevation, and cardiac drift

        const splits = generateScientificSplits({

            distance,

            basePace: correctedPace,

            elevationProfile: elev,

            pacingStrategy,

            fcm,

            restingHR,

            totalRaceTime,

            weight,

            strategyBias,

            gpxKmSegments: gpxProfile ? gpxProfile.kmSegments : null,

            temperature,

        });

        // Multi-model race prediction

        let racePrediction = null;

        if (userVdot && userVdot > 20) {

            try {

                const multiModel = RunningPerformance.predictRaceTimeMultiModel(userVdot, distance);

                const dynamicVDOT = RunningPerformance.calculateDynamicVDOT?.([{

                    distance,

                    time: totalRaceTime,

                    date: new Date().toISOString(),

                }]);

                racePrediction = {

                    vdot: userVdot,

                    dynamicVDOT: dynamicVDOT?.vdot || userVdot,

                    models: multiModel,

                    recommendedPace: Math.round(multiModel.weightedTime / distance),

                    paceRange: {

                        optimistic: Math.round(multiModel.riegelTime / distance),

                        conservative: Math.round((multiModel.weightedTime * 1.05) / distance),

                    },

                };

            } catch (error) {

                logger.warn('[RacePlanning] VDOT prediction failed', { error: error.message });

            }

        }

        // TSB and fatigue analysis

        const warnings = [];

        let tsbValue = null;

        let ctlValue = null;

        let atlValue = null;

        try {

            const userDb = await getUserDb(userId);

            const activities = await userDb.exec(`

                SELECT tss, start_date FROM activities

                WHERE date(start_date) >= date('now', '-42 days')

                ORDER BY start_date

            `);

             if (activities[0]?.values?.length > 0) {

                 const dailyTSS = {};

                 /* eslint-disable security/detect-object-injection */

                 for (const row of activities[0].values) {

                     const date = row[1]?.split('T')[0] || row[1];

                     dailyTSS[date] = (dailyTSS[date] || 0) + (row[0] || 0);

                 }

                 const pmcData = [];

                 const dates = Object.keys(dailyTSS).sort();

                 for (const date of dates) {

                     pmcData.push({ date, tss: dailyTSS[date] });

                 }

                 /* eslint-enable security/detect-object-injection */

                if (pmcData.length > 0) {

                    const pmcResult = PMC.calculate(pmcData);

                    const lastPmc = pmcResult[pmcResult.length - 1];

                    ctlValue = lastPmc.ctl;

                    atlValue = lastPmc.atl;

                    tsbValue = lastPmc.tsb;

                    if (tsbValue < -20) {

                        warnings.push({

                            type: 'fatigue',

                            severity: 'high',

                            message: `TSB actuel (${Math.round(tsbValue)}) indique une fatigue élevée. Envisagez de reporter la course.`,

                        });

                    } else if (tsbValue < -10) {

                        warnings.push({

                            type: 'fatigue',

                            severity: 'moderate',

                            message: `TSB négatif (${Math.round(tsbValue)}) — fatigue modérée. Prévoyez un taper.`,

                        });

                    } else if (tsbValue > 10 && tsbValue < 25) {

                        warnings.push({

                            type: 'freshness',

                            severity: 'info',

                            message: `TSB positif (${Math.round(tsbValue)}) — bonne fraîcheur pour la course.`,

                        });

                    }

                    const acwr = atlValue > 0 ? ctlValue / atlValue : 1;

                    if (acwr > 1.5) {

                        warnings.push({

                            type: 'injury_risk',

                            severity: 'high',

                            message: `Ratio charge aiguë/chronique élevé (${acwr.toFixed(2)}). Risque de blessure accru.`,

                        });

                    }

                }

            }

        } catch (pmcErr) {
            logger.warn('PMC calculation error in race planning', { error: pmcErr.message });
        }

        // Overtraining check

        if (ctlValue !== null) {

            const otsCheck = Overtraining.detectOTS({

                performanceTrend: fatigue * -3,

                hrvRatio: fatigue > 7 ? 0.7 : fatigue > 4 ? 0.85 : 0.95,

                sleepQuality: fatigue > 6 ? 40 : fatigue > 3 ? 60 : 80,

                tsb: tsbValue || 0,

                acwr: atlValue > 0 ? ctlValue / atlValue : 1,

                consecutiveHardDays: Math.min(fatigue, 7),

            });

            if (otsCheck.level >= 3) {

                warnings.push({

                    type: 'overtraining',

                    severity: otsCheck.level >= 4 ? 'critical' : 'high',

                    message: `État de surentraînement détecté (${otsCheck.status}). ${otsCheck.recommendation}`,

                });

            }

        }

        // Taper recommendation

        let taperRecommendation = null;

        if (distance >= 10 && ctlValue !== null) {

            const daysToRace = Math.max(7, Math.min(21, Math.ceil(totalRaceHours * 3)));

            const distanceLabel = distance >= 42 ? 'marathon' : distance >= 21 ? 'half' : distance >= 10 ? '10k' : '5k';

            const athleteLevel = userVdot > 50 ? 'advanced' : userVdot > 35 ? 'intermediate' : 'beginner';

            taperRecommendation = Taper.calculateOptimalTaper(

                ctlValue,

                daysToRace,

                distanceLabel,

                athleteLevel,

            );

        }

        // Scientific nutrition strategy (Jeukendrup model)

        const nutritionStrategy = calculateNutritionStrategy({

            distance,

            totalRaceTime,

            weight,

            temperature,

            elevationProfile,

        });

        res.json({

            splits,

            racePrediction,

            nutritionStrategy,

            warnings,

            taperRecommendation,

            environmentalImpact: envImpact,

            pacingStrategy,

            gpxProfile,  // NEW: auto-detected terrain info

            summary: {

                distance,

                targetPace: Math.round(targetPaceSec),

                correctedPace: Math.round(correctedPace),

                totalTime: Math.round(totalRaceTime),

                correctedTotalTime: Math.round(correctedPace * distance),

                elevationProfile,

                elevationAutoDetected: !!gpxProfile,

                elevGain: gpxProfile ? gpxProfile.elevGain : null,

                elevLoss: gpxProfile ? gpxProfile.elevLoss : null,

                gainPerKm: gpxProfile ? gpxProfile.gainPerKm : null,

                fcm,

                vdot: userVdot,

                tsb: tsbValue ? Math.round(tsbValue) : null,

                ctl: ctlValue ? Math.round(ctlValue) : null,

                strategyBias,

            },

        });

    } catch (error) {

        logger.error('[RacePlanning] Calculation error', { error: error.message });

        res.status(500).json({ error: 'Failed to calculate race plan' });

    }

});

/**

 * POST /api/race-planning/save

 * Save a race plan for the user

 */

router.post('/save', verifyToken, async (req, res) => {

    try {

        const userId = req.user.id;

        const { name, distance, targetPace, totalTime, elevationProfile, fatigue, splits, nutritionStrategy } = req.body;

        // Validation

        const errors = [];

        if (!distance || distance <= 0 || distance > 200) {

            errors.push('Distance must be between 0.1 and 200 km');

        }

        if (!targetPace || targetPace <= 0 || targetPace > 600) {

            errors.push('Target pace must be between 1 and 600 seconds per km');

        }

        if (!splits || !Array.isArray(splits) || splits.length === 0) {

            errors.push('Splits must be a non-empty array');

        } else {

            // Validate each split

            for (let i = 0; i < splits.length; i++) {

                const split = splits[i];

                if (!split.km || !split.pace || !split.splitTime) {

                    errors.push(`Split ${i + 1} is missing required fields (km, pace, splitTime)`);

                    break;

                }

            }

        }

        if (fatigue !== undefined && (fatigue < 0 || fatigue > 10)) {

            errors.push('Fatigue must be between 0 and 10');

        }

        if (elevationProfile && !['flat', 'rolling', 'mountainous'].includes(elevationProfile)) {

            errors.push('Elevation profile must be flat, rolling, or mountainous');

        }

        if (errors.length > 0) {

            return res.status(400).json({ error: 'Validation failed', details: errors });

        }

        const { getUserDb, dbRunUser } = require('../database');

        const userDb = await getUserDb(userId);

        await dbRunUser(userDb, `

            INSERT INTO race_plans (user_id, name, distance, target_pace, total_time, elevation_profile, fatigue, splits, nutrition_strategy)

            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)

        `, [

            userId,

            name || `Plan ${distance}km - ${new Date().toLocaleDateString('fr-FR')}`,

            distance,

            targetPace,

            totalTime || Math.round(targetPace * distance),

            elevationProfile || 'flat',

            fatigue || 0,

            JSON.stringify(splits),

            nutritionStrategy ? JSON.stringify(nutritionStrategy) : null,

        ]);

        res.json({ success: true, message: 'Race plan saved' });

    } catch (error) {

        logger.error('[RacePlanning] Save error', { error: error.message });

        res.status(500).json({ error: 'Failed to save race plan' });

    }

});

/**

 * GET /api/race-planning/list

 * List all saved race plans for the user with pagination

 */

router.get('/list', verifyToken, async (req, res) => {

    try {

        const userId = req.user.id;

        const { getUserDb, dbAllUser, dbGetUser } = require('../database');

        const userDb = await getUserDb(userId);

        // Pagination parameters

        const page = parseInt(req.query.page) || 1;

        const limit = parseInt(req.query.limit) || 20;

        const offset = (page - 1) * limit;

        // Get total count for pagination

        const countResult = await dbGetUser(userDb, `

            SELECT COUNT(*) as total FROM race_plans WHERE user_id = ?

        `, [userId]);

        const total = countResult?.total || 0;

        const plans = await dbAllUser(userDb, `

            SELECT * FROM race_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?

        `, [userId, limit, offset]);

        const parsedPlans = plans.map(p => ({

            ...p,

            splits: p.splits ? JSON.parse(p.splits) : [],

            nutrition_strategy: p.nutrition_strategy ? JSON.parse(p.nutrition_strategy) : null,

        }));

        res.json({

            plans: parsedPlans,

            pagination: {

                page,

                limit,

                total,

                pages: Math.ceil(total / limit),

                hasNext: offset + limit < total,

                hasPrev: page > 1,

            },

        });

    } catch (error) {

        logger.error('[RacePlanning] List error', { error: error.message });

        res.status(500).json({ error: 'Failed to list race plans' });

    }

});

/**

 * DELETE /api/race-planning/:id

 * Delete a saved race plan

 */

router.delete('/:id', verifyToken, async (req, res) => {

    try {

        const userId = req.user.id;

        const planId = parseInt(req.params.id);

        const { getUserDb, dbRunUser } = require('../database');

        const userDb = await getUserDb(userId);

        await dbRunUser(userDb, `

            DELETE FROM race_plans WHERE id = ? AND user_id = ?

        `, [planId, userId]);

        res.json({ success: true, message: 'Race plan deleted' });

    } catch (error) {

        logger.error('[RacePlanning] Delete error', { error: error.message });

        res.status(500).json({ error: 'Failed to delete race plan' });

    }

});

/**

 * POST /api/race-planning/race-strategy

 * Genère un plan d'allure basé sur un profil GPX et des conditions

 * (Anciennement dans race_planner.js — fusionné ici)

 */

router.post('/race-strategy', verifyToken, async (req, res) => {

    try {

        let { points, gpxData, params } = req.body;

        if (!points && gpxData) {

            points = GpxUtils.parse(gpxData);

        }

        if (!points || !Array.isArray(points) || points.length < 2) {

            return res.status(400).json({ error: 'Données de parcours (points ou gpxData) manquantes ou invalides' });

        }

        const user = await dbGetMain('SELECT profile_data FROM users WHERE id = ?', [req.user.id]);

        let vdot = 40, weight = 70;

        if (user?.profile_data) {

            try {

                const p = JSON.parse(user.profile_data);

                vdot = p.vdot || p.vma_vdot || 40;

                weight = p.weight || 70;

            } catch (e) {

                logger.warn('Failed to parse user profile for race strategy', { error: e.message });

            }

        }

        const strategy = RaceStrategy.generatePlan(points, { vdot, weight }, params || {});

        if (!strategy) {

            return res.status(500).json({ error: 'Impossible de générer la stratégie' });

        }

        res.json(strategy);

    } catch (error) {

        logger.error('Race strategy generation error', { error: error.message, stack: error.stack });

        res.status(500).json({ error: 'Erreur lors de la génération de la stratégie de course' });

    }

});

module.exports = router;
