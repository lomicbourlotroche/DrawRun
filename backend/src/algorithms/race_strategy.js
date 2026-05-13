'use strict';

const { MathUtils } = require('./math_utils');
const { RunningPerformance } = require('./running_performance');
const { EnvironmentalImpact } = require('./environmental_impact');
const { Taper } = require('./taper');
const { Nutrition } = require('./nutrition');

const RaceStrategy = {
    /**
     * Generate pacing strategy
     * @param {Array} points - [{lat, lon, elev, dist}, ...] or simplified points
     * @param {object} athlete - {vdot, weight}
     * @param {object} params - {temp, humidity, altitude, goalTime, strategyType}
     */
    generatePlan: (points, athlete, params) => {
        if (!points || points.length < 2) return null;

        const { vdot } = athlete;
        const { temp = 15, humidity = 50, goalTime = null } = params;

        // 1. Calculer l'allure de base (effort plat)
        let basePaceSec;
        if (goalTime) {
            const totalDist = points[points.length - 1].dist;
            basePaceSec = (goalTime * 60) / (totalDist / 1000);
        } else {
            // Utiliser VDOT pour estimer l'allure marathon/semi/10k
            const preds = RunningPerformance.predictRaceTimes(vdot);
            const totalDist = points[points.length - 1].dist;
            
            let targetDist;
            if (totalDist > 30000) targetDist = 'marathon';
            else if (totalDist > 15000) targetDist = 'half';
            else if (totalDist > 8000) targetDist = '10k';
             else targetDist = '5k';
             
             // eslint-disable-next-line security/detect-object-injection
             const timeHours = preds[targetDist];
            basePaceSec = (timeHours * 3600) / (targetDist === 'marathon' ? 42.195 : targetDist === 'half' ? 21.0975 : targetDist === '10k' ? 10 : 5);
        }

        // 2. Découper en segments de 1km (ou plus fin si besoin)
        const segments = [];
        let currentSeg = { dist: 0, elevGain: 0, elevLoss: 0, points: [] };
        let _lastDist = 0;

        points.forEach((p, i) => {
            if (i === 0) return;
            const prev = points[i - 1];
            const d = p.dist - prev.dist;
            const e = p.elev - prev.elev;

            if (e > 0) currentSeg.elevGain += e;
            else currentSeg.elevLoss += Math.abs(e);

            currentSeg.dist += d;

            if (currentSeg.dist >= 1000 || i === points.length - 1) {
                const grade = (currentSeg.elevGain - currentSeg.elevLoss) / currentSeg.dist;
                // Calcul du coût métabolique via Minetti (modèle GAP)
                const g = MathUtils.clamp(grade, -0.45, 0.45);
                const c5 = 155.4, c4 = -30.4, c3 = -43.3, c2 = 46.3, c1 = 19.5, c0 = 3.6;
                const costG = c5 * Math.pow(g, 5) + c4 * Math.pow(g, 4) + c3 * Math.pow(g, 3) + c2 * Math.pow(g, 2) + c1 * g + c0;
                const slopeFactor = costG / c0;

                // Cardiac drift: ~1.5% d'effort supplémentaire nécessaire par heure
                const cumulativeTimeHours = segments.reduce((acc, s) => acc + s.targetPaceSec, 0) / 3600;
                const driftFactor = 1 + (cumulativeTimeHours * 0.015);

                // Application du facteur environnemental
                const envFactor = EnvironmentalImpact.getAdjustmentFactor(temp, humidity, p.elev);
                
                const targetPace = basePaceSec * slopeFactor * envFactor * driftFactor;

                segments.push({
                    km: segments.length + 1,
                    distance: Math.round(currentSeg.dist),
                    elevGain: Math.round(currentSeg.elevGain),
                    elevLoss: Math.round(currentSeg.elevLoss),
                    grade: Math.round(grade * 1000) / 10,
                    targetPaceSec: Math.round(targetPace),
                    targetPace: `${Math.floor(targetPace / 60)}:${String(Math.round(targetPace % 60)).padStart(2, '0')}`,
                    cumulativeTime: Math.round((segments.reduce((acc, s) => acc + s.targetPaceSec, 0) + targetPace) * 10) / 10
                });

                currentSeg = { dist: 0, elevGain: 0, elevLoss: 0, points: [] };
            }
        });

        // 4. Tapering strategy (if enough distance)
        const totalDistKm = points[points.length - 1].dist / 1000;
        let taper = null;
        if (totalDistKm >= 5) {
            const distanceTag = totalDistKm > 30 ? 'marathon' : totalDistKm > 15 ? 'half' : totalDistKm > 8 ? '10k' : '5k';
            // On estime la charge hebdomadaire actuelle à partir du VDOT si non fournie
            const estimatedWeeklyLoad = athlete.weeklyLoad || (athlete.vdot * 10);
            taper = Taper.calculateOptimalTaper(estimatedWeeklyLoad, 14, distanceTag);
            taper.recommendations = Taper.getAdvice(distanceTag);
        }

        // 5. Nutrition strategy integration
        const totalDurationMin = segments.reduce((acc, s) => acc + s.targetPaceSec, 0) / 60;
        const nutrition = Nutrition.calculateRequirements(totalDurationMin, 0.85, athlete.weight || 70);

        return {
            segments,
            summary: {
                totalDistance: Math.round(points[points.length - 1].dist),
                totalElevationGain: Math.round(segments.reduce((acc, s) => acc + s.elevGain, 0)),
                totalTimeSec: Math.round(segments.reduce((acc, s) => acc + s.targetPaceSec, 0)),
                averagePace: `${Math.floor((segments.reduce((acc, s) => acc + s.targetPaceSec, 0) / (points[points.length - 1].dist / 1000)) / 60)}:${String(Math.round((segments.reduce((acc, s) => acc + s.targetPaceSec, 0) / (points[points.length - 1].dist / 1000)) % 60)).padStart(2, '0')}`
            },
            nutrition,
            taper
        };
    },

    /**
     * Helper to adjust pace for grade
     */
    adjustPaceForGrade: (paceSec, grade) => {
        const g = MathUtils.clamp(grade / 100, -0.45, 0.45);
        const c5 = 155.4, c4 = -30.4, c3 = -43.3, c2 = 46.3, c1 = 19.5, c0 = 3.6;
        const costG = c5 * Math.pow(g, 5) + c4 * Math.pow(g, 4) + c3 * Math.pow(g, 3) + c2 * Math.pow(g, 2) + c1 * g + c0;
        const slopeFactor = costG / c0;
        return paceSec * slopeFactor;
    }
};

module.exports = { RaceStrategy };
