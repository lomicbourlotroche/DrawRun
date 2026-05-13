'use strict';

const Polarization = {
    /**
     * Calcul de l'indice de polarisation
     * Ref: Seiler & Kjerland (2006). Quantifying training intensity distribution.
     * 
     * Distribution optimale (Seiler 80/20):
     * - 80% basse intensité (<VT1)
     * - 0% modérée (VT1-VT2) — zone "poubelle"
     * - 20% haute intensité (>VT2)
     * 
     * Polarization Index = (%high + %low) - %moderate
     * Optimal = 100 (pas de temps modéré)
     */
    calculatePolarizationIndex: (activitiesWithZones) => {
        if (!activitiesWithZones || activitiesWithZones.length === 0) return 0;
        
        let totalLow = 0, totalModerate = 0, totalHigh = 0;
        let count = 0;
        
        activitiesWithZones.forEach(act => {
            const zones = act.zonePercent || act;
            const z1 = zones[1] || 0;
            const z2 = zones[2] || 0;
            const z3 = zones[3] || 0;
            const z4 = zones[4] || 0;
            const z5 = zones[5] || 0;
            
            totalLow += z1 + z2;
            totalModerate += z3;
            totalHigh += z4 + z5;
            count++;
        });
        
        if (count === 0) return 0;
        
        const avgLow = totalLow / count;
        const avgModerate = totalModerate / count;
        const avgHigh = totalHigh / count;
        
        return Math.round((avgHigh + avgLow) - avgModerate);
    },
    
    /**
     * Classification avancée de la distribution d'intensité
     * Ref: Seiler (2010). What is best practice for training intensity?
     */
    classifyDistribution: (lowPercent, moderatePercent, highPercent) => {
        const total = lowPercent + moderatePercent + highPercent || 1;
        const low = (lowPercent / total) * 100;
        const mod = (moderatePercent / total) * 100;
        const high = (highPercent / total) * 100;
        
        // Polarized (Seiler 80/20)
        if (low >= 75 && high >= 15 && mod <= 10) {
            return { type: 'polarized', label: 'Polarisé (80/20)', optimal: true, match: 95 };
        }
        // Pyramidal (bon pour débutants)
        if (low >= 70 && high < 15 && mod >= 15 && mod <= 30) {
            return { type: 'pyramidal', label: 'Pyramidal', optimal: true, match: 85 };
        }
        // Threshold-heavy (trop de tempo)
        if (mod > 35) {
            return { type: 'moderate-heavy', label: 'Trop modéré (zone poubelle)', optimal: false, match: 30 };
        }
        // HIIT-heavy (trop intense)
        if (high > 35) {
            return { type: 'high-heavy', label: 'Trop intense', optimal: false, match: 40 };
        }
        // Mixed
        return { type: 'mixed', label: 'Mixte — manque de structure', optimal: false, match: 55 };
    },
    
    /**
     * Recommandation de distribution optimale selon le niveau
     * Ref: Seiler (2010), Stöggl & Sperlich (2014)
     */
    getOptimalDistribution: (level = 'intermediate', goal = 'endurance') => {
        const distributions = {
            beginner: { low: 85, moderate: 10, high: 5 },
            intermediate: { low: 80, moderate: 5, high: 15 },
            advanced: { low: 75, moderate: 5, high: 20 },
            elite: { low: 78, moderate: 2, high: 20 },
        };
        
         if (goal === 'speed') {
             return { low: 65, moderate: 10, high: 25 };
         }
         if (goal === 'marathon') {
             return { low: 82, moderate: 8, high: 10 };
         }

         // eslint-disable-next-line security/detect-object-injection
         return distributions[level] || distributions.intermediate;
    },
    
    /**
     * Recommandation basée sur polarization
     */
    getRecommendation: (polarizationIndex) => {
        if (polarizationIndex >= 90) {
            return { type: 'optimal', message: 'Polarisation idéale. Continuez!' };
        }
        if (polarizationIndex >= 70) {
            return { type: 'good', message: 'Bonne distribution. Peut mieux faire.' };
        }
        if (polarizationIndex >= 50) {
            return { type: 'moderate', message: 'Trop de temps en zone modérée. Augmentez haute intensité.' };
        }
        return { type: 'poor', message: 'Distribution non-polarisée. Adaptez!' };
    },
    
    /**
     * Calcul de la "zone poubelle" (junk miles)
     * Temps passé en zone 3 qui ne contribue ni à l'endurance ni à la vitesse
     */
    calculateJunkMiles: (activitiesWithZones) => {
        if (!activitiesWithZones || activitiesWithZones.length === 0) return { percent: 0, hours: 0 };
        
        let totalModerate = 0, totalDuration = 0;
        activitiesWithZones.forEach(act => {
            const zones = act.zonePercent || act;
            totalModerate += (zones[3] || 0) / 100 * (act.duration || 3600);
            totalDuration += act.duration || 3600;
        });
        
        return {
            percent: totalDuration > 0 ? Math.round((totalModerate / totalDuration) * 100) : 0,
            hours: Math.round(totalModerate / 3600 * 10) / 10,
            recommendation: totalModerate / totalDuration > 0.15 ? 
                'Réduisez le temps en zone 3. Convertissez en zone 2 ou zone 5.' : 'OK'
        };
    },
};

module.exports = { Polarization };
