'use strict';

const Nutrition = {
    /**
     * Calculate fueling requirements for a session
     */
    calculateRequirements: (durationMinutes, intensityFactor, _weightKg = 70) => {
        // Hydration: 400-800ml per hour depending on intensity
        const hydrationPerHour = 400 + (intensityFactor > 0.8 ? 400 : intensityFactor > 0.6 ? 200 : 0);
        const totalHydration = Math.round((durationMinutes / 60) * hydrationPerHour);

        // Carbohydrates (CHO): 30-90g per hour
        let choPerHour = 0;
        if (durationMinutes < 45) choPerHour = 0;
        else if (durationMinutes < 75) choPerHour = 30; // Rinse or small amount
        else if (durationMinutes < 150) choPerHour = 60; // 60g/h (Glucose:Fructose 2:1)
        else choPerHour = 90; // 90g/h (Multiple transportable CHOs)

        // Adjust by intensity
        if (intensityFactor < 0.6) choPerHour *= 0.6;
        else if (intensityFactor > 0.9) choPerHour *= 1.2;

        const totalCHO = Math.round((durationMinutes / 60) * choPerHour);

        // Sodium: 500-1000mg per liter
        const totalSodium = Math.round((totalHydration / 1000) * 700);

        return {
            hydration: { totalMl: totalHydration, perHourMl: hydrationPerHour },
            carbs: { totalG: totalCHO, perHourG: Math.round(choPerHour) },
            sodium: { totalMg: totalSodium },
            recommendations: Nutrition.getRecommendations(durationMinutes, choPerHour),
        };
    },

    getRecommendations: (duration, choPerHour) => {
        const recs = [];
        if (duration > 120) {
            recs.push('Privilégiez un ratio Glucose:Fructose 2:1 pour absorber >60g/h.');
            recs.push('Commencez à vous ravitailler dès la 20ème minute.');
        }
        if (choPerHour >= 90) {
            recs.push('Entraînement de l\'intestin (Gut Training) indispensable pour ces doses.');
        }
        recs.push('Visez 500-700mg de sodium par litre d\'eau.');
        return recs;
    },
    
    /**
     * Recovery nutrition (4:1 Carb to Protein ratio)
     */
    calculateRecovery: (weightKg) => {
        return {
            carbsG: Math.round(weightKg * 1.2),
            proteinG: Math.round(weightKg * 0.3),
            timing: 'Dans les 30-60 minutes après l\'effort.',
        };
    }
};

module.exports = { Nutrition };
