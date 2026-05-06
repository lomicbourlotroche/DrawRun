'use strict';

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../auth');
const { logger } = require('../logger');
const { getUserDb, dbGetMain } = require('../database');
const {
    RunningPerformance,
    Cardiovascular,
    PMC,
    Taper,
    Overtraining,
    TrainingLoad,
} = require('../algorithms/index');

/**
 * POST /api/race-planning/calculate
 * Calculate race plan with splits, nutrition strategy, and pacing
 * @route POST /api/race-planning/calculate
 * @body {number} distance - Race distance in km
 * @body {string} targetTime - Target time (HH:MM:SS format, optional)
 * @body {number} targetPace - Target pace in sec/km (optional)
 * @body {string} elevationProfile - 'flat', 'rolling', 'mountainous'
 * @body {number} fatigue - Fatigue level 0-10 (optional)
 * @body {number} temperature - Temperature in Celsius (optional)
 * @body {number} humidity - Humidity percentage (optional)
 * @body {number} altitude - Altitude in meters (optional)
 * @body {number} windSpeed - Wind speed km/h (optional)
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
            fatigue = 0,
            temperature = 15,
            humidity = 50,
            altitude = 0,
            windSpeed = 0,
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
                details: errors,
            });
        }

        // Get user profile
        const profile = await dbGetMain(
            'SELECT profile_data FROM users WHERE id = ?',
            [userId]
        );

        let fcm = 180;
        let userVdot = null;
        let age = 30;
        let weight = 70;
        let restingHR = 60;

        if (profile?.profile_data) {
            try {
                const data = JSON.parse(profile.profile_data);
                fcm = data.fcm || fcm;
                age = data.age || age;
                userVdot = data.vdot || null;
                weight = data.weight || weight;
                restingHR = data.restingHR || restingHR;
            } catch (_) { }
        }

        // Parse target time to seconds
        let targetPaceSec = targetPace;
        if (targetTime) {
            const [hours, minutes, seconds] = targetTime.split(':').map(Number);
            const totalSeconds = hours * 3600 + minutes * 60 + seconds;
            targetPaceSec = totalSeconds / distance;
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
        const elev = elevationFactors[elevationProfile];

        // Pacing strategy based on distance (scientifically optimized)
        const pacingStrategy = getPacingStrategy(distance);

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
                for (const row of activities[0].values) {
                    const date = row[1]?.split('T')[0] || row[1];
                    dailyTSS[date] = (dailyTSS[date] || 0) + (row[0] || 0);
                }

                const pmcData = [];
                const dates = Object.keys(dailyTSS).sort();
                for (const date of dates) {
                    pmcData.push({ date, tss: dailyTSS[date] });
                }

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
        } catch {
            // Ignore PMC calculation errors
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
            summary: {
                distance,
                targetPace: Math.round(targetPaceSec),
                correctedPace: Math.round(correctedPace),
                totalTime: Math.round(totalRaceTime),
                correctedTotalTime: Math.round(correctedPace * distance),
                elevationProfile,
                fcm,
                vdot: userVdot,
                tsb: tsbValue ? Math.round(tsbValue) : null,
                ctl: ctlValue ? Math.round(ctlValue) : null,
            },
        });

    } catch (error) {
        logger.error('[RacePlanning] Calculation error', { error: error.message });
        res.status(500).json({ error: 'Failed to calculate race plan' });
    }
});

/**
 * Get optimal pacing strategy based on race distance
 */
