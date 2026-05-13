'use strict';

const Taper = {
    /**
     * Calcul du taper optimal selon le modèle de Mujika & Padilla (2003)
     * 
     * Paramètres optimaux:
     * - Durée: 7-21 jours selon distance
     * - Réduction volume: 40-60%
     * - Maintien intensité: 100%
     * - Réduction fréquence: -20% maximum
     * 
     * Gain attendu: 2-5% de performance
     */
    calculateOptimalTaper: (currentWeeklyLoad, daysToCompetition, distance = '10k', athleteLevel = 'intermediate') => {
        // Durée optimale selon distance
        const optimalDuration = {
            '5k': 7,
            '10k': 8,
            'half': 10,
            'marathon': 14,
            'ultra': 21,
         };
         
         // eslint-disable-next-line security/detect-object-injection
         const targetDays = optimalDuration[distance] || 10;
        const actualDays = Math.min(daysToCompetition, targetDays);
        
        // Réduction de volume optimale
        const volumeReduction = {
            beginner: 0.50,  // 50% de réduction
            intermediate: 0.45,
            advanced: 0.40,
            elite: 0.35,
         };
         
         // eslint-disable-next-line security/detect-object-injection
         const reduction = volumeReduction[athleteLevel] || 0.45;
        
        const plans = [];
        const gainEstimate = 2 + (actualDays / targetDays) * 3; // 2-5% gain
        
        for (let d = actualDays; d >= 0; d--) {
            const progress = 1 - d / actualDays; // 0 → 1
            
            // Taper exponentiel décroissant (Mujika recommande exponentiel)
            const volumeFactor = 1 - reduction * Math.pow(progress, 1.5);
            const intensityFactor = 1.0; // Maintien intensité
            const frequencyFactor = d > actualDays * 0.5 ? 1.0 : 0.8; // -20% fréquence en fin
            
            let sessionType;
            if (d === 0) sessionType = 'competition';
            else if (d === 1) sessionType = 'activation'; // 20min très léger
            else if (d <= 3) sessionType = 'sharp'; // Courts rappels d'allure
            else if (d <= actualDays * 0.5) sessionType = 'maintenance'; // Maintien seuil
            else sessionType = 'reduction'; // Réduction progressive
            
            plans.push({
                daysOut: d,
                volumePercent: Math.round(volumeFactor * 100),
                targetLoad: Math.round(currentWeeklyLoad * volumeFactor / 7),
                intensity: intensityFactor,
                frequency: frequencyFactor,
                sessionType,
                sessionDescription: Taper.getSessionDescription(sessionType, distance),
                isCompetition: d === 0,
            });
        }
        
        return {
            plan: plans,
            expectedGain: Math.round(gainEstimate * 10) / 10,
            duration: actualDays,
            volumeReduction: Math.round(reduction * 100),
            style: 'exponential_decay',
            reference: 'Mujika & Padilla (2003). MSSE.',
        };
    },
    
    /**
     * Description des sessions de taper
     */
    getSessionDescription: (type, _distance) => {
        const descriptions = {
            competition: 'Jour J — Course',
            activation: '20min footing + 3 x 30s allure course',
            sharp: '30min + 4 x 1min allure course (récup 2min)',
             maintenance: '40min dont 2 x 10min allure seuil',
             reduction: 'Endurance fondamentale légère',
         };
         // eslint-disable-next-line security/detect-object-injection
         return descriptions[type] || 'Endurance fondamentale';
    },
    
    /**
     * Calcul de la réduction de charge pour le taper (ancien format, compatibilité)
     */
    calculateTaperPlan: (currentWeeklyLoad, daysToCompetition, _taperStyle = 'classic') => {
        return Taper.calculateOptimalTaper(currentWeeklyLoad, daysToCompetition).plan;
    },

    /**
     * Get tapering specific advice
     */
    getAdvice: (_distance) => {
        return [
            'Maintenez l\'intensité : Ne réduisez pas vos allures de travail, seulement la durée des fractions.',
            'Volume : Réduisez le volume global progressivement.',
            'Sommeil : Visez 1h de sommeil supplémentaire par nuit.',
            'Nutrition : Augmentez la part de glucides à J-3.',
            'Mental : Visualisez votre course chaque jour.'
        ];
    }
};

module.exports = { Taper };
