'use strict';

const { MathUtils } = require('./math_utils');
const SCIENTIFIC_CONSTANTS = require('./scientific_constants');

const TrainingLoad = {
    /**
     * TRIMP - Training Impulse selon Edwards (1993)
     * Ref: Edwards JC (1993). Heart rate: A practical guide.
     * 
     * TRIMP = Σ (temps en zone × coefficient)
     */
    calculateTRIMP: (hrZonesMinutes, sex = 'M') => {
        const sexFactor = sex === 'F' ? SCIENTIFIC_CONSTANTS.TRIMP.SEX_FACTOR_FEMALE : 
                          SCIENTIFIC_CONSTANTS.TRIMP.SEX_FACTOR_MALE;
        
         let trimp = 0;
         hrZonesMinutes.forEach((minutes, index) => {
             // eslint-disable-next-line security/detect-object-injection
             const zone = SCIENTIFIC_CONSTANTS.TRIMP.ZONES[index];
            if (zone && minutes > 0) {
                trimp += minutes * zone.coefficient;
            }
        });
        
        return trimp * sexFactor;
    },
    
    /**
     * TRIMP Banister exponentiel
     * Ref: Banister & Allen (1990)
     * TRIMP = duration × HRR × e^(k × HRR)
     * k_male = 1.92, k_female = 1.67 (différence physiologique)
     */
    calculateTRIMPBanister: (durationMinutes, avgHR, maxHR, restingHR = 60, sex = 'M') => {
        if (!maxHR || maxHR <= 0 || !avgHR || durationMinutes <= 0) return 0;
        
        const hrr = (avgHR - restingHR) / (maxHR - restingHR);
        const clampedHRR = MathUtils.clamp(hrr, 0, 1);
        
        // k exponentiel: différence homme/femme (Mujika)
        const k = sex === 'F' ? 1.67 : 1.92;
        
        return durationMinutes * clampedHRR * Math.exp(k * clampedHRR);
    },
    
    /**
     * TRIMP Lucia (zones individualisées)
     * Ref: Lucia et al. (2003). HR response during stage racing.
     * Utilise VT1/VT2 comme bornes au lieu de %FCmax fixes
     */
    calculateTRIMPLucia: (durationMinutes, avgHR, vt1HR, vt2HR, sex = 'M') => {
        if (!avgHR || !vt1HR || !vt2HR) return 0;
        
        let zoneFactor;
        if (avgHR < vt1HR) {
            zoneFactor = 1; // Zone 1: sous VT1
        } else if (avgHR < vt2HR) {
            zoneFactor = 2.5; // Zone 2: entre VT1 et VT2
        } else {
            zoneFactor = 5; // Zone 3: au-dessus de VT2
        }
        
        const sexFactor = sex === 'F' ? 1.3 : 1.0;
        return durationMinutes * zoneFactor * sexFactor;
    },
    
    /**
     * sRPE-TSS — Session RPE × duration
     * Ref: Foster (1998). Monitoring training.
     * Utile quand pas de données HR ou puissance
     */
    calculateSRPETSS: (rpe, durationMinutes) => {
        if (!rpe || !durationMinutes) return 0;
        // sRPE = RPE (1-10) × duration (min)
        // Normalisé pour être comparable au TSS Coggan
        return (rpe * durationMinutes) / 10;
    },
    
    /**
     * TRIMP simplifié à partir de FC moyenne et max
     */
    calculateTRIMPFromAvgHR: (durationMinutes, avgHR, maxHR, sex = 'M') => {
        if (!maxHR || maxHR <= 0 || !avgHR) return 0;
        
        const hrPercent = avgHR / maxHR;
        const sexFactor = sex === 'F' ? 1.3 : 1.0;
        
        let zoneFactor = 1;
        for (const zone of SCIENTIFIC_CONSTANTS.TRIMP.ZONES) {
            if (hrPercent >= zone.min && hrPercent < zone.max) {
                zoneFactor = zone.coefficient;
                break;
            }
        }
        if (hrPercent >= 0.9) zoneFactor = 5;
        
        return durationMinutes * zoneFactor * sexFactor;
    },
    
    /**
     * TSS - Training Stress Score
     * Ref: Coggan, A. (2003). Training and Racing with a Power Meter.
     * 
     * TSS = (duration_hours × IF² × 100)
     */
    calculateTSS: (durationSeconds, intensityFactor) => {
        const durationHours = durationSeconds / 3600;
        return durationHours * Math.pow(intensityFactor, 2) * 100;
    },
    
    /**
     * TSS par sport avec coefficients spécifiques
     * Ref: Adjustements empiriques selon l'impact métabolique du sport
     */
    calculateSportTSS: (durationSeconds, intensityFactor, sportType = 'Run') => {
        const baseTSS = TrainingLoad.calculateTSS(durationSeconds, intensityFactor);
        
        const coefficients = {
            Run: 1.0,
            Ride: 1.0,
            Swim: 0.85,        // Moindre impact musculaire
            TrailRun: 1.15,    // Dénivelé augmente la charge
            Walk: 0.50,
             HIIT: 1.20,        // Effort très intense
             Strength: 0.60,    // Charge différente (musculaire vs cardio)
             Yoga: 0.30,
         };

         // eslint-disable-next-line security/detect-object-injection
         return baseTSS * (coefficients[sportType] || 1.0);
    },
    
    /**
     * Estimation IF depuis FC
     * IF ≈ (%FCmax - 0.3) / 0.5
     */
    estimateIFFromHR: (avgHRPercent) => {
        const hrPercent = avgHRPercent * 100;
        return MathUtils.clamp((hrPercent - 30) / 50, 0.3, 1.5);
    },
    
    /**
     * Calcul de la Normalized Power/Pace
     * Ref: Coggan (2003) - 30s rolling average, 4th power, 4th root
     */
    calculateNormalizedValue: (values) => {
        if (!values || values.length === 0) return 0;
        
        // 1. Rolling 30s average
        const rollingAvg = [];
        for (let i = 0; i < values.length; i++) {
            const start = Math.max(0, i - 29);
            const window = values.slice(start, i + 1);
            rollingAvg.push(window.reduce((a, b) => a + b, 0) / window.length);
        }
        
        // 2. 4th power average
        const fourthPowerAvg = rollingAvg.reduce((sum, v) => sum + Math.pow(v, 4), 0) / rollingAvg.length;
        
        // 3. 4th root
        return Math.pow(fourthPowerAvg, 0.25);
    },
    
    /**
     * Variability Index — mesure de la régularité de l'effort
     * Ref: Coggan — VI = NP / AP
     * VI < 1.05 = effort régulier (contre-la-montre)
     * VI > 1.15 = effort très variable (course, trail)
     */
    calculateVariabilityIndex: (normalizedPower, averagePower) => {
        if (!averagePower || averagePower <= 0) return 0;
        return normalizedPower / averagePower;
    },
};

module.exports = { TrainingLoad };