function getPacingStrategy(distance) {
    if (distance <= 5) {
        return {
            type: 'even',
            name: 'Allure régulière',
            description: 'Sur 5K, maintenez une allure constante du début à la fin.',
            startFactor: 1.00,
            midFactor: 1.00,
            endFactor: 0.98,
        };
    } else if (distance <= 10) {
        return {
            type: 'slight-negative',
            name: 'Negative split léger',
            description: 'Premier km +2%, milieu stable, dernier km à fond.',
            startFactor: 1.02,
            midFactor: 1.00,
            endFactor: 0.97,
        };
    } else if (distance <= 21.0975) {
        return {
            type: 'negative-split',
            name: 'Negative split',
            description: 'Départ conservateur (+3%), allure cible au milieu, accélération progressive.',
            startFactor: 1.03,
            midFactor: 1.00,
            endFactor: 0.98,
        };
    } else if (distance <= 42.195) {
        return {
            type: 'conservative-negative',
            name: 'Départ très conservateur',
            description: 'Premiers 5K +4-5%, allure cible au 10K, gestion jusqu\'au 35K, tout au dernier 7K.',
            startFactor: 1.04,
            midFactor: 1.01,
            endFactor: 0.99,
        };
    } else {
        return {
            type: 'ultra-conservative',
            name: 'Ultra conservateur',
            description: 'Départ très lent (+8%), marche dans les montées, gestion énergétique stricte.',
            startFactor: 1.08,
            midFactor: 1.02,
            endFactor: 1.00,
        };
    }
}

/**
 * Generate splits with scientific pacing, cardiac drift, and elevation
 */
function generateScientificSplits({ distance, basePace, elevationProfile, pacingStrategy, fcm, restingHR, totalRaceTime, weight }) {
    const splits = [];
    const numSplits = Math.ceil(distance);
    const totalHours = totalRaceTime / 3600;

    for (let km = 1; km <= numSplits; km++) {
        const kmDistance = km === numSplits ? distance - (km - 1) : 1;
        const kmProgress = km / numSplits;

        // Pacing phase factor
        let paceFactor;
        if (kmProgress < 0.15) {
            paceFactor = pacingStrategy.startFactor;
        } else if (kmProgress < 0.85) {
            const midProgress = (kmProgress - 0.15) / 0.70;
            paceFactor = pacingStrategy.startFactor + (pacingStrategy.midFactor - pacingStrategy.startFactor) * midProgress;
        } else {
            const endProgress = (kmProgress - 0.85) / 0.15;
            paceFactor = pacingStrategy.midFactor + (pacingStrategy.endFactor - pacingStrategy.midFactor) * endProgress;
        }

        // Cardiac drift (HR increases ~1 bpm per 10 min at constant pace)
        const driftBpm = Math.round((kmProgress * totalHours * 60) / 10);

        // Elevation factor (simplified model)
        let elevFactor = 1.0;
        if (elevationProfile.gainPerKm > 0) {
            const simulatedGain = Math.sin(km * 0.7) * elevationProfile.gainPerKm;
            elevFactor = 1 + (simulatedGain / 100) * 0.01;
            elevFactor = Math.max(0.92, Math.min(1.15, elevFactor));
        }

        const splitPace = basePace * paceFactor * elevFactor;
        const splitTime = splitPace * kmDistance;
        const cumulativeTime = splits.reduce((acc, s) => acc + s.splitTime, 0) + splitTime;

        // HR zones based on race phase
        const hrPhase = getRaceHRPhase(kmProgress, distance);
        const hrMin = Math.round(fcm * hrPhase.minPct + restingHR * (1 - hrPhase.minPct) * 0.3);
        const hrMax = Math.round(fcm * hrPhase.maxPct + restingHR * (1 - hrPhase.maxPct) * 0.3);
        const hrDriftMin = hrMin + driftBpm;
        const hrDriftMax = hrMax + Math.min(driftBpm, 15);

        // Nutrition timing
        const nutrition = getSplitNutrition(km, cumulativeTime, totalRaceTime, distance, weight);

        splits.push({
            km,
            distance: Math.round(kmDistance * 100) / 100,
            splitTime: Math.round(splitTime),
            cumulativeTime: Math.round(cumulativeTime),
            pace: Math.round(splitPace),
            paceFactor: Math.round(paceFactor * 1000) / 1000,
            hrZone: hrPhase.name,
            hrRange: `${hrDriftMin}-${hrDriftMax} bpm`,
            cardiacDrift: driftBpm,
            elevationFactor: Math.round(elevFactor * 100) / 100,
            nutrition,
        });
    }

    return splits;
}

/**
 * Get HR phase for race segment
 */
