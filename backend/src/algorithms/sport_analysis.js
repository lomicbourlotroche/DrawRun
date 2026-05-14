'use strict';

const { MathUtils } = require('./math_utils');
const { Cardiovascular } = require('./cardiovascular');
const { RunningPerformance } = require('./running_performance');
const { TrainingLoad } = require('./training_load');
const { Nutrition } = require('./nutrition');
const SCIENTIFIC_CONSTANTS = require('./scientific_constants');
const { Biomechanics } = require('./biomechanics');
const { CriticalPower } = require('./critical_power');

const SportAnalysis = {
    SPORT_CONSTANTS: {
        Run: {
            label: 'Course à pied',
            tssMethod: 'hr_based',
            thresholdHR: 0.85,
            trimpModel: 'edwards',
            hasPower: false, hasHR: true, hasPace: true, hasElevation: true,
            tssMultiplier: 1.0, icon: '🏃',
        },
        Ride: {
            label: 'Cyclisme',
            tssMethod: 'power_based',
            thresholdPower: 1.0,
            trimpModel: 'banister',
            hasPower: true, hasHR: true, hasPace: false, hasElevation: true,
            tssMultiplier: 1.0, icon: '🚴',
        },
        Swim: {
            label: 'Natation',
            tssMethod: 'pace_based',
            thresholdPace: 90,
            trimpModel: 'banister',
            hasPower: false, hasHR: true, hasPace: true, hasElevation: false,
            tssMultiplier: 0.8, icon: '🏊',
        },
        TrailRun: {
            label: 'Trail',
            tssMethod: 'hr_elevation',
            thresholdHR: 0.85,
            trimpModel: 'edwards',
            hasPower: false, hasHR: true, hasPace: true, hasElevation: true,
            tssMultiplier: 1.15, elevationFactor: 0.008, icon: '⛰️',
        },
        Walk: {
            label: 'Marche',
            tssMethod: 'srpe',
            thresholdHR: 0.70,
            trimpModel: 'edwards',
            hasPower: false, hasHR: true, hasPace: true, hasElevation: true,
            tssMultiplier: 0.5, icon: '🚶',
        },
        HIIT: {
            label: 'HIIT',
            tssMethod: 'hr_based',
            thresholdHR: 0.90,
            trimpModel: 'banister',
            hasPower: false, hasHR: true, hasPace: true, hasElevation: false,
            tssMultiplier: 1.2, icon: '💪',
        },
        Strength: {
            label: 'Musculation',
            tssMethod: 'srpe',
            thresholdHR: 0.75,
            trimpModel: 'edwards',
            hasPower: false, hasHR: true, hasPace: false, hasElevation: false,
            tssMultiplier: 0.6, icon: '🏋️',
        },
        Yoga: {
            label: 'Yoga',
            tssMethod: 'srpe',
            thresholdHR: 0.60,
            trimpModel: 'edwards',
            hasPower: false, hasHR: true, hasPace: false, hasElevation: false,
            tssMultiplier: 0.3, icon: '🧘',
        },
    },

    // ─── Sport type classification ───────────────────────────

    _isRunType: (type) => ['run', 'Run', 'race_walk'].includes(type),
    _isRideType: (type) => ['ride', 'Ride', 'bike', 'mountain_bike', 'gravel_bike', 'indoor_cycling', 'virtual_ride'].includes(type),
    _isSwimType: (type) => ['swim', 'Swim', 'open_water_swim'].includes(type),
    _isTrailType: (type) => ['trail_run', 'TrailRun', 'hike'].includes(type),
    _isWalkType: (type) => ['walk', 'Walk'].includes(type),
    _isHIIType: (type) => ['hiit', 'HIIT', 'circuit_training', 'crossfit', 'cardio_training'].includes(type),
    _isStrengthType: (type) => ['strength_training', 'weight_training', 'Strength'].includes(type),
    _isYogaType: (type) => ['yoga', 'Yoga', 'pilates'].includes(type),

    _getAnalysisType: (type) => {
        if (SportAnalysis._isRunType(type)) return 'run';
        if (SportAnalysis._isRideType(type)) return 'ride';
        if (SportAnalysis._isSwimType(type)) return 'swim';
        if (SportAnalysis._isTrailType(type)) return 'trail';
        if (SportAnalysis._isWalkType(type)) return 'walk';
        if (SportAnalysis._isHIIType(type)) return 'hiit';
        if (SportAnalysis._isStrengthType(type)) return 'strength';
        if (SportAnalysis._isYogaType(type)) return 'yoga';
        return 'general';
    },

    _getConstants: (type) => {
        const analysisType = SportAnalysis._getAnalysisType(type);
        const lookup = analysisType === 'trail' ? 'TrailRun'
            : analysisType === 'ride' ? 'Ride'
            : analysisType === 'swim' ? 'Swim'
            : analysisType === 'walk' ? 'Walk'
            : analysisType === 'hiit' ? 'HIIT'
            : analysisType === 'strength' ? 'Strength'
            : analysisType === 'yoga' ? 'Yoga'
            : 'Run';
        return SportAnalysis.SPORT_CONSTANTS[lookup] || SportAnalysis.SPORT_CONSTANTS.Run;
    },

    // ─── Common helpers ──────────────────────────────────────

    _extractProfile: (profile) => {
        const age = profile?.age || 30;
        const sex = profile?.sex || 'M';
        const weight = profile?.weight || 70;
        const height = profile?.height || 175;
        const fcm = profile?.fcm || Cardiovascular.calculateMaxHR(age);
        const restingHR = profile?.resting_hr || profile?.restingHR || 60;
        const vdot = profile?.vdot || null;
        const vma = profile?.vma || null;
        const ftp = profile?.ftp || null;
        return { age, sex, weight, height, fcm, restingHR, vdot, vma, ftp };
    },

    _extractActivity: (activity) => ({
        duration: activity.moving_time || activity.elapsed_time || 0,
        durationMinutes: (activity.moving_time || activity.elapsed_time || 0) / 60,
        durationHours: (activity.moving_time || activity.elapsed_time || 0) / 3600,
        avgHR: activity.average_heartrate || 0,
        maxHR: activity.max_heartrate || 0,
        avgPower: activity.average_watts || activity.average_power || 0,
        distance: activity.distance || 0,
        elevation: activity.total_elevation_gain || 0,
        cadence: activity.average_cadence || activity.cadence || 0,
        rpe: activity.rpe || null,
        type: activity.type || 'Run',
    }),

    _calcTSS: (act, constants, profile) => {
        const { durationHours, avgHR, avgPower, distance, elevation, rpe } = act;
        const fcm = profile.fcm;
        const thresholdHR = fcm * (constants.thresholdHR || 0.85);
        let tss = null;
        let intensityFactor = null;

        if (constants.tssMethod === 'power_based' && avgPower > 0 && profile.ftp > 0) {
            intensityFactor = avgPower / profile.ftp;
            tss = durationHours * Math.pow(intensityFactor, 2) * 100;
        } else if ((constants.tssMethod === 'hr_based' || constants.tssMethod === 'hr_elevation') && avgHR > 0 && thresholdHR > 0) {
            intensityFactor = avgHR / thresholdHR;
            tss = durationHours * Math.pow(intensityFactor, 2) * 100;
        } else if (rpe) {
            intensityFactor = rpe / 10;
            tss = rpe / 10 * durationHours * 100 * constants.tssMultiplier;
        }

        if (elevation > 0 && constants.elevationFactor) {
            tss = (tss || 0) + elevation * constants.elevationFactor * act.durationMinutes / 60;
        }

        if (tss !== null) tss = Math.round(tss * constants.tssMultiplier * 10) / 10;
        if (intensityFactor !== null) intensityFactor = Math.round(intensityFactor * 100) / 100;

        return { tss, intensityFactor };
    },

    _calcTRIMP: (act, constants, profile) => {
        const { durationMinutes, avgHR } = act;
        const fcm = profile.fcm;
        const restingHR = profile.restingHR;
        let trimp = null;

        if (avgHR > 0 && fcm > 0) {
            if (constants.trimpModel === 'banister') {
                const hrr = (avgHR - restingHR) / (fcm - restingHR);
                const k = profile.sex === 'F' ? 1.92 : 0.86;
                trimp = Math.round(durationMinutes * hrr * Math.exp(k * hrr) * 10) / 10;
            } else {
                const hrPercent = avgHR / fcm;
                let zoneFactor = 1;
                for (const zone of SCIENTIFIC_CONSTANTS.TRIMP.ZONES) {
                    if (hrPercent >= zone.min && hrPercent < zone.max) { zoneFactor = zone.coefficient; break; }
                }
                if (hrPercent >= 0.9) zoneFactor = 5;
                trimp = Math.round(durationMinutes * zoneFactor * (profile.sex === 'F' ? 1.3 : 1.0) * 10) / 10;
            }
        }
        return trimp;
    },

    _calcHRZones: (act, profile) => {
        const { avgHR, maxHR, duration } = act;
        const fcm = profile.fcm;
        const restingHR = profile.restingHR;
        if (!avgHR || !fcm) return null;

        const hrPercent = avgHR / fcm;
        const zoneNames = ['Zone 1 - Récupération', 'Zone 2 - Endurance', 'Zone 3 - Tempo', 'Zone 4 - Seuil', 'Zone 5 - VO2max'];
        let currentZone = 1;
        for (let i = 0; i < 5; i++) { if (hrPercent >= (i + 1) * 0.2) currentZone = i + 2; }
        currentZone = Math.min(currentZone, 5);

        const avgHrPercent = Math.round(hrPercent * 100);
        const maxHrPercent = maxHR ? Math.round((maxHR / fcm) * 100) : null;
        const hrReserve = avgHR ? Math.round(((avgHR - restingHR) / (fcm - restingHR)) * 100) : null;

        return {
            current: currentZone,
            name: zoneNames[currentZone - 1],
            percent: avgHrPercent,
            avgHrPercent,
            maxHrPercent,
            hrReserve,
            fcm,
            restingHR,
        };
    },

    _calcPace: (act) => {
        const { distance, duration } = act;
        if (distance <= 0 || duration <= 0) return null;
        const paceSecPerKm = duration / (distance / 1000);
        return {
            secPerKm: Math.round(paceSecPerKm),
            formatted: MathUtils.formatPace(paceSecPerKm),
            speedKmh: parseFloat((distance / 1000 / (duration / 3600)).toFixed(1)),
        };
    },

    _calcNutrition: (durationMinutes, intensityFactor) => {
        if (durationMinutes < 30) return null;
        return Nutrition.calculateRequirements(durationMinutes, intensityFactor || 0.7);
    },

    _getDurationFormatted: (duration) => ({
        duration,
        durationFormatted: MathUtils.formatDuration(duration),
    }),

    _calcElevation: (activity) => {
        const { distance, elevation } = activity;
        if (!distance || distance <= 0) return { estimatedGrade: 0 };
        return {
            estimatedGrade: Math.round((elevation / distance) * 100 * 10) / 10,
        };
    },

    // ─── Stream-derived HR zone distribution ─────────────────

    _calcHRZoneDistribution: (hrStream, fcm) => {
        if (!hrStream || !Array.isArray(hrStream) || hrStream.length === 0) return null;
        const zones = [0, 0, 0, 0, 0];
        let count = 0;
        for (const hr of hrStream) {
            if (!hr) continue;
            const pct = hr / fcm;
            count++;
            if (pct < 0.6) zones[0]++;
            else if (pct < 0.7) zones[1]++;
            else if (pct < 0.8) zones[2]++;
            else if (pct < 0.9) zones[3]++;
            else zones[4]++;
        }
        if (count === 0) return null;
        return {
            zone1Percent: Math.round(zones[0] / count * 100),
            zone2Percent: Math.round(zones[1] / count * 100),
            zone3Percent: Math.round(zones[2] / count * 100),
            zone4Percent: Math.round(zones[3] / count * 100),
            zone5Percent: Math.round(zones[4] / count * 100),
        };
    },

    // ─── Sport-specific: Run ──────────────────────────────────

    _analyzeRun: (activity, profile, streams) => {
        const act = SportAnalysis._extractActivity(activity);
        const constants = SportAnalysis._getConstants(activity.type);
        const prof = SportAnalysis._extractProfile(profile);

        const { tss, intensityFactor } = SportAnalysis._calcTSS(act, constants, prof);
        const trimp = SportAnalysis._calcTRIMP(act, constants, prof);
        const hrZones = SportAnalysis._calcHRZones(act, prof);
        const pace = SportAnalysis._calcPace(act);
        const elev = SportAnalysis._calcElevation(act);

        const hrDistribution = streams
            ? SportAnalysis._calcHRZoneDistribution(streams.heartrate, prof.fcm)
            : null;

        let vdot = null;
        if (act.distance >= 3000 && act.durationMinutes >= 15) {
            vdot = Math.round(RunningPerformance.calculateVDOT(act.distance, act.durationMinutes) * 10) / 10;
        }

        let gap = null, efficiencyFactor = null;
        if (act.distance > 0 && act.duration > 0) {
            const paceSecPerKm = act.duration / (act.distance / 1000);
            const grade = act.elevation / act.distance;
            const gapSecPerKm = RunningPerformance.calculateGAP(paceSecPerKm, grade);
            gap = {
                secPerKm: Math.round(gapSecPerKm),
                formatted: MathUtils.formatPace(gapSecPerKm),
            };
            if (act.avgHR > 0) {
                efficiencyFactor = Math.round(RunningPerformance.calculateEfficiencyFactor(gapSecPerKm, act.avgHR) * 100) / 100;
            }
        }

        const gapFormatted = gap?.formatted || null;

        let runningEconomy = null;
        if (vdot && pace?.speedKmh > 0) {
            const vo2 = vdot * (hrZones?.percent || 70) / 100;
            runningEconomy = Math.round(RunningPerformance.calculateRunningEconomy(vo2, pace.speedKmh));
        }

        const cadence = act.cadence;
        let biomechanics = null;
        if (cadence && cadence >= 100 && act.duration > 0 && act.distance > 0) {
            const speedMs = act.distance / act.duration;
            const metrics = Biomechanics.estimateMetrics(speedMs, cadence, prof.weight, prof.height);
            if (metrics) {
                biomechanics = {
                    ...metrics,
                    advice: Biomechanics.getAdvice(metrics, speedMs * 3.6),
                };
            }
        }

        let trainingPaces = null;
        if (vdot) {
            trainingPaces = RunningPerformance.getTrainingPaces(vdot);
        }

        let performanceLevel = null;
        if (vdot) {
            performanceLevel = RunningPerformance.getPerformanceLevel('VDOT', vdot);
        }

        let racePredictions = null;
        if (vdot) {
            const preds = RunningPerformance.predictRaceTimes(vdot);
            racePredictions = {
                '5k': preds?.['5k'] ? Math.round(preds['5k'] * 60) : null,
                '10k': preds?.['10k'] ? Math.round(preds['10k'] * 60) : null,
                half: preds?.['half'] ? {
                    time: `${Math.floor(preds['half'])}:${String(Math.round((preds['half'] % 1) * 60)).padStart(2, '0')}`
                } : null,
                marathon: preds?.['marathon'] ? {
                    time: `${Math.floor(preds['marathon'])}:${String(Math.round((preds['marathon'] % 1) * 60)).padStart(2, '0')}`
                } : null,
            };
        }

        const nutrition = SportAnalysis._calcNutrition(act.durationMinutes, intensityFactor);
        const { duration, durationFormatted } = SportAnalysis._getDurationFormatted(act.duration);

        return {
            sportType: 'run',
            sportLabel: constants.label,
            icon: constants.icon,
            analysisType: 'detailed',
            tss, trimp, intensityFactor,
            duration, durationFormatted,
            calories: activity.calories || null,

            hrZones,
            hrDistribution,

            pace,
            vdot,
            gap,
            efficiencyFactor,
            runningEconomy,

            biomechanics,
            trainingPaces,
            performanceLevel,
            racePredictions,

            efficiency_factor: efficiencyFactor,
            intensity_factor: intensityFactor,
            gapFormatted,
            ...elev,
            nutrition,
        };
    },

    // ─── Sport-specific: Ride ─────────────────────────────────

    _calcPowerZoneDistribution: (powerSamples, ftp) => {
        if (!powerSamples || !Array.isArray(powerSamples) || powerSamples.length === 0 || !ftp || ftp <= 0) return null;
        const zones = [0, 0, 0, 0, 0, 0, 0];
        const boundaries = [
            ftp * 0.55, ftp * 0.75,
            ftp * 0.76, ftp * 0.90,
            ftp * 0.91, ftp * 1.05,
            ftp * 1.06, ftp * 1.20,
            ftp * 1.21, ftp * 1.50,
        ];
        let count = 0;
        for (const w of powerSamples) {
            if (!w || w <= 0) continue;
            count++;
            if (w < boundaries[0]) zones[0]++;
            else if (w < boundaries[1]) zones[1]++;
            else if (w < boundaries[2]) zones[2]++;
            else if (w < boundaries[3]) zones[3]++;
            else if (w < boundaries[4]) zones[4]++;
            else if (w < boundaries[5]) zones[5]++;
            else if (w < boundaries[6]) zones[6]++;
            else zones[6]++;
        }
        if (count === 0) return null;
        const names = ['Z1 Récup', 'Z2 Endurance', 'Z3 Tempo', 'Z4 Seuil', 'Z5 VO2max', 'Z6 Anaérobie', 'Z7 Neuromusc'];
        const result = [];
        for (let i = 0; i < 7; i++) {
            result.push({ zone: i + 1, name: names[i], percent: Math.round(zones[i] / count * 100) });
        }
        return result;
    },

    _analyzeRide: (activity, profile, streams) => {
        const act = SportAnalysis._extractActivity(activity);
        const constants = SportAnalysis._getConstants(activity.type);
        const prof = SportAnalysis._extractProfile(profile);

        const { tss, intensityFactor } = SportAnalysis._calcTSS(act, constants, prof);
        const trimp = SportAnalysis._calcTRIMP(act, constants, prof);
        const hrZones = SportAnalysis._calcHRZones(act, prof);
        const pace = SportAnalysis._calcPace(act);
        const elev = SportAnalysis._calcElevation(act);

        const hrDistribution = streams
            ? SportAnalysis._calcHRZoneDistribution(streams.heartrate, prof.fcm)
            : null;

        let normalizedPower = null, variabilityIndex = null;
        const powerSamples = streams?.watts || activity.power_samples;
        if (powerSamples && Array.isArray(powerSamples) && powerSamples.length > 0) {
            normalizedPower = Math.round(TrainingLoad.calculateNormalizedValue(powerSamples) * 10) / 10;
            if (act.avgPower > 0) {
                variabilityIndex = Math.round((normalizedPower / act.avgPower) * 100) / 100;
            }
        }

        // Power zone distribution from power stream
        const powerZoneDistribution = SportAnalysis._calcPowerZoneDistribution(powerSamples, prof.ftp || normalizedPower);

        // Total work (kJ) = avgPower × seconds / 1000
        let totalWorkKj = null;
        if (act.avgPower > 0 && act.duration > 0) {
            totalWorkKj = Math.round(act.avgPower * act.duration / 1000);
        }

        // Power-to-weight ratio (W/kg)
        let powerToWeight = null;
        if (act.avgPower > 0 && prof.weight > 0) {
            powerToWeight = Math.round((act.avgPower / prof.weight) * 100) / 100;
        }

        // TSS per hour
        let tssPerHour = null;
        if (tss !== null && act.durationHours > 0) {
            tssPerHour = Math.round(tss / act.durationHours * 10) / 10;
        }

        let estimatedCP = null, estimatedWPrime = null;
        let powerEfforts = null;
        if (powerSamples && Array.isArray(powerSamples) && powerSamples.length > 10) {
            const efforts = SportAnalysis._buildPowerEfforts(powerSamples);
            powerEfforts = efforts;
            if (efforts && efforts.length >= 2) {
                const cpResult = CriticalPower.estimateFromEfforts(efforts);
                if (cpResult) {
                    estimatedCP = cpResult.CP;
                    estimatedWPrime = cpResult.W_prime;
                }
            }
        }

        let powerCurve = null;
        if (estimatedCP && estimatedWPrime) {
            powerCurve = CriticalPower.generatePowerDurationCurve(estimatedCP, estimatedWPrime);
        }

        const nutrition = SportAnalysis._calcNutrition(act.durationMinutes, intensityFactor);
        const { duration, durationFormatted } = SportAnalysis._getDurationFormatted(act.duration);

        return {
            sportType: 'ride',
            sportLabel: constants.label,
            icon: constants.icon,
            analysisType: 'detailed',
            tss, trimp, intensityFactor,
            duration, durationFormatted,
            calories: activity.calories || null,

            hrZones,
            hrDistribution,

            speedKmh: pace?.speedKmh || null,
            pace,

            normalizedPower,
            variabilityIndex,
            estimatedCP,
            estimatedWPrime,
            powerCurve,
            avgPower: act.avgPower,
            maxPower: activity.max_watts || null,

            // New enhanced metrics
            powerZoneDistribution,
            powerEfforts,
            totalWorkKj,
            powerToWeight,
            tssPerHour,

            efficiency_factor: null,
            intensity_factor: intensityFactor,
            ...elev,
            nutrition,
        };
    },

    _buildPowerEfforts: (powerSamples) => {
        if (!powerSamples || powerSamples.length < 10) return null;
        const durations = [30, 60, 120, 300, 600, 1200];
        const efforts = [];
        for (const dur of durations) {
            if (powerSamples.length < dur) continue;
            let maxAvg = 0;
            for (let i = 0; i <= powerSamples.length - dur; i++) {
                const slice = powerSamples.slice(i, i + dur);
                const avg = slice.reduce((a, b) => a + b, 0) / dur;
                if (avg > maxAvg) maxAvg = avg;
            }
            efforts.push({ duration: dur, value: maxAvg });
        }
        return efforts;
    },

    // ─── Sport-specific: Swim ─────────────────────────────────

    _analyzeSwim: (activity, profile, streams) => {
        const act = SportAnalysis._extractActivity(activity);
        const constants = SportAnalysis._getConstants(activity.type);
        const prof = SportAnalysis._extractProfile(profile);

        const { tss, intensityFactor } = SportAnalysis._calcTSS(act, constants, prof);
        const trimp = SportAnalysis._calcTRIMP(act, constants, prof);
        const hrZones = SportAnalysis._calcHRZones(act, prof);
        const elev = SportAnalysis._calcElevation(act);

        const hrDistribution = streams
            ? SportAnalysis._calcHRZoneDistribution(streams.heartrate, prof.fcm)
            : null;

        // Pace per 100m
        let pacePer100m = null;
        if (act.distance > 0 && act.duration > 0) {
            const secPer100m = (act.duration / (act.distance / 100));
            pacePer100m = {
                seconds: Math.round(secPer100m),
                formatted: `${Math.floor(secPer100m / 60)}:${String(Math.round(secPer100m % 60)).padStart(2, '0')}/100m`,
            };
        }

        // SWOLF = stroke + time (seconds per length)
        let swolf = null, strokeRate = null, dps = null;
        const cadence = act.cadence;
        if (cadence && pacePer100m) {
            const poolLength = 25;
            const strokesPerLength = cadence * (poolLength / 100) * (pacePer100m.seconds / 60);
            const swolfRaw = Math.round(strokesPerLength + pacePer100m.seconds * (poolLength / 100));
            swolf = Math.min(swolfRaw, 99);
            strokeRate = Math.round(cadence);
            if (cadence > 0) {
                dps = Math.round((100 / pacePer100m.seconds) * 60 / cadence * 100) / 100;
            }
        }

        // Estimated CSS (Critical Swim Speed) from pace
        let estimatedCSS = null;
        if (act.distance >= 400 && act.durationMinutes >= 5) {
            const speedMs = act.distance / act.duration;
            estimatedCSS = {
                speedMs: Math.round(speedMs * 100) / 100,
                pacePer100m: pacePer100m?.formatted || null,
                speedKmh: Math.round(speedMs * 3.6 * 100) / 100,
            };
        }

        const nutrition = SportAnalysis._calcNutrition(act.durationMinutes, intensityFactor);
        const { duration, durationFormatted } = SportAnalysis._getDurationFormatted(act.duration);

        return {
            sportType: 'swim',
            sportLabel: constants.label,
            icon: constants.icon,
            analysisType: 'detailed',
            tss, trimp, intensityFactor,
            duration, durationFormatted,
            calories: activity.calories || null,

            hrZones,
            hrDistribution,

            pacePer100m,
            swolf,
            strokeRate,
            dps,
            estimatedCSS,

            efficiency_factor: null,
            intensity_factor: intensityFactor,
            ...elev,
            nutrition,
        };
    },

    // ─── Sport-specific: Trail Run ────────────────────────────

    _analyzeTrailRun: (activity, profile, streams) => {
        const runAnalysis = SportAnalysis._analyzeRun(activity, profile, streams);

        const act = SportAnalysis._extractActivity(activity);
        const elev = act.elevation;
        const durHours = act.durationHours;

        let vam = null;
        if (elev > 0 && durHours > 0) {
            vam = Math.round(elev / durHours);
        }

        let technicalScore = null;
        if (act.distance > 0 && elev > 0) {
            const elevationPerKm = elev / (act.distance / 1000);
            if (elevationPerKm > 80) technicalScore = 'expert';
            else if (elevationPerKm > 50) technicalScore = 'advanced';
            else if (elevationPerKm > 25) technicalScore = 'moderate';
            else technicalScore = 'easy';
        }

        return {
            ...runAnalysis,
            sportType: 'trail',
            sportLabel: 'Trail',
            icon: '⛰️',
            vam,
            technicalScore,
            elevationGain: elev,
        };
    },

    // ─── Sport-specific: Walk ─────────────────────────────────

    _analyzeWalk: (activity, profile) => {
        const act = SportAnalysis._extractActivity(activity);
        const constants = SportAnalysis._getConstants(activity.type);
        const prof = SportAnalysis._extractProfile(profile);

        const { tss, intensityFactor } = SportAnalysis._calcTSS(act, constants, prof);
        const trimp = SportAnalysis._calcTRIMP(act, constants, prof);
        const hrZones = SportAnalysis._calcHRZones(act, prof);
        const pace = SportAnalysis._calcPace(act);
        const elev = SportAnalysis._calcElevation(act);

        const nutrition = SportAnalysis._calcNutrition(act.durationMinutes, intensityFactor);
        const { duration, durationFormatted } = SportAnalysis._getDurationFormatted(act.duration);

        return {
            sportType: 'walk',
            sportLabel: constants.label,
            icon: constants.icon,
            analysisType: 'simple',
            tss, trimp, intensityFactor,
            duration, durationFormatted,
            calories: activity.calories || null,
            hrZones,
            pace,
            intensity_factor: intensityFactor,
            ...elev,
            nutrition,
        };
    },

    // ─── Sport-specific: HIIT ─────────────────────────────────

    _analyzeHIIT: (activity, profile) => {
        const act = SportAnalysis._extractActivity(activity);
        const constants = SportAnalysis._getConstants(activity.type);
        const prof = SportAnalysis._extractProfile(profile);

        const { tss, intensityFactor } = SportAnalysis._calcTSS(act, constants, prof);
        const trimp = SportAnalysis._calcTRIMP(act, constants, prof);
        const hrZones = SportAnalysis._calcHRZones(act, prof);

        const nutrition = SportAnalysis._calcNutrition(act.durationMinutes, intensityFactor);
        const { duration, durationFormatted } = SportAnalysis._getDurationFormatted(act.duration);

        // Estimate HR recovery slope
        const peakHR = act.maxHR || act.avgHR * 1.15 || null;
        const avgHR = act.avgHR;

        return {
            sportType: 'hiit',
            sportLabel: constants.label,
            icon: constants.icon,
            analysisType: 'simple',
            tss, trimp, intensityFactor,
            duration, durationFormatted,
            calories: activity.calories || null,
            hrZones,
            peakHR,
            avgHR,
            intensity_factor: intensityFactor,
            nutrition,
        };
    },

    // ─── Sport-specific: Strength ─────────────────────────────

    _analyzeStrength: (activity, profile) => {
        const act = SportAnalysis._extractActivity(activity);
        const constants = SportAnalysis._getConstants(activity.type);
        const prof = SportAnalysis._extractProfile(profile);

        const { tss, intensityFactor } = SportAnalysis._calcTSS(act, constants, prof);
        const trimp = SportAnalysis._calcTRIMP(act, constants, prof);
        const hrZones = SportAnalysis._calcHRZones(act, prof);
        const { duration, durationFormatted } = SportAnalysis._getDurationFormatted(act.duration);

        return {
            sportType: 'strength',
            sportLabel: constants.label,
            icon: constants.icon,
            analysisType: 'simple',
            tss, trimp, intensityFactor,
            duration, durationFormatted,
            calories: activity.calories || null,
            hrZones,
            intensity_factor: intensityFactor,
        };
    },

    // ─── Sport-specific: Yoga ─────────────────────────────────

    _analyzeYoga: (activity, profile) => {
        const act = SportAnalysis._extractActivity(activity);
        const constants = SportAnalysis._getConstants(activity.type);
        const prof = SportAnalysis._extractProfile(profile);

        const { tss, intensityFactor } = SportAnalysis._calcTSS(act, constants, prof);
        const trimp = SportAnalysis._calcTRIMP(act, constants, prof);
        const { duration, durationFormatted } = SportAnalysis._getDurationFormatted(act.duration);

        return {
            sportType: 'yoga',
            sportLabel: constants.label,
            icon: constants.icon,
            analysisType: 'simple',
            tss, trimp, intensityFactor,
            duration, durationFormatted,
            calories: activity.calories || null,
            intensity_factor: intensityFactor,
        };
    },

    // ─── Sport-specific: General (fallback) ───────────────────

    _analyzeGeneral: (activity, profile) => {
        const act = SportAnalysis._extractActivity(activity);
        const constants = SportAnalysis._getConstants(activity.type);
        const prof = SportAnalysis._extractProfile(profile);

        const { tss, intensityFactor } = SportAnalysis._calcTSS(act, constants, prof);
        const trimp = SportAnalysis._calcTRIMP(act, constants, prof);
        const hrZones = SportAnalysis._calcHRZones(act, prof);
        const pace = SportAnalysis._calcPace(act);
        const elev = SportAnalysis._calcElevation(act);

        const { duration, durationFormatted } = SportAnalysis._getDurationFormatted(act.duration);

        return {
            sportType: 'general',
            sportLabel: constants.label,
            icon: constants.icon,
            analysisType: 'simple',
            tss, trimp, intensityFactor,
            duration, durationFormatted,
            calories: activity.calories || null,
            hrZones,
            pace,
            intensity_factor: intensityFactor,
            ...elev,
        };
    },

    // ─── Main entry point ─────────────────────────────────────

    analyze: (activity, profile = {}, streams = null) => {
        if (!activity) return { tss: null, trimp: null, intensityFactor: null, zones: null, analysisType: 'none' };

        const type = activity.type || 'Run';
        const analysisType = SportAnalysis._getAnalysisType(type);

        switch (analysisType) {
            case 'run': return SportAnalysis._analyzeRun(activity, profile, streams);
            case 'ride': return SportAnalysis._analyzeRide(activity, profile, streams);
            case 'swim': return SportAnalysis._analyzeSwim(activity, profile, streams);
            case 'trail': return SportAnalysis._analyzeTrailRun(activity, profile, streams);
            case 'walk': return SportAnalysis._analyzeWalk(activity, profile);
            case 'hiit': return SportAnalysis._analyzeHIIT(activity, profile);
            case 'strength': return SportAnalysis._analyzeStrength(activity, profile);
            case 'yoga': return SportAnalysis._analyzeYoga(activity, profile);
            default: return SportAnalysis._analyzeGeneral(activity, profile);
        }
    },
};

module.exports = { SportAnalysis };
