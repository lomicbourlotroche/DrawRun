'use strict';

const { MathUtils } = require('./math_utils');
const { Cardiovascular } = require('./cardiovascular');
const { RunningPerformance } = require('./running_performance');
const { TrainingLoad } = require('./training_load');
const SCIENTIFIC_CONSTANTS = require('./scientific_constants');
const { Biomechanics } = require('./biomechanics');

const SportAnalysis = {
    /**
     * Constantes spécifiques par sport
     */
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

    /**
     * Analyse complète d'une activité selon le sport
     */
    analyze: (activity, profile) => {
        if (!activity) return { tss: null, trimp: null, intensityFactor: null, zones: null };

         const sportType = activity.type || 'Run';
         // eslint-disable-next-line security/detect-object-injection
         const constants = SportAnalysis.SPORT_CONSTANTS[sportType] || SportAnalysis.SPORT_CONSTANTS.Run;

        const duration = activity.moving_time || activity.elapsed_time || 0;
        const durationMinutes = duration / 60;
        const durationHours = duration / 3600;
        const avgHR = activity.average_heartrate || 0;
        const avgPower = activity.average_power || 0;
        const distance = activity.distance || 0;
        const elevation = activity.total_elevation_gain || 0;

        const fcm = profile?.fcm || Cardiovascular.calculateMaxHR(profile?.age || 30);
        const restingHR = profile?.resting_hr || 60;
        const ftp = profile?.ftp || 0;
        const thresholdHR = fcm * constants.thresholdHR;

        // ===== TSS Calculation =====
        let tss = null;
        let intensityFactor = null;

        if (constants.tssMethod === 'power_based' && avgPower > 0 && ftp > 0) {
            intensityFactor = avgPower / ftp;
            tss = durationHours * Math.pow(intensityFactor, 2) * 100;
        } else if (avgHR > 0 && thresholdHR > 0) {
            intensityFactor = avgHR / thresholdHR;
            tss = durationHours * Math.pow(intensityFactor, 2) * 100;
        } else if (activity.rpe) {
            tss = (activity.rpe / 10) * durationHours * 100 * constants.tssMultiplier;
        }

        if (elevation > 0 && constants.elevationFactor) {
            tss = (tss || 0) + elevation * constants.elevationFactor * durationMinutes / 60;
        }

        if (tss !== null) tss = Math.round(tss * constants.tssMultiplier * 10) / 10;

        // ===== TRIMP Calculation =====
        let trimp = null;
        if (avgHR > 0 && fcm > 0) {
            if (constants.trimpModel === 'banister') {
                const hrr = (avgHR - restingHR) / (fcm - restingHR);
                const k = profile?.sex === 'F' ? 1.92 : 0.86;
                trimp = Math.round(durationMinutes * hrr * Math.exp(k * hrr) * 10) / 10;
            } else {
                const hrPercent = avgHR / fcm;
                let zoneFactor = 1;
                for (const zone of SCIENTIFIC_CONSTANTS.TRIMP.ZONES) {
                    if (hrPercent >= zone.min && hrPercent < zone.max) { zoneFactor = zone.coefficient; break; }
                }
                if (hrPercent >= 0.9) zoneFactor = 5;
                trimp = Math.round(durationMinutes * zoneFactor * (profile?.sex === 'F' ? 1.3 : 1.0) * 10) / 10;
            }
        }

        // ===== HR Zones =====
        let zones = null;
        if (avgHR > 0 && fcm > 0) {
            const hrPercent = avgHR / fcm;
            const zoneNames = ['Zone 1 - Récupération', 'Zone 2 - Endurance', 'Zone 3 - Tempo', 'Zone 4 - Seuil', 'Zone 5 - VO2max'];
            let currentZone = 1;
            for (let i = 0; i < 5; i++) { if (hrPercent >= (i + 1) * 0.2) currentZone = i + 2; }
            currentZone = Math.min(currentZone, 5);
            zones = { current: currentZone, name: zoneNames[currentZone - 1], percent: Math.round(hrPercent * 100) };
        }

        // ===== Pace =====
        let pace = null;
        if (distance > 0 && duration > 0 && constants.hasPace) {
            const paceSecPerKm = duration / (distance / 1000);
            pace = { secPerKm: Math.round(paceSecPerKm), formatted: MathUtils.formatPace(paceSecPerKm), speedKmh: (distance / 1000 / (duration / 3600)).toFixed(1) };
        }

        // ===== VDOT =====
        let vdot = null;
        if (sportType === 'Run' && distance >= 3000 && durationMinutes >= 15) {
            vdot = Math.round(RunningPerformance.calculateVDOT(distance, durationMinutes) * 10) / 10;
        }

        // ===== Normalized Power =====
        let normalizedPower = null, variabilityIndex = null;
        if (sportType === 'Ride' && activity.power_samples && activity.power_samples.length > 0) {
            normalizedPower = Math.round(TrainingLoad.calculateNormalizedValue(activity.power_samples) * 10) / 10;
            if (avgPower > 0) variabilityIndex = Math.round((normalizedPower / avgPower) * 100) / 100;
        }

        // ===== GAP & Efficiency Factor =====
        let gap = null, efficiencyFactor = null;
        if ((sportType === 'Run' || sportType === 'TrailRun' || sportType === 'run') && distance > 0 && duration > 0) {
            const paceSecPerKm = duration / (distance / 1000);
            const grade = elevation / distance;
            const gapSecPerKm = RunningPerformance.calculateGAP(paceSecPerKm, grade);
            
            gap = {
                secPerKm: Math.round(gapSecPerKm),
                formatted: MathUtils.formatPace(gapSecPerKm)
            };
            
            if (avgHR > 0) {
                efficiencyFactor = Math.round(RunningPerformance.calculateEfficiencyFactor(gapSecPerKm, avgHR) * 100) / 100;
            }
        }

        // ===== Biomechanics =====
        let biomechanics = null;
        if (sportType === 'Run' && (activity.average_cadence || activity.cadence)) {
            const cadence = activity.average_cadence || activity.cadence;
            const speedMs = distance / duration;
            const weight = profile?.weight || 70;
            const height = profile?.height || 175;
            
            const metrics = Biomechanics.estimateMetrics(speedMs, cadence, weight, height);
            if (metrics) {
                biomechanics = {
                    ...metrics,
                    advice: Biomechanics.getAdvice(metrics, speedMs * 3.6)
                };
            }
        }

        return {
            sportType, sportLabel: constants.label, tss, trimp,
            intensityFactor: intensityFactor ? Math.round(intensityFactor * 100) / 100 : null,
            zones, pace, vdot, gap, efficiencyFactor, normalizedPower, variabilityIndex,
            biomechanics,
            elevationGain: elevation, duration, durationFormatted: MathUtils.formatDuration(duration),
            calories: activity.calories || null,
        };
    },
};

module.exports = { SportAnalysis };