function getRaceHRPhase(progress, distance) {
    if (distance <= 5) {
        if (progress < 0.1) return { name: 'Zone 3 (Mise en route)', minPct: 0.75, maxPct: 0.82 };
        if (progress < 0.8) return { name: 'Zone 4 (Seuil)', minPct: 0.85, maxPct: 0.92 };
        return { name: 'Zone 5 (Effort maximal)', minPct: 0.92, maxPct: 0.98 };
    } else if (distance <= 21.0975) {
        if (progress < 0.1) return { name: 'Zone 2-3 (Progressif)', minPct: 0.70, maxPct: 0.78 };
        if (progress < 0.7) return { name: 'Zone 3-4 (Seuil)', minPct: 0.78, maxPct: 0.86 };
        if (progress < 0.9) return { name: 'Zone 4 (Soutenu)', minPct: 0.84, maxPct: 0.90 };
        return { name: 'Zone 4-5 (Final)', minPct: 0.88, maxPct: 0.95 };
    } else {
        if (progress < 0.1) return { name: 'Zone 2 (Contrôle)', minPct: 0.65, maxPct: 0.72 };
        if (progress < 0.5) return { name: 'Zone 2-3 (Aérobie)', minPct: 0.70, maxPct: 0.78 };
        if (progress < 0.8) return { name: 'Zone 3 (Seuil bas)', minPct: 0.75, maxPct: 0.82 };
        if (progress < 0.95) return { name: 'Zone 3-4 (Gestion)', minPct: 0.78, maxPct: 0.86 };
        return { name: 'Zone 4 (Final)', minPct: 0.84, maxPct: 0.92 };
    }
}

/**
 * Get nutrition for a specific split
 */
function getSplitNutrition(km, cumulativeTime, totalRaceTime, distance, weight) {
    const nutrition = [];
    const hours = cumulativeTime / 3600;

    if (totalRaceTime < 3600) return nutrition;

    // Water every 15-20 min
    const waterInterval = 900;
    if (cumulativeTime > 0 && Math.floor(cumulativeTime / waterInterval) > Math.floor((cumulativeTime - (cumulativeTime % waterInterval === 0 ? waterInterval : cumulativeTime % waterInterval)) / waterInterval)) {
        nutrition.push({ type: 'water', label: 'Eau', quantity: '150-200ml' });
    }

    // Gels every 30-45 min (60-90g carbs/hour)
    const gelInterval = 2700;
    if (cumulativeTime > 0 && cumulativeTime % gelInterval < 60 && cumulativeTime > 1800) {
        nutrition.push({ type: 'gel', label: 'Gel énergétique', quantity: '1 gel (25-30g glucides)' });
    }

    // Sodium every hour for races > 2h
    if (totalRaceTime > 7200 && hours > 0 && Math.floor(hours) > Math.floor((cumulativeTime - 60) / 3600)) {
        nutrition.push({ type: 'sodium', label: 'Électrolytes', quantity: '300-500mg sodium' });
    }

    // Solid food for ultras (>4h)
    if (totalRaceTime > 14400 && hours > 1.5 && Math.floor(hours * 2) % 2 === 0) {
        nutrition.push({ type: 'solid', label: 'Aliment solide', quantity: 'Barre/banane (60-80g glucides)' });
    }

    return nutrition;
}

/**
 * Calculate scientific nutrition strategy (Jeukendrup model)
 */
