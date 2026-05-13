'use strict';

const Biomechanics = {
    /**
     * Estimate running dynamics
     * @param {number} speedMs - Speed in m/s
     * @param {number} cadence - Cadence in steps per minute (total, e.g. 180)
     * @param {number} weightKg - Runner weight
     * @param {number} heightCm - Runner height (optional)
     */
    estimateMetrics: (speedMs, cadence, weightKg = 70, _heightCm = 175) => {
        if (!speedMs || !cadence || cadence < 100) return null;

        const _stepFreq = cadence / 60; // steps per second
        const stepLength = speedMs / _stepFreq; // meters per step

        // 1. Vertical Oscillation (VO) estimation
        // Higher cadence and speed usually correlate with lower VO
        // Ref: Dalleau et al. (2004) - Simple method for field-based stiffness
        const voCm = Math.max(4, 15 - (speedMs * 1.2) - (cadence - 160) * 0.1);

        // 2. Ground Contact Time (GCT) estimation
        // Typical range: 160ms (elite) to 300ms (beginner)
        const gctMs = Math.max(160, 350 - (speedMs * 18) - (cadence - 160) * 0.5);

        // 3. Leg Stiffness (kN/m)
        // Kleg = Fmax / ΔL (simplified)
        // Ref: Morin et al. (2005)
        const stepPeriod = 1 / _stepFreq;
        const flightTime = stepPeriod - (gctMs / 1000);
        let stiffness = 0;
        if (flightTime > 0) {
            const contactSec = gctMs / 1000;
            const denominator = 2 * contactSec * ((stepPeriod * Math.PI / 2) - contactSec);
            if (denominator > 0) {
                const stiffnessNm = (weightKg * 9.81 * Math.PI * stepPeriod) / denominator;
                stiffness = Number.isFinite(stiffnessNm) ? stiffnessNm / 1000 : 0; // kN/m
            }
        }

        // 4. Vertical Ratio (%) = VO / Step Length
        const verticalRatio = stepLength > 0 ? (voCm / 100) / stepLength * 100 : 0;

        return {
            verticalOscillation: Math.round(voCm * 10) / 10,
            groundContactTime: Math.round(gctMs),
            stiffness: Math.round(stiffness * 10) / 10,
            verticalRatio: Math.round(verticalRatio * 10) / 10,
            stepLength: Math.round(stepLength * 100) / 100,
            cadence,
        };
    },

    /**
     * Generate technical advice based on metrics
     */
    getAdvice: (metrics, speedKmh) => {
        if (!metrics) return [];
        const advice = [];

        if (metrics.cadence < 165 && speedKmh > 10) {
            advice.push({
                type: 'cadence',
                message: 'Cadence faible détectée.',
                detail: 'Augmentez votre cadence de 5% pour réduire les forces d\'impact et le risque de blessure.',
                priority: 'high'
            });
        }

        if (metrics.verticalOscillation > 11) {
            advice.push({
                type: 'oscillation',
                message: 'Oscillation verticale élevée.',
                detail: 'Vous dépensez trop d\'énergie vers le haut. Essayez de courir plus "à plat".',
                priority: 'moderate'
            });
        }

        if (metrics.groundContactTime > 260 && speedKmh > 12) {
            advice.push({
                type: 'gct',
                message: 'Temps de contact au sol prolongé.',
                detail: 'Travaillez votre explosivité (pluymétrie) pour une foulée plus réactive.',
                priority: 'moderate'
            });
        }

        if (metrics.verticalRatio < 7) {
            advice.push({
                type: 'efficiency',
                message: 'Excellente efficacité !',
                detail: 'Votre ratio vertical est optimal, signe d\'une technique très économique.',
                priority: 'low'
            });
        }

        return advice;
    },

    /**
     * Standalone calculation for vertical oscillation
     */
    calculateVerticalOscillation: (cadence, speedMs) => {
        return Math.max(4, 15 - (speedMs * 1.2) - (cadence - 160) * 0.1);
    },

    /**
     * Standalone calculation for ground contact time
     */
    calculateGroundContactTime: (cadence, speedMs) => {
        return Math.max(160, 350 - (speedMs * 18) - (cadence - 160) * 0.5);
    },

    /**
     * Standalone calculation for leg stiffness
     */
    calculateLegStiffness: (weightKg, flightTime, contactTime) => {
        const stepPeriod = flightTime + contactTime;
        const _stepFreq = 1 / stepPeriod;
        const g = 9.81;
        // Kleg = Fmax / dL simplified model
        const stiffnessNm = (weightKg * g * Math.PI * stepPeriod) / ( 2 * contactTime * ( ( stepPeriod * Math.PI / 2 ) - contactTime ) );
        return stiffnessNm / 1000; // Return in kN/m
    },

    /**
     * Rating system for metrics
     */
    getRating: (metric, value) => {
         const ratings = {
             cadence: { excellent: 180, fair: 170 },
             oscillation: { excellent: 8, fair: 11 }, // lower is better
             gct: { excellent: 200, fair: 250 } // lower is better
         };

         // eslint-disable-next-line security/detect-object-injection
         const r = ratings[metric];
        if (!r) return 'unknown';

        if (metric === 'cadence') {
            if (value >= r.excellent) return 'excellent';
            if (value >= r.fair) return 'good';
            return 'fair';
        } else {
            if (value <= r.excellent) return 'excellent';
            if (value <= r.fair) return 'good';
            return 'fair';
        }
    }
};

module.exports = { Biomechanics };
