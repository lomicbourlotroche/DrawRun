'use strict';

const AltitudeTraining = {
    /**
     * Calculate performance degradation at altitude
     * VO2max decreases ~1% per 100m above 700m
     */
    calculatePerformanceEffect: (altitudeMeters, acclimatizationDays = 0) => {
        if (altitudeMeters < 700) return { vo2maxChange: 0, paceAdjustment: 1.0, rating: 'none' };

        // Base VO2max loss: ~1% per 100m above 700m
        const effectiveAltitude = altitudeMeters - 700;
        const baseVo2maxLoss = effectiveAltitude / 100;

        // Acclimatization reduces the effect
        const acclimatizationFactor = Math.min(0.4, acclimatizationDays * 0.02);
        const netVo2maxLoss = baseVo2maxLoss * (1 - acclimatizationFactor);

        // Pace adjustment: ~2% per 1% VO2max loss
        const paceAdjustment = 1 + (netVo2maxLoss * 0.02);

        let rating;
        if (altitudeMeters < 1500) rating = 'low';
        else if (altitudeMeters < 2500) rating = 'moderate';
        else if (altitudeMeters < 3500) rating = 'high';
        else rating = 'extreme';

        return {
            vo2maxChange: Math.round(-netVo2maxLoss * 10) / 10,
            paceAdjustment: Math.round(paceAdjustment * 1000) / 1000,
            rating,
            altitude: altitudeMeters,
            acclimatizationDays,
        };
    },

    /**
     * Calculate optimal altitude training protocol
     * "Live High, Train Low" model
     */
    calculateOptimalProtocol: (goalAltitude, daysAvailable, baseAltitude = 0) => {
        if (goalAltitude < 1500) {
            return {
                protocol: 'not_needed',
                recommendation: 'Altitude < 1500m: pas d\'acclimatation nécessaire.',
                minDays: 0,
            };
        }

        // Minimum acclimatization days
        const minDays = goalAltitude < 2500 ? 7 : goalAltitude < 3500 ? 14 : 21;

        if (daysAvailable < minDays) {
            return {
                protocol: 'insufficient',
                recommendation: `Acclimatation insuffisante: ${daysAvailable}j < ${minDays}j minimum.`,
                minDays,
                risk: 'high',
            };
        }

        // Live High, Train Low recommendation
        const optimalLivingAltitude = Math.min(goalAltitude, 2500);
        const trainingAltitude = Math.max(baseAltitude, 1000);

        return {
            protocol: 'live_high_train_low',
            livingAltitude: optimalLivingAltitude,
            trainingAltitude,
            minAcclimatizationDays: minDays,
            phases: [
                { days: '1-3', intensity: 'low', description: 'Adaptation progressive, uniquement endurance facile.' },
                { days: '4-7', intensity: 'moderate', description: 'Introduction de seuil, volume réduit de 20%.' },
                { days: '8-14', intensity: 'normal', description: 'Retour au volume normal, intensité progressive.' },
                { days: '15+', intensity: 'full', description: 'Entraînement normal. Gain d\'endurance attendu.' },
            ],
            expectedBenefits: [
                'Augmentation de la masse de globules rouges (+1-2%/semaine)',
                'Amélioration du transport d\'oxygène',
                'Gain de performance au retour en altitude basse (2-4%)',
            ],
        };
    },

    /**
     * Calculate expected performance gain after altitude camp
     */
    calculatePostAltitudeGain: (altitudeDays, altitudeMeters, daysAfterReturn) => {
        if (altitudeDays < 14 || altitudeMeters < 2000) {
            return { gain: 0, peakDay: null, duration: 0 };
        }

        // Peak performance gain occurs 2-3 weeks after return
        const peakDay = 14 + Math.floor(altitudeDays / 7);
        const maxGain = Math.min(4, (altitudeMeters / 1000) * 1.5);

        // Gain curve: peaks at ~2 weeks, fades over 4-6 weeks
        const daysFromPeak = Math.abs(daysAfterReturn - peakDay);
        const gainFade = Math.max(0, 1 - daysFromPeak / 30);
        const currentGain = maxGain * gainFade;

        return {
            gain: Math.round(currentGain * 10) / 10,
            maxGain: Math.round(maxGain * 10) / 10,
            peakDay,
            duration: 30,
            daysAfterReturn,
        };
    },

    /**
     * Estimate hemoglobin mass increase from altitude exposure
     */
    estimateHemoglobinChange: (altitudeDays, altitudeMeters) => {
        if (altitudeMeters < 2000 || altitudeDays < 7) return { change: 0 };

        // ~1% increase in Hb mass per week at 2000-2500m
        const altitudeFactor = Math.min(1.5, altitudeMeters / 2000);
        const weeks = altitudeDays / 7;
        const hbIncrease = weeks * 1.0 * altitudeFactor;

        return {
            change: Math.round(hbIncrease * 10) / 10,
            rating: hbIncrease > 5 ? 'significant' : hbIncrease > 2 ? 'moderate' : 'minimal',
        };
    },
};

module.exports = { AltitudeTraining };
