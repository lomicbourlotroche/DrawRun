'use strict';

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../auth');
const { logger } = require('../logger');
const { getUserDb, dbGetMain } = require('../database');
const { RunningPerformance } = require('../algorithms/index');

/**
 * POST /api/race-planning/calculate
 * Calculate race plan with splits, nutrition strategy, and pacing
 * @route POST /api/race-planning/calculate
 * @body {number} distance - Race distance in km
 * @body {string} targetTime - Target time (HH:MM:SS format, optional)
 * @body {number} targetPace - Target pace in sec/km (optional)
 * @body {string} elevationProfile - 'flat', 'rolling', 'mountainous'
 * @body {number} fatigue - Fatigue level 0-10 (optional)
 * @returns {object} Race plan with splits, predictions, and nutrition strategy
 */
router.post('/calculate', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { 
            distance, 
            targetTime, 
            targetPace, 
            elevationProfile = 'flat', 
            fatigue = 0 
        } = req.body;

        // Validation
        const errors = [];
        
        if (!distance || distance <= 0 || distance > 200) {
            errors.push('Distance must be between 0.1 and 200 km');
        }
        
        if (!targetTime && !targetPace) {
            errors.push('Either targetTime or targetPace is required');
        }
        
        if (targetTime && !/^\d{1,2}:\d{2}:\d{2}$/.test(targetTime)) {
            errors.push('targetTime must be in HH:MM:SS format');
        }
        
        if (targetPace && (targetPace <= 0 || targetPace > 600)) {
            errors.push('targetPace must be between 1 and 600 sec/km');
        }
        
        if (!['flat', 'rolling', 'mountainous'].includes(elevationProfile)) {
            errors.push('elevationProfile must be flat, rolling, or mountainous');
        }
        
        if (fatigue < 0 || fatigue > 10) {
            errors.push('fatigue must be between 0 and 10');
        }

        if (errors.length > 0) {
            return res.status(400).json({ 
                error: 'Paramètres invalides', 
                details: errors 
            });
        }

        // Get user profile from main.db (not user DB)
        const profile = await dbGetMain(
            'SELECT profile_data FROM users WHERE id = ?',
            [userId]
        );

        let fcm = 180;
        let userVdot = null;
        let age = 30;
        let vma = null;

        if (profile?.profile_data) {
            try {
                const data = JSON.parse(profile.profile_data);
                fcm = data.fcm || fcm;
                age = data.age || age;
                vma = data.vma || null;
                userVdot = data.vdot || null;
            } catch (_) {}
        }

        // Parse target time to seconds if provided
        let targetPaceSec = targetPace;
        if (targetTime) {
            const [hours, minutes, seconds] = targetTime.split(':').map(Number);
            const totalSeconds = hours * 3600 + minutes * 60 + seconds;
            targetPaceSec = totalSeconds / distance;
        }

        // Elevation factors
        const elevationFactors = {
            flat: { up: 1.0, down: 1.0 },
            rolling: { up: 1.05, down: 0.97 },
            mountainous: { up: 1.12, down: 0.94 },
        };

        const factors = elevationFactors[elevationProfile];

        // Generate splits
        const splits = [];
        const numSplits = Math.ceil(distance);
        const conservativeStartPercent = 0.2;
        const numConservativeKms = Math.max(1, Math.ceil(numSplits * conservativeStartPercent));

        for (let km = 1; km <= numSplits; km++) {
            const isLastKm = km === numSplits;
            const kmDistance = isLastKm ? distance - (km - 1) : 1;
            
            let kmPaceFactor = 1.0;
            if (km <= numConservativeKms) {
                kmPaceFactor = 1.03;
            }

            let elevationFactor = 1.0;
            if (elevationProfile !== 'flat') {
                const isUphill = Math.floor((km - 1) / 2) % 2 === 0;
                elevationFactor = isUphill ? factors.up : factors.down;
            }

            const splitPace = targetPaceSec * kmPaceFactor * elevationFactor;
            const splitTime = splitPace * kmDistance;

            let hrZone, hrMin, hrMax;
            const phase = km <= numConservativeKms ? 'start' : 
                         km <= numSplits * 0.8 ? 'middle' : 'final';
            
            switch (phase) {
                case 'start':
                    hrZone = 'Zone 2 (Aérobie)';
                    hrMin = Math.round(fcm * 0.65);
                    hrMax = Math.round(fcm * 0.75);
                    break;
                case 'middle':
                    hrZone = 'Zone 3-4 (Seuil)';
                    hrMin = Math.round(fcm * 0.75);
                    hrMax = Math.round(fcm * 0.88);
                    break;
                case 'final':
                    hrZone = 'Zone 4-5 (Anaérobie)';
                    hrMin = Math.round(fcm * 0.88);
                    hrMax = Math.round(fcm * 0.95);
                    break;
            }

            const nutrition = [];
            
            if (km >= 5 && km % 5 === 0) {
                nutrition.push({ type: 'water', label: 'Eau', quantity: '150-200ml' });
            }

            const cumulativeTime = splits.reduce((acc, s) => acc + s.splitTime, 0) + splitTime;
            
            const totalRaceTime = targetPaceSec * distance;
            if (totalRaceTime > 3600) {
                const gelTimes = [];
                for (let t = 2700; t <= totalRaceTime; t += 2700) {
                    gelTimes.push(t);
                }
                
                const prevCumulative = splits.reduce((acc, s) => acc + s.splitTime, 0);
                for (const gelTime of gelTimes) {
                    if (prevCumulative < gelTime && cumulativeTime >= gelTime) {
                        nutrition.push({ type: 'gel', label: 'Gel', quantity: '1 gel' });
                        break;
                    }
                }
            }

            splits.push({
                km,
                distance: Math.round(kmDistance * 100) / 100,
                splitTime: Math.round(splitTime),
                cumulativeTime: Math.round(cumulativeTime),
                pace: Math.round(splitPace),
                hrZone,
                hrRange: `${hrMin}-${hrMax} bpm`,
                nutrition,
            });
        }

        // Race prediction using VDOT if available
        let racePrediction = null;
        if (userVdot) {
            try {
                const predictions = {};
                const distances = [5, 10, 21.0975, 42.195];
                const labels = ['5K', '10K', 'Half', 'Marathon'];
                
                distances.forEach((dist, idx) => {
                    if (dist <= distance * 1.5) {
                        const estTime = targetPaceSec * dist;
                        predictions[labels[idx]] = {
                            distance: dist,
                            estimatedTime: Math.round(estTime),
                        };
                    }
                });
                
                racePrediction = {
                    vdot: userVdot,
                    predictions,
                };
            } catch (error) {
                logger.warn('[RacePlanning] VDOT prediction failed', { error: error.message });
            }
        }

        // TSB warning
        let tsbWarning = null;
        try {
            const userDb = await getUserDb(userId);
            const pmcResult = userDb.exec(`
                SELECT 
                    COALESCE(
                        (SELECT SUM(tss) FROM activities WHERE date(start_date) >= date('now', '-7 days')), 
                        0
                    ) as ctl,
                    COALESCE(
                        (SELECT SUM(tss) FROM activities WHERE date(start_date) >= date('now', '-42 days') AND date(start_date) < date('now', '-7 days')), 
                        0
                    ) / 5 as atl
            `);
            
            if (pmcResult[0]?.values?.[0]) {
                const [ctl, atl] = pmcResult[0].values[0];
                const tsb = ctl - atl;
                
                if (tsb < -20) {
                    tsbWarning = {
                        type: 'fatigue',
                        message: `TSB actuel (${Math.round(tsb)}) indique une fatigue élevée. Envisagez de reporter la course ou de réduire l'objectif.`,
                    };
                } else if (tsb > 15) {
                    tsbWarning = {
                        type: 'freshness',
                        message: `TSB positif (${Math.round(tsb)}) — vous êtes bien récupéré !`,
                    };
                }
            }
        } catch {
            // Ignore PMC calculation errors
        }

        const totalRaceTime = targetPaceSec * distance;

        // Nutrition strategy summary
        const nutritionStrategy = {
            totalWater: Math.ceil(distance / 5) * 150,
            totalGels: totalRaceTime > 3600 ? Math.floor(totalRaceTime / 2700) : 0,
            preRace: '3h avant: Repas riche en glucides. 15min avant: 1 gel + eau.',
            duringRace: 'Hydratez-vous régulièrement même sans soif.',
            postRace: '30min après: Protéines + glucides pour récupération.',
        };

        res.json({
            splits,
            racePrediction,
            nutritionStrategy,
            warnings: tsbWarning ? [tsbWarning] : [],
            summary: {
                distance,
                targetPace: Math.round(targetPaceSec),
                totalTime: Math.round(targetPaceSec * distance),
                elevationProfile,
                fcm,
            },
        });

    } catch (error) {
        logger.error('[RacePlanning] Calculation error', { error: error.message });
        res.status(500).json({ error: 'Failed to calculate race plan' });
    }
});

module.exports = router;