function calculateNutritionStrategy({ distance, totalRaceTime, weight, temperature, elevationProfile }) {
    const hours = totalRaceTime / 3600;
    const isLongRace = totalRaceTime > 3600;
    const isUltra = totalRaceTime > 14400;

    // Carb intake recommendations (Jeukendrup 2020)
    let carbPerHour;
    if (hours < 1) carbPerHour = 0;
    else if (hours < 2.5) carbPerHour = 30;
    else if (hours < 4) carbPerHour = 60;
    else carbPerHour = 90;

    // Adjust for temperature
    if (temperature > 25) carbPerHour *= 0.9;

    // Fluid needs (ACSM guidelines)
    const baseFluidMlPerHour = 400 + (weight * 3);
    const tempAdjustment = temperature > 20 ? (temperature - 20) * 50 : 0;
    const fluidMlPerHour = baseFluidMlPerHour + tempAdjustment;

    // Sodium needs
    const sodiumPerHour = isLongRace ? 500 : 300;

    // Caffeine strategy (3-6 mg/kg, 60 min before race)
    const caffeineDose = Math.round(weight * 3);

    // Pre-race meal timing
    const preRaceMeal = {
        timing: '3-4h avant',
        carbs: `${Math.round(weight * 2)}g glucides`,
        description: 'Repas riche en glucides, faible en fibres et lipides. Ex: riz + poulet + compote.',
    };

    const preRaceTopUp = {
        timing: '15-30 min avant',
        carbs: '20-30g glucides',
        description: '1 gel + 200ml d\'eau ou boisson d\'effort. Caféine optionnelle.',
    };

    // During race
    const duringRace = [];
    if (isLongRace) {
        duringRace.push({
            timing: `Toutes les ${hours < 2.5 ? '45' : '30'} minutes`,
            type: 'gel',
            amount: `${carbPerHour}g glucides/heure`,
            description: `${Math.ceil(carbPerHour / 25)} gels/heure + eau. Alterner saveurs pour éviter l\'écœurement.`,
        });
        duringRace.push({
            timing: 'Toutes les 15-20 min',
            type: 'fluid',
            amount: `${Math.round(fluidMlPerHour / 4)}ml`,
            description: 'Boire avant d\'avoir soif. En cas de chaleur >25°C, augmenter de 20%.',
        });
        if (hours > 2) {
            duringRace.push({
                timing: 'Chaque heure',
                type: 'sodium',
                amount: `${sodiumPerHour}mg`,
                description: 'Sodium via boissons ou comprimés. Crucial si transpiration abondante.',
            });
        }
        if (isUltra) {
            duringRace.push({
                timing: 'Toutes les 2h',
                type: 'solid',
                amount: '60-80g glucides',
                description: 'Banane, barre céréalière, sandwich. Mâcher bien, boire avec.',
            });
        }
    }

    // Post-race recovery
    const postRace = {
        within30min: {
            carbs: `${Math.round(weight * 1.2)}g glucides`,
            protein: `${Math.round(weight * 0.3)}g protéines`,
            description: 'Fenêtre anabolique: ratio 3:1 ou 4:1 glucides/protéines.',
        },
        within2hours: {
            description: 'Repas complet: riz/pâtes + protéines maigres + légumes. Hydratation: 150% du poids perdu.',
        },
    };

    return {
        carbPerHour: isLongRace ? carbPerHour : 0,
        fluidMlPerHour: isLongRace ? Math.round(fluidMlPerHour) : 0,
        sodiumPerHour: isLongRace ? sodiumPerHour : 0,
        totalCarbs: isLongRace ? Math.round(carbPerHour * hours) : 0,
        totalFluid: isLongRace ? Math.round(fluidMlPerHour * hours) : 0,
        caffeineDose: isLongRace ? caffeineDose : 0,
        preRace: { meal: preRaceMeal, topUp: preRaceTopUp },
        duringRace: isLongRace ? duringRace : 'Pas de nutrition nécessaire pour les courses < 1h.',
        postRace,
        references: ['Jeukendrup (2020) Nutrition for endurance sports', 'ACSM Position Stand on Exercise and Fluid Replacement'],
    };
}

/**
 * POST /api/race-planning/save
 * Save a race plan for the user
 */
router.post('/save', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, distance, targetPace, totalTime, elevationProfile, fatigue, splits, nutritionStrategy } = req.body;

        if (!distance || !targetPace || !splits) {
            return res.status(400).json({ error: 'Distance, targetPace, and splits are required' });
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
 * List all saved race plans for the user
 */
router.get('/list', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { getUserDb, dbAllUser } = require('../database');
        const userDb = await getUserDb(userId);

        const plans = await dbAllUser(userDb, `
            SELECT * FROM race_plans WHERE user_id = ? ORDER BY created_at DESC
        `, [userId]);

        const parsedPlans = plans.map(p => ({
            ...p,
            splits: p.splits ? JSON.parse(p.splits) : [],
            nutrition_strategy: p.nutrition_strategy ? JSON.parse(p.nutrition_strategy) : null,
        }));

        res.json(parsedPlans);
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

module.exports = router;
