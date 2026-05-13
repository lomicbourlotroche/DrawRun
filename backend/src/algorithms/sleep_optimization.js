'use strict';

const SleepOptimization = {
    /**
     * Calculate optimal sleep duration based on training load
     */
    calculateOptimalDuration: (dailyTSS, trainingPhase, age = 30) => {
        // Base sleep need by age (NSF guidelines)
        const baseSleep = age < 25 ? 9 : age < 65 ? 8 : 7.5;

        // Training load adjustment
        const tssAdjustment = dailyTSS > 200 ? 1.5 : dailyTSS > 150 ? 1.0 : dailyTSS > 100 ? 0.5 : 0;

         // Phase adjustment
         const phaseAdjustmentMap = {
             base: 0,
             build: 0.3,
             peak: 0.5,
             taper: -0.3,
             race: -0.5,
         };
         // eslint-disable-next-line security/detect-object-injection
         const phaseAdjustment = phaseAdjustmentMap[trainingPhase] || 0;

        return Math.round((baseSleep + tssAdjustment + phaseAdjustment) * 10) / 10;
    },

    /**
     * Calculate sleep quality score from available data
     */
    calculateSleepQuality: (sleepDuration, sleepEfficiency, hrvChange, restingHRChange) => {
        let score = 0;

        // Duration score (0-30)
        if (sleepDuration >= 8) score += 30;
        else if (sleepDuration >= 7) score += 25;
        else if (sleepDuration >= 6) score += 15;
        else score += 5;

        // Efficiency score (0-25)
        if (sleepEfficiency >= 90) score += 25;
        else if (sleepEfficiency >= 85) score += 20;
        else if (sleepEfficiency >= 80) score += 15;
        else score += 5;

        // HRV score (0-25)
        if (hrvChange >= 0) score += 25;
        else if (hrvChange > -5) score += 20;
        else if (hrvChange > -15) score += 10;
        else score += 0;

        // RHR score (0-20)
        if (restingHRChange <= 0) score += 20;
        else if (restingHRChange < 3) score += 15;
        else if (restingHRChange < 7) score += 8;
        else score += 0;

        return {
            score: Math.min(100, score),
            rating: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor',
            components: {
                duration: Math.round((score >= 75 ? 30 : score >= 55 ? 25 : score >= 30 ? 15 : 5) / 30 * 100),
                efficiency: Math.round((sleepEfficiency || 0)),
                hrv: Math.round((hrvChange >= 0 ? 25 : hrvChange > -5 ? 20 : hrvChange > -15 ? 10 : 0) / 25 * 100),
                restingHR: Math.round((restingHRChange <= 0 ? 20 : restingHRChange < 3 ? 15 : restingHRChange < 7 ? 8 : 0) / 20 * 100),
            },
        };
    },

    /**
     * Generate sleep recommendations
     */
    generateRecommendations: (sleepQuality, trainingLoad, nextSessionIntensity) => {
        const recs = [];

        if (sleepQuality.score < 60) {
            recs.push('Qualité de sommeil insuffisante. Priorisez le sommeil ce soir.');
            recs.push('Évitez les écrans 1h avant le coucher.');
        }

        if (trainingLoad > 150) {
            recs.push('Charge d\'entraînement élevée: sieste de 20-30min recommandée.');
        }

        if (nextSessionIntensity === 'high' || nextSessionIntensity === 'very_high') {
            recs.push('Séance intense demain: sommeil de qualité essentiel pour la performance.');
        }

        // Sleep hygiene recommendations
        recs.push('Température chambre: 18-19°C optimale.');
        recs.push('Caféine: éviter après 14h.');

        return {
            recommendations: recs,
            priority: sleepQuality.score < 50 ? 'high' : sleepQuality.score < 70 ? 'moderate' : 'low',
        };
    },

    /**
     * Calculate sleep bank (cumulative sleep debt)
     */
    calculateSleepBank: (sleepHistoryDays, optimalDuration = 8) => {
        const totalSleep = sleepHistoryDays.reduce((sum, d) => sum + d.duration, 0);
        const totalOptimal = sleepHistoryDays.length * optimalDuration;
        const debt = totalOptimal - totalSleep;

        return {
            totalDebt: Math.round(debt * 10) / 10,
            avgDuration: Math.round((totalSleep / sleepHistoryDays.length) * 10) / 10,
            trend: debt > 5 ? 'deficit' : debt < -5 ? 'surplus' : 'balanced',
            recoveryDays: Math.ceil(Math.max(0, debt) / 1.5),
        };
    },
};

module.exports = { SleepOptimization };
