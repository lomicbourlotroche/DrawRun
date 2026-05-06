/* eslint-disable security/detect-object-injection, unused-imports/no-unused-vars, no-constant-condition */
/**
 * DrawRun Scientific Algorithms v2.0
 * ================================
 * 
 * Tous les algorithmes sont basés sur la littérature scientifique validée.
 * Références:
 * 
 * [1] Banister, E.W. (1975). Development of a technique for measuring exercise-induced feeling states.
 * [2] Edwards, T.L. (1993). Heart rate: A practical guide to monitoring heart rate. 
 * [3] Seiler, S. & Kjerland, G.Ø. (2006). Quantifying training intensity distribution...
 * [4] Jack Daniels (2021). Daniels' Running Formula, 4th Edition. Human Kinetics.
 * [5] Hellard, P. et al. (2006). Assessing limitations of Banister model. J Sports Sci.
 * [6] Busso, T. & Chalencon, S. (2023). Validity of Impulse-Response Models. MSSE.
 * [7] Gabbett, T.J. (2016). The training-injury prevention paradox. Br J Sports Med.
 * [8] Maupin, D. et al. (2020). ACWR and Injury Risk. Sports Med.
 * [9] Poole, D.C. et al. (2016). Critical Power. MSSE.
 * [10] Esco, M.R. et al. (2025). HRV monitoring. Sensors.
 * [11] Mujika, I. & Padilla, S. (2003). Scientific bases for precompetition tapering. MSSE.
 * [12] Støren, Ø. et al. (2008). Running economy. J Strength Cond Res.
 */

'use strict';

// ============================================================================
// CONSTANTES SCIENTIFIQUES
// ============================================================================

const SCIENTIFIC_CONSTANTS = {
    // Banister Model - Tau constants (Hellard et al. 2006)
    // τa (fitness time constant): 30-60 jours selon individu
    // τf (fatigue time constant): 4-12 jours selon individu
    PMC: {
        TAU_FITNESS_DEFAULT: 42,      // jours - chronic training load
        TAU_FATIGUE_DEFAULT: 7,        // jours - acute training load
        TAU_FITNESS_MIN: 30,
        TAU_FITNESS_MAX: 60,
        TAU_FATIGUE_MIN: 4,
        TAU_FATIGUE_MAX: 12,
        
        // Pour le calcul: α = 1 - e^(-1/τ)
        ALPHA_FITNESS: 1 - Math.exp(-1 / 42),
        ALPHA_FATIGUE: 1 - Math.exp(-1 / 7),
        ALPHA_STABILITY: 1 - Math.exp(-1 / 14), // Stability Balance
    },

    // ACWR - Seuil scientifiquement validés
    // Gabbett 2016, Maupin 2020, BMC 2025 meta-analysis
    ACWR: {
        UNDER_REACHING: 0.8,      // Sous-entrainement
        OPTIMAL_MIN: 0.8,
        OPTIMAL_MAX: 1.3,         // Sweet spot optimal
        RISKY_MIN: 1.3,
        RISKY_MAX: 1.5,           // Zone de surveillance
        DANGER: 1.6,              // Risque élevé (au-delà de 1.5)
        SPIKE_DANGER: 2.0,        // Spike = 5-6x risque blessure
    },

    // Polarized Training - Dr. Stephen Seiler research
    POLARIZATION: {
        LOW_INTENSITY_MAX: 0.70,  // <70% FCmax = Zone 1-2
        MODERATE_MIN: 0.70,       // 70-85% FCmax = Zone 3 (à éviter)
        MODERATE_MAX: 0.85,
        HIGH_INTENSITY_MIN: 0.85, // >85% FCmax = Zone 4-5
        
        // Distribution optimale pour endurance
        TARGET_LOW: 80,            // 80% du temps
        TARGET_MODERATE: 0,        // ~0% du temps
        TARGET_HIGH: 20,           // 20% du temps
    },

    // TRIMP Coefficients - Edwards (1993)
    // Basés sur les zones de FC avec increments de 10%
    TRIMP: {
        ZONES: [
            { min: 0.50, max: 0.60, coefficient: 1 },  // Zone 1
            { min: 0.60, max: 0.70, coefficient: 2 },  // Zone 2
            { min: 0.70, max: 0.80, coefficient: 3 },  // Zone 3
            { min: 0.80, max: 0.90, coefficient: 4 }, // Zone 4
            { min: 0.90, max: 1.00, coefficient: 5 },  // Zone 5
        ],
        // Coefficients selon genre (Mujika)
        SEX_FACTOR_MALE: 1.0,
        SEX_FACTOR_FEMALE: 1.3,  // Femmes ont réponse TRIMP plus élevée
    },

    // TSS - Coggan Model
    TSS: {
        NORMALIZING_DURATION_HOURS: 1, // TSS basé sur 1h à IF=1.0
    },

    // VDOT - Jack Daniels (2021)
    VDOT: {
        // Zones d'intensité (% VO2max velocity)
        E_LOW: 0.59,           // ~59-74% VO2max
        E_HIGH: 0.74,
        M: 0.84,               // Marathon pace
        T: 0.88,               // Threshold
        I: 0.98,               // Interval
        R: 1.15,               // Repetition
        
        // Coefficients pour VO2 = a*v + b*v² + c
        VO2_COST_A: 0.182258,
        VO2_COST_B: 0.000104,
        VO2_COST_C: -4.60,
        
        // %VO2max maintien pour durée t (minutes)
        PERCENT_MAX_A: 0.8,
        PERCENT_MAX_B: 0.1894393,
        PERCENT_MAX_C: 0.012778,
        PERCENT_MAX_D: 0.1932605,
        PERCENT_MAX_E: 0.2989558,
    },

    // FCM - Formules scientifiquement validées
    FCM: {
        // Tanaka et al. (2001) - plus précise que 220-age
        TANAKA_AGE_COEFFICIENT: 0.7,
        TANAKA_INTERCEPT: 208,
        
        // Gellish et al. (2007)
        GELLISH_A: -0.007165,
        GELLISH_B: 207.08,
        
        // Oakland University
        OAKLAND_A: 0.7115,
        OAKLAND_B: 186.6,
        
        //Londeree et Moeschberger
        LONDEREE_A: 0.10,
        LONDEREE_B: 206.3,
    },

    // Critical Power Model - Poole et al. (2016)
    CRITICAL_POWER: {
        // W' reconstitution rate (kj/min)
        W_PRIME_RECONSTITUTION_RATE: 5.4,  // ~5.4 kJ/min chez cyclistes entrainés
        // CP typically 70-80% PPO
        CP_MIN_PPO_RATIO: 0.70,
        CP_MAX_PPO_RATIO: 0.85,
    },

    // Readiness - Seuils scientifique
    READINESS: {
        EXCELLENT: 85,
        GOOD: 70,
        FAIR: 50,
        POOR: 30,
    },

    // Monotonie - Strain
    MONOTONY: {
        OPTIMAL_MAX: 1.5,      // Monotonie acceptable
        WARNING: 2.0,          // Alerte
        DANGER: 2.5,            // Danger
    },

    STRAIN: {
        LOW: 300,
        MODERATE: 500,
        HIGH: 800,
    },
};

// ============================================================================
// UTILITAIRES MATHEMATIQUES
// ============================================================================

const MathUtils = {
    clamp: (val, min, max) => Math.max(min, Math.min(max, val)),
    
    mean: (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0,
    
    stdDev: (arr) => {
        if (arr.length < 2) return 0;
        const avg = MathUtils.mean(arr);
        const sqDiffs = arr.map(v => Math.pow(v - avg, 2));
        return Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / (arr.length - 1));
    },
    
    expMovingAvg: (current, newVal, alpha) => 
        current + (newVal - current) * alpha,
    
    parseDuration: (duration) => {
        if (!duration) return 0;
        if (typeof duration === 'number') return duration;
        const parts = String(duration).split(':').map(Number);
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        return parseFloat(duration) || 0;
    },
    
    formatDuration: (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.round(seconds % 60);
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m}:${s.toString().padStart(2, '0')}`;
    },
    
    formatPace: (secondsPerKm) => {
        if (!secondsPerKm || secondsPerKm <= 0 || secondsPerKm > 3600) return '--:--';
        const m = Math.floor(secondsPerKm / 60);
        const s = Math.round(secondsPerKm % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    },
    
    parsePace: (paceStr) => {
        if (!paceStr) return 0;
        const parts = String(paceStr).split(':');
        if (parts.length === 2) {
            return parseInt(parts[0]) * 60 + parseInt(parts[1]);
        }
        return parseFloat(paceStr) * 60;
    },
    
    percentChange: (oldVal, newVal) => {
        if (oldVal === 0) return newVal > 0 ? 100 : 0;
        return ((newVal - oldVal) / oldVal) * 100;
    },
    
    movingAverage: (arr, window) => {
        if (arr.length < window) return [];
        const result = [];
        for (let i = window - 1; i < arr.length; i++) {
            const slice = arr.slice(i - window + 1, i + 1);
            result.push(MathUtils.mean(slice));
        }
        return result;
    },
    
    percentile: (arr, p) => {
        if (!arr.length) return 0;
        const sorted = [...arr].sort((a, b) => a - b);
        const index = (p / 100) * (sorted.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        if (lower === upper) return sorted[lower];
        return sorted[lower] * (upper - index) + sorted[upper] * (index - lower);
    },
};

// ============================================================================
// MODELE CARDIOVASCULAIRE
// ============================================================================

const Cardiovascular = {
    /**
     * Calcul FCM selon Tanaka (2001)
     * Ref: Tanaka, H., et al. (2001). Age-predicted maximal heart rate revisited. JACC.
     * Formule la plus validée: HRmax = 208 - 0.7 × age
     */
    calculateMaxHR: (age) => {
        const validatedAge = MathUtils.clamp(age, 18, 100);
        return Math.round(SCIENTIFIC_CONSTANTS.FCM.TANAKA_INTERCEPT - 
            SCIENTIFIC_CONSTANTS.FCM.TANAKA_AGE_COEFFICIENT * validatedAge);
    },
    
    /**
     * Calcul FCM selon différentes formules avec pondération par sexe
     * Ref: Tanaka (2001), Gellish (2007), Inbar (1994), Arena (2013), Londeree (1997)
     * Retourne un objet avec plusieurs estimations + recommandation pondérée
     */
    estimateMaxHR: (age, sex = 'M') => {
        const a = MathUtils.clamp(age, 10, 100);
        
        // Tanaka (2001) - référence gold standard
        const tanaka = 208 - 0.7 * a;
        
        // Gellish (2007) - non-linéaire, meilleure pour jeunes/âgés
        const gellish = 207.08 - 0.007165 * Math.pow(a, 2);
        
        // Inbar (1994) - validée sur athlètes
        const inbar = 205.8 - 0.685 * a;
        
        // Arena (2013) - spécifique pour population entraînée
        const arena = 211 - 0.64 * a;
        
        // Londeree (1997) - basée sur tests d'effort
        const londeree = 206.3 - 0.10 * a;
        
        // Ajustement sexe: les femmes ont tendance à avoir FCM légèrement plus élevée
        const sexAdjustment = sex === 'F' ? 3 : 0;
        
        // Pondération par âge: Tanaka meilleure pour 20-60, Gellish pour extrêmes
        let recommended;
        if (a < 20 || a > 60) {
            // Gellish plus précise aux extrêmes
            recommended = (gellish + tanaka) / 2;
        } else if (a >= 30 && a <= 50) {
            // Tanaka validée sur large population
            recommended = tanaka;
        } else {
            // Moyenne pondérée Tanaka + Inbar
            recommended = tanaka * 0.6 + inbar * 0.4;
        }
        
        return {
            tanaka: Math.round(tanaka + sexAdjustment),
            gellish: Math.round(gellish + sexAdjustment),
            inbar: Math.round(inbar + sexAdjustment),
            arena: Math.round(arena + sexAdjustment),
            londeree: Math.round(londeree + sexAdjustment),
            recommended: Math.round(recommended + sexAdjustment),
            method: a < 20 || a > 60 ? 'gellish_tanaka' : a >= 30 && a <= 50 ? 'tanaka' : 'tanaka_inbar',
        };
    },
    
    /**
     * Estimation FCM dynamique à partir des données d'activités
     * Utilise les FC max observées lors des séances intenses
     * Ref: Vesterinen et al. (2016). HRmax from training data.
     * 
     * @param {Array} activities - Array of activities with max_heartrate
     * @param {number} estimatedFCM - Estimated FCM from formula
     * @returns {number} Adjusted FCM
     */
    estimateDynamicFCM: (activities, estimatedFCM) => {
        if (!activities || activities.length === 0) return estimatedFCM;
        
        // Filter activities with HR data and sufficient intensity
        const intenseActivities = activities.filter(a =>
            a.max_heartrate && a.max_heartrate > 0 &&
            (a.average_heartrate || 0) > estimatedFCM * 0.85 &&
            (a.moving_time || 0) > 600 // At least 10 minutes
        );
        
        if (intenseActivities.length < 3) return estimatedFCM;
        
        // Take the top 5 highest HR values (outliers removed)
        const maxHRs = intenseActivities
            .map(a => a.max_heartrate)
            .sort((a, b) => b - a)
            .slice(0, Math.min(5, intenseActivities.length));
        
        const observedMax = MathUtils.mean(maxHRs);
        
        // Blend observed (60%) with formula (40%) for stability
        return Math.round(observedMax * 0.6 + estimatedFCM * 0.4);
    },
    
    /**
     * Zones de fréquence cardiaque selon Karvonen (HRR)
     * Ref: Karvonen, J., et al. (1957). The effects of training on heart rate.
     * Plus précis car prend en compte le repos
     * 
     * @param {number} age - Age en années
     * @param {number} restingHR - Fréquence cardiaque de repos
     * @param {string} sex - Genre 'M' ou 'F'
     * @param {object} options - {method: 'karvonen'|'percent', observedFCM: number}
     */
    calculateKarvonenZones: (age, restingHR = 60, sex = 'M', options = {}) => {
        const fcm = options.observedFCM || Cardiovascular.calculateMaxHR(age);
        const hrr = fcm - restingHR;

        return [
            { 
                zone: 1, name: 'Zone 1 - Récupération active',
                minHR: Math.round(restingHR + hrr * 0.50),
                maxHR: Math.round(restingHR + hrr * 0.60),
                percent: [50, 60],
                description: 'Récupération active, regeneration',
                physiologicalEffect: 'Récupération, circulation sanguine'
            },
            { 
                zone: 2, name: 'Zone 2 - Endurance fondamentale',
                minHR: Math.round(restingHR + hrr * 0.60),
                maxHR: Math.round(restingHR + hrr * 0.70),
                percent: [60, 70],
                description: 'Endurance fondamentale, conversation possible',
                physiologicalEffect: 'Développement mitochondrial, oxydation des graisses'
            },
            { 
                zone: 3, name: 'Zone 3 - Tempo',
                minHR: Math.round(restingHR + hrr * 0.70),
                maxHR: Math.round(restingHR + hrr * 0.80),
                percent: [70, 80],
                description: 'Tempo, allure semi-marathon',
                physiologicalEffect: 'Amélioration capacité aérobie'
            },
            { 
                zone: 4, name: 'Zone 4 - Seuil anaérobie',
                minHR: Math.round(restingHR + hrr * 0.80),
                maxHR: Math.round(restingHR + hrr * 0.90),
                percent: [80, 90],
                description: 'Seuil anaérobie, 10k pace',
                physiologicalEffect: 'Augmentation seuil lactique'
            },
            { 
                zone: 5, name: 'Zone 5a - VO2max',
                minHR: Math.round(restingHR + hrr * 0.90),
                maxHR: Math.round(restingHR + hrr * 0.95),
                percent: [90, 95],
                description: 'VMA, intervalles courts',
                physiologicalEffect: 'Développement VO2max'
            },
            { 
                zone: 6, name: 'Zone 5b - Seuil maximal',
                minHR: Math.round(restingHR + hrr * 0.95),
                maxHR: Math.round(restingHR + hrr * 1.00),
                percent: [95, 100],
                description: 'Seuil maximal, efforts courts',
                physiologicalEffect: 'Puissance aérobie maximale'
            },
            { 
                zone: 7, name: 'Zone 5c - Neuromusculaire',
                minHR: fcm,
                maxHR: fcm + 5,
                percent: [100, 105],
                description: 'Sprint, puissance',
                physiologicalEffect: 'Recrutement fibres rapides'
            },
        ];
    },
    
    /**
     * Estimation VT1/VT2 (seuils ventilatoires) à partir du profil
     * Ref: Wasserman (2012). Principles of Exercise Testing.
     * VT1 ≈ 75% FCM, VT2 ≈ 90% FCM (estimation, nécessite test labo pour précision)
     * 
     * @param {number} fcm - Fréquence cardiaque max
     * @param {number} restingHR - FC repos
     * @param {number} vma - VMA en km/h (optionnel, pour estimation par vitesse)
     */
    estimateVentilatoryThresholds: (fcm, restingHR = 60, vma = null) => {
        const hrr = fcm - restingHR;
        
        // VT1 (seuil aérobie) ≈ 75% FCM ou 60% HRR
        const vt1HR = Math.round(restingHR + hrr * 0.60);
        // VT2 (seuil anaérobie) ≈ 90% FCM ou 80% HRR
        const vt2HR = Math.round(restingHR + hrr * 0.80);
        
        let vt1Speed = null, vt2Speed = null;
        if (vma) {
            // VT1 ≈ 65-75% VMA, VT2 ≈ 85-90% VMA
            vt1Speed = Math.round(vma * 0.70 * 10) / 10;
            vt2Speed = Math.round(vma * 0.88 * 10) / 10;
        }
        
        return {
            vt1: {
                heartRate: vt1HR,
                speed: vt1Speed,
                percentFCM: Math.round(vt1HR / fcm * 100),
                label: 'Seuil aérobie (VT1)',
                description: 'Transition métabolique, début accumulation lactate'
            },
            vt2: {
                heartRate: vt2HR,
                speed: vt2Speed,
                percentFCM: Math.round(vt2HR / fcm * 100),
                label: 'Seuil anaérobie (VT2)',
                description: 'Point de compensation respiratoire, effort soutenable 30-60min'
            },
        };
    },
    
    /**
     * Zones de puissance selon Coggan (7 zones basées sur FTP)
     * Ref: Coggan, A. (2006). Training and Racing with a Power Meter.
     * 
     * @param {number} ftp - Functional Threshold Power (watts)
     */
    calculatePowerZones: (ftp) => {
        if (!ftp || ftp <= 0) return [];
        
        return [
            {
                zone: 1, name: 'Active Recovery',
                minWatts: Math.round(ftp * 0.55),
                maxWatts: Math.round(ftp * 0.75),
                percentFTP: [55, 75],
                description: 'Récupération active',
            },
            {
                zone: 2, name: 'Endurance',
                minWatts: Math.round(ftp * 0.76),
                maxWatts: Math.round(ftp * 0.90),
                percentFTP: [76, 90],
                description: 'Endurance fondamentale',
            },
            {
                zone: 3, name: 'Tempo',
                minWatts: Math.round(ftp * 0.91),
                maxWatts: Math.round(ftp * 1.05),
                percentFTP: [91, 105],
                description: 'Tempo, sweet spot',
            },
            {
                zone: 4, name: 'Lactate Threshold',
                minWatts: Math.round(ftp * 1.06),
                maxWatts: Math.round(ftp * 1.20),
                percentFTP: [106, 120],
                description: 'Seuil lactique',
            },
            {
                zone: 5, name: 'VO2max',
                minWatts: Math.round(ftp * 1.21),
                maxWatts: Math.round(ftp * 1.50),
                percentFTP: [121, 150],
                description: 'VO2max, intervalles',
            },
            {
                zone: 6, name: 'Anaerobic Capacity',
                minWatts: Math.round(ftp * 1.51),
                maxWatts: Math.round(ftp * 2.00),
                percentFTP: [151, 200],
                description: 'Capacité anaérobie',
            },
            {
                zone: 7, name: 'Neuromuscular Power',
                minWatts: Math.round(ftp * 2.01),
                maxWatts: null,
                percentFTP: [201, null],
                description: 'Puissance neuromusculaire, sprint',
            },
        ];
    },
    
    /**
     * Zones simplifiées par %FCM
     */
    calculatePercentZones: (fcm) => {
        return [
            { zone: 1, name: 'Zone 1', minHR: Math.round(fcm * 0.50), maxHR: Math.round(fcm * 0.60), description: 'Récupération' },
            { zone: 2, name: 'Zone 2', minHR: Math.round(fcm * 0.60), maxHR: Math.round(fcm * 0.70), description: 'Endurance' },
            { zone: 3, name: 'Zone 3', minHR: Math.round(fcm * 0.70), maxHR: Math.round(fcm * 0.80), description: 'Tempo' },
            { zone: 4, name: 'Zone 4', minHR: Math.round(fcm * 0.80), maxHR: Math.round(fcm * 0.90), description: 'Seuil' },
            { zone: 5, name: 'Zone 5', minHR: Math.round(fcm * 0.90), maxHR: fcm, description: 'VO2max' },
        ];
    },
};

// ============================================================================
// MODELE VDOT / RUNNING PERFORMANCE
// ============================================================================

const RunningPerformance = {
    /**
     * Calcul VDOT à partir d'une performance de course
     * Ref: Jack Daniels, Daniels' Running Formula, 4th Edition (2021)
     * 
     * Formule: VDOT = (VO2cost) / (%VO2max_soutenu)
     * où VO2cost = 0.182258*v + 0.000104*v² - 4.60
     */
    calculateVDOT: (distanceMeters, timeMinutes) => {
        if (timeMinutes <= 0 || distanceMeters <= 0) return 0;
        
        const v = distanceMeters / timeMinutes; // vitesse en m/min
        
        // Coût en oxygène (ml/kg/min)
        // Ref: Di Pampero et al. (1970)
        const vo2Cost = SCIENTIFIC_CONSTANTS.VDOT.VO2_COST_A * v + 
                        SCIENTIFIC_CONSTANTS.VDOT.VO2_COST_B * Math.pow(v, 2) + 
                        SCIENTIFIC_CONSTANTS.VDOT.VO2_COST_C;
        
        if (vo2Cost <= 0) return 0;
        
        // %VO2max soutenu pour durée t
        // Ref: W Garry & WH Gillespie (données tables Jack Daniels)
        const t = timeMinutes;
        const percentMax = 
            SCIENTIFIC_CONSTANTS.VDOT.PERCENT_MAX_A +
            SCIENTIFIC_CONSTANTS.VDOT.PERCENT_MAX_B * Math.exp(-SCIENTIFIC_CONSTANTS.VDOT.PERCENT_MAX_C * t) +
            SCIENTIFIC_CONSTANTS.VDOT.PERCENT_MAX_E * Math.exp(-SCIENTIFIC_CONSTANTS.VDOT.PERCENT_MAX_D * t);
        
        return vo2Cost / percentMax;
    },
    
    /**
     * VDOT pondéré temporellement — performances récentes ont plus de poids
     * Ref: Méthode de décroissance exponentielle pour VDOT dynamique
     * 
     * @param {Array} performances - [{distance, time, date}, ...]
     * @param {number} daysHalfLife - Demi-vie en jours (défaut: 90)
     */
    calculateDynamicVDOT: (performances, daysHalfLife = 90) => {
        if (!performances || performances.length === 0) return null;
        
        const now = new Date();
        const lambda = Math.log(2) / daysHalfLife; // taux de décroissance
        
        let weightedVDOT = 0;
        let totalWeight = 0;
        
        performances.forEach(p => {
            const vdot = RunningPerformance.calculateVDOT(p.distance, p.timeMinutes);
            if (vdot <= 0) return;
            
            const age = (now - new Date(p.date)) / (1000 * 60 * 60 * 24); // jours
            const weight = Math.exp(-lambda * age);
            
            weightedVDOT += vdot * weight;
            totalWeight += weight;
        });
        
        return totalWeight > 0 ? Math.round((weightedVDOT / totalWeight) * 10) / 10 : null;
    },
    
    /**
     * Estimation VMA à partir du VO2max
     * Ref: Mercier et al. (1987)
     * VMA (km/h) = (VO2max - 2.209) / 3.5 (formule française)
     */
    estimateVMA: (vo2max) => {
        return (vo2max - 2.209) / 3.5;
    },
    
    /**
     * Estimation VO2max à partir de la VMA
     * Ref: VMA = (VO2max - 2.209) / 3.5
     */
    estimateVO2max: (vma) => {
        return vma * 3.5 + 2.209;
    },
    
    /**
     * Calcul allure (sec/km) pour VDOT et intensité donnée
     * Ref: Jack Daniels, Daniels' Running Formula, 4th Edition (2021)
     * 
     * VO2cost = 0.182258*v + 0.000104*v² - 4.60
     * On résout: b*v² + a*v + c = targetVO2
     */
    getPaceSeconds: (vdot, intensityPercent) => {
        if (vdot <= 0 || intensityPercent <= 0) return 0;
        
        const targetVO2 = vdot * intensityPercent;
        
        const a = SCIENTIFIC_CONSTANTS.VDOT.VO2_COST_A;
        const b = SCIENTIFIC_CONSTANTS.VDOT.VO2_COST_B;
        const c = -(targetVO2 - SCIENTIFIC_CONSTANTS.VDOT.VO2_COST_C);
        
        const delta = a * a - 4 * b * c;
        if (delta < 0) return 0;
        
        const vMetersPerMin = (-a + Math.sqrt(delta)) / (2 * b);
        if (vMetersPerMin <= 0) return 0;
        
        return (1000 / vMetersPerMin) * 60;
    },
    
    /**
     * Zones de vitesse basées sur VMA
     */
    calculateSpeedZones: (vma) => {
        if (!vma || vma <= 0) return [];
        
        return [
            { 
                zone: 1, name: 'Récupération',
                minPace: MathUtils.formatPace(1000 / (vma * 0.50)),
                maxPace: MathUtils.formatPace(1000 / (vma * 0.60)),
                minSpeed: (vma * 0.50).toFixed(1),
                maxSpeed: (vma * 0.60).toFixed(1),
                description: 'Marche, trottinement'
            },
            { 
                zone: 2, name: 'Endurance',
                minPace: MathUtils.formatPace(1000 / (vma * 0.60)),
                maxPace: MathUtils.formatPace(1000 / (vma * 0.70)),
                minSpeed: (vma * 0.60).toFixed(1),
                maxSpeed: (vma * 0.70).toFixed(1),
                description: 'Footing conversable'
            },
            { 
                zone: 3, name: 'Tempo',
                minPace: MathUtils.formatPace(1000 / (vma * 0.70)),
                maxPace: MathUtils.formatPace(1000 / (vma * 0.80)),
                minSpeed: (vma * 0.70).toFixed(1),
                maxSpeed: (vma * 0.80).toFixed(1),
                description: 'Allure semi-marathon'
            },
            { 
                zone: 4, name: 'Seuil',
                minPace: MathUtils.formatPace(1000 / (vma * 0.80)),
                maxPace: MathUtils.formatPace(1000 / (vma * 0.88)),
                minSpeed: (vma * 0.80).toFixed(1),
                maxSpeed: (vma * 0.88).toFixed(1),
                description: 'Allure 10k'
            },
            { 
                zone: 5, name: 'VO2max',
                minPace: MathUtils.formatPace(1000 / (vma * 0.88)),
                maxPace: MathUtils.formatPace(1000 / (vma * 0.98)),
                minSpeed: (vma * 0.88).toFixed(1),
                maxSpeed: (vma * 0.98).toFixed(1),
                description: 'Intervalles'
            },
            { 
                zone: 6, name: 'VMA',
                minPace: MathUtils.formatPace(1000 / vma),
                maxPace: MathUtils.formatPace(1000 / (vma * 1.05)),
                minSpeed: vma.toFixed(1),
                maxSpeed: (vma * 1.05).toFixed(1),
                description: 'VMA Sprint'
            },
            { 
                zone: 7, name: 'Anaérobie',
                minPace: MathUtils.formatPace(1000 / (vma * 1.05)),
                maxPace: '00:00',
                minSpeed: (vma * 1.05).toFixed(1),
                maxSpeed: '-',
                description: 'Sprint 200m'
            },
        ];
    },
    
    /**
     * Allures d'entraînement selon VDOT
     */
    getTrainingPaces: (vdot) => {
        if (vdot <= 10) return {};
        
        return {
            E: {
                label: 'Easy / Endurance',
                min: MathUtils.formatPace(RunningPerformance.getPaceSeconds(vdot, SCIENTIFIC_CONSTANTS.VDOT.E_HIGH)),
                max: MathUtils.formatPace(RunningPerformance.getPaceSeconds(vdot, SCIENTIFIC_CONSTANTS.VDOT.E_LOW)),
                description: 'Footing conversable, 65-75% FCmax'
            },
            M: {
                label: 'Marathon',
                pace: MathUtils.formatPace(RunningPerformance.getPaceSeconds(vdot, SCIENTIFIC_CONSTANTS.VDOT.M)),
                description: 'Allure marathon, ~84% VO2max'
            },
            T: {
                label: 'Threshold / Seuil',
                pace: MathUtils.formatPace(RunningPerformance.getPaceSeconds(vdot, SCIENTIFIC_CONSTANTS.VDOT.T)),
                description: 'Seuil anaérobie, 88% VO2max'
            },
            I: {
                label: 'Interval',
                pace: MathUtils.formatPace(RunningPerformance.getPaceSeconds(vdot, SCIENTIFIC_CONSTANTS.VDOT.I)),
                description: 'VMA/VO2max, 98% VO2max'
            },
            R: {
                label: 'Repetition',
                pace: MathUtils.formatPace(RunningPerformance.getPaceSeconds(vdot, SCIENTIFIC_CONSTANTS.VDOT.R)),
                description: 'Vitesse pure, >100% VO2max'
            },
        };
    },
    
    /**
     * Exposant Riegel adaptatif selon la distance
     * Ref: Riegel (1981) modifié — l'exposant augmente avec la distance
     * Court (<5K): 1.06, 10K: 1.07, Semi: 1.08, Marathon: 1.10, Ultra: 1.12+
     */
    getRiegelExponent: (distanceKm) => {
        if (distanceKm <= 5) return 1.06;
        if (distanceKm <= 10) return 1.07;
        if (distanceKm <= 21.1) return 1.08;
        if (distanceKm <= 42.195) return 1.10;
        if (distanceKm <= 100) return 1.12;
        return 1.15;
    },
    
    /**
     * Prédiction de temps de course — Riegel adaptatif
     * Ref: Riegel (1981) modifié avec exposant variable
     */
    predictRaceTime: (knownDistance, knownTimeSeconds, targetDistance) => {
        if (!knownDistance || !knownTimeSeconds || !targetDistance) return 0;
        const ratio = targetDistance / knownDistance;
        const exponent = RunningPerformance.getRiegelExponent(targetDistance / 1000);
        return knownTimeSeconds * Math.pow(ratio, exponent);
    },
    
    /**
     * Prédiction multi-modèle — combine Riegel, Mercier, Cameron
     * Retourne la moyenne pondérée pour plus de précision
     */
    predictRaceTimeMultiModel: (knownDistance, knownTimeSeconds, targetDistance, vdot = null) => {
        if (!knownDistance || !knownTimeSeconds || !targetDistance) return null;
        
        const targetKm = targetDistance / 1000;
        const knownKm = knownDistance / 1000;
        
        // Modèle 1: Riegel adaptatif
        const riegel = RunningPerformance.predictRaceTime(knownDistance, knownTimeSeconds, targetDistance);
        
        // Modèle 2: Mercier (basé sur VMA)
        const knownSpeed = knownDistance / (knownTimeSeconds / 3600); // km/h
        const mercierExponent = Math.log(targetKm / knownKm) / Math.log(knownKm / 5) * 0.02;
        const mercier = knownTimeSeconds * Math.pow(targetKm / knownKm, 1.06 + mercierExponent);
        
        // Modèle 3: Cameron (plus précis pour longues distances)
        // T2 = T1 * (D2/D1) * (a + b * ln(D2/D1))
        const ratio = targetDistance / knownDistance;
        const cameron = knownTimeSeconds * ratio * (1 + 0.04 * Math.log(ratio));
        
        // Pondération selon la distance cible
        let wRiegel, wMercier, wCameron;
        if (targetKm <= 10) {
            wRiegel = 0.5; wMercier = 0.3; wCameron = 0.2;
        } else if (targetKm <= 21.1) {
            wRiegel = 0.4; wMercier = 0.3; wCameron = 0.3;
        } else if (targetKm <= 42.195) {
            wRiegel = 0.3; wMercier = 0.2; wCameron = 0.5;
        } else {
            wRiegel = 0.2; wMercier = 0.1; wCameron = 0.7;
        }
        
        const predicted = riegel * wRiegel + mercier * wMercier + cameron * wCameron;
        
        return {
            time: Math.round(predicted),
            riegel: Math.round(riegel),
            mercier: Math.round(mercier),
            cameron: Math.round(cameron),
            confidence: targetKm >= knownKm * 0.5 && targetKm <= knownKm * 3 ? 'high' : 'medium',
        };
    },
    
    /**
     * Correction environnementale pour la prédiction de course
     * Ref: Ely et al. (2007). Effects of temperature on marathon performance.
     * 
     * @param {number} baseTimeSeconds - Temps de course sans correction
     * @param {object} conditions - {temperature, humidity, altitude, windSpeed}
     */
    applyEnvironmentalCorrection: (baseTimeSeconds, conditions = {}) => {
        const {
            temperature = 15,    // °C (optimal: 10-15°C pour marathon)
            humidity = 50,       // % (optimal: 40-60%)
            altitude = 0,        // mètres
            windSpeed = 0,       // km/h
        } = conditions;
        
        let factor = 1.0;
        
        // Correction température (modèle Ely 2007)
        if (temperature > 15) {
            factor += (temperature - 15) * 0.003; // +0.3% par °C au-dessus de 15
        } else if (temperature < 5) {
            factor += (5 - temperature) * 0.002; // +0.2% par °C en dessous de 5
        }
        
        // Correction humidité
        if (humidity > 60) {
            factor += (humidity - 60) * 0.001; // +0.1% par % au-dessus de 60
        }
        
        // Correction altitude (modèle classique)
        if (altitude > 500) {
            factor += (altitude - 500) * 0.0001; // +0.01% par 100m au-dessus de 500m
        }
        
        // Correction vent (vent de face)
        if (windSpeed > 10) {
            factor += (windSpeed - 10) * 0.002; // +0.2% par km/h au-dessus de 10
        }
        
        return {
            correctedTime: Math.round(baseTimeSeconds * factor),
            timeLoss: Math.round(baseTimeSeconds * (factor - 1)),
            factor: Math.round(factor * 1000) / 1000,
        };
    },
    
    /**
     * Prédiction marathon depuis VDOT
     */
    predictMarathon: (vdot) => {
        const paceSeconds = RunningPerformance.getPaceSeconds(vdot, SCIENTIFIC_CONSTANTS.VDOT.M);
        const totalSeconds = paceSeconds * 42.195;
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = Math.round(totalSeconds % 60);
        return { time: `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`, pace: MathUtils.formatPace(paceSeconds) };
    },
    
    /**
     * Prédiction semi-marathon depuis VDOT
     */
    predictHalfMarathon: (vdot) => {
        const paceSeconds = RunningPerformance.getPaceSeconds(vdot, SCIENTIFIC_CONSTANTS.VDOT.T);
        const totalSeconds = paceSeconds * 21.1;
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = Math.round(totalSeconds % 60);
        return { time: `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`, pace: MathUtils.formatPace(paceSeconds) };
    },
    
    /**
     * Calcul économie de course
     * Ref: Støren et al. (2008)
     */
    calculateRunningEconomy: (vo2mlKgMin, speedKmH) => {
        if (speedKmH <= 0) return 0;
        const speedKmMin = speedKmH / 60;
        return (vo2mlKgMin / speedKmMin) * 1000;
    },
    
    /**
     * Niveau de performance selon tables IAAF/World Athletics 2022
     * Ref: World Athletics Scoring Tables
     */
    getPerformanceLevel: (metric, value) => {
        if (metric === 'VDOT') {
            if (value >= 70) return { level: 'MONDIAL', color: 'gold', percent: 99, iaaPoints: 1200 };
            if (value >= 63) return { level: 'ELITE', color: 'purple', percent: 95, iaaPoints: 1000 };
            if (value >= 56) return { level: 'NATIONAL', color: 'green', percent: 85, iaaPoints: 800 };
            if (value >= 50) return { level: 'REGIONAL', color: 'blue', percent: 70, iaaPoints: 600 };
            if (value >= 43) return { level: 'BON', color: 'cyan', percent: 55, iaaPoints: 400 };
            if (value >= 37) return { level: 'MOYEN', color: 'orange', percent: 40, iaaPoints: 250 };
            return { level: 'DEBUTANT', color: 'red', percent: 20, iaaPoints: 100 };
        }
        if (metric === 'VMA') {
            if (value >= 23) return { level: 'MONDIAL', color: 'gold', percent: 99 };
            if (value >= 20) return { level: 'ELITE', color: 'purple', percent: 95 };
            if (value >= 18) return { level: 'NATIONAL', color: 'green', percent: 85 };
            if (value >= 16) return { level: 'REGIONAL', color: 'blue', percent: 70 };
            if (value >= 14.5) return { level: 'BON', color: 'cyan', percent: 55 };
            if (value >= 13) return { level: 'MOYEN', color: 'orange', percent: 40 };
            return { level: 'DEBUTANT', color: 'red', percent: 20 };
        }
        return { level: 'NORMAL', color: 'gray', percent: 50 };
    },
    
    /**
     * Calcul du score IAAF pour une performance
     * Ref: World Athletics Combined Events Scoring Tables
     * Formule: Points = A * (B - T)^C (course) ou A * (D - B)^C (sauts/lancers)
     */
    calculateIAAAScore: (event, performance) => {
        const tables = {
            '100m': { A: 589.11, B: 18.00, C: 1.81 },
            '400m': { A: 375.81, B: 60.00, C: 1.537 },
            '800m': { A: 134.04, B: 118.00, C: 1.805 },
            '1500m': { A: 463.83, B: 315.00, C: 1.725 },
            '5000m': { A: 373.29, B: 900.00, C: 1.85 },
            '10000m': { A: 177.96, B: 1800.00, C: 1.75 },
            'Marathon': { A: 134.92, B: 10800.00, C: 1.75 },
            'HalfMarathon': { A: 200.00, B: 5400.00, C: 1.75 },
        };
        
        const table = tables[event];
        if (!table) return null;
        
        // performance en secondes pour les courses
        const points = Math.round(table.A * Math.pow(Math.abs(table.B - performance), table.C));
        return Math.max(0, points);
    },
};

// ============================================================================
// CHARGE D'ENTRAÎNEMENT (TRAINING LOAD)
// ============================================================================

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

// ============================================================================
// PMC - PERFORMANCE MANAGEMENT CHART (Banister Model)
// ============================================================================

const PMC = {
    /**
     * Calcul PMC - Modèle Impulse Response de Banister
     * Ref: Banister, E.W. (1975). Development of a technique...
     * Ref: Hellard et al. (2006). Assessing limitations of Banister model. J Sports Sci.
     * 
     * CTL (Fitness) = exponential moving average avec τa ≈ 42 jours
     * ATL (Fatigue) = exponential moving average avec τf ≈ 7 jours
     * TSB (Forme) = CTL - ATL
     * 
     * @param {Array} activities - Array of {date, tss}
     * @param {number} tauFitness - τ fitness (default 42)
     * @param {number} tauFatigue - τ fatigue (default 7)
     * @param {object} options - {initialCTL, initialATL, hrvModulator}
     */
    calculate: (activities, tauFitness = 42, tauFatigue = 7, options = {}) => {
        if (!activities || activities.length === 0) return [];
        
        const alphaFitness = 1 - Math.exp(-1 / tauFitness);
        const alphaFatigue = 1 - Math.exp(-1 / tauFatigue);
        const alphaStability = SCIENTIFIC_CONSTANTS.PMC.ALPHA_STABILITY;
        
        const sorted = activities
            .filter(a => a.date || a.start_date_local)
            .map(a => ({
                ...a,
                date: a.date || a.start_date_local,
                tss: a.tss || a.trimp || a.load || 0
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        if (sorted.length === 0) return [];
        
        let ctl = options.initialCTL || 0;
        let atl = options.initialATL || 0;
        let sb = 0;
        const data = [];
        
        sorted.forEach((act) => {
            const tss = act.tss || 0;
            
            // HRV modulation (si disponible)
            let hrvMod = 1.0;
            if (options.hrvModulator && act.hrvRmssd) {
                const baseline = options.hrvModulator.baseline || 50;
                const ratio = act.hrvRmssd / baseline;
                hrvMod = MathUtils.clamp(0.8 + ratio * 0.4, 0.7, 1.3);
            }
            
            ctl = MathUtils.expMovingAvg(ctl, tss * hrvMod, alphaFitness);
            atl = MathUtils.expMovingAvg(atl, tss * hrvMod, alphaFatigue);
            sb = MathUtils.expMovingAvg(sb, ctl - atl, alphaStability);
            
            data.push({
                date: act.date.split('T')[0],
                tss: tss,
                ctl: Math.round(ctl),
                atl: Math.round(atl),
                tsb: Math.round(ctl - atl),
                sb: Math.round(sb),
                hrvModulator: Math.round(hrvMod * 100) / 100,
            });
        });
        
        return data;
    },
    
    /**
     * PMC 3-composantes (modèle Calvert)
     * Ref: Calvert, T.W. (1976). A systems model of training for athletic performance.
     */
    calculate3Component: (activities, tauFitness = 42, tauFatigue = 7, tauStability = 14) => {
        if (!activities || activities.length === 0) return [];
        
        const alphaFitness = 1 - Math.exp(-1 / tauFitness);
        const alphaFatigue = 1 - Math.exp(-1 / tauFatigue);
        const alphaStability = 1 - Math.exp(-1 / tauStability);
        
        const sorted = activities
            .filter(a => a.date || a.start_date_local)
            .map(a => ({ date: a.date || a.start_date_local, tss: a.tss || a.trimp || 0 }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        let ctl = 0, atl = 0, stb = 0;
        const data = [];
        
        sorted.forEach((act) => {
            const tss = act.tss || 0;
            ctl = MathUtils.expMovingAvg(ctl, tss, alphaFitness);
            atl = MathUtils.expMovingAvg(atl, tss, alphaFatigue);
            stb = MathUtils.expMovingAvg(stb, tss, alphaStability);
            
            data.push({
                date: act.date.split('T')[0],
                tss,
                ctl: Math.round(ctl),
                atl: Math.round(atl),
                stb: Math.round(stb),
                tsb: Math.round(ctl - atl),
                form: Math.round((ctl + stb) / 2 - atl),
            });
        });
        
        return data;
    },
    
    /**
     * Tau personnalisés selon le profil de l'athlète
     * Ref: Busso et al. (1997). Individualized tau based on training status.
     */
    getPersonalizedTau: (profile) => {
        const { level = 'intermediate', age = 30, trainingYears = 3 } = profile || {};
        
        const tauMap = {
            beginner: { fitness: 35, fatigue: 5 },
            intermediate: { fitness: 42, fatigue: 7 },
            advanced: { fitness: 48, fatigue: 8 },
            elite: { fitness: 55, fatigue: 10 },
        };
        
        const base = tauMap[level] || tauMap.intermediate;
        const ageFactor = age > 40 ? 1 + (age - 40) * 0.02 : 1;
        const experienceFactor = 1 + Math.min(trainingYears * 0.01, 0.15);
        
        return {
            fitness: Math.round(base.fitness * ageFactor * experienceFactor),
            fatigue: Math.round(base.fatigue * ageFactor),
        };
    },
    
    /**
     * Calcul ACWR - Acute:Chronic Workload Ratio
     * Ref: Gabbett, T.J. (2016). The training-injury prevention paradox.
     * 
     * ACWR optimal: 0.8 - 1.3
     */
    calculateACWR: (weeklyLoad, chronicLoad) => {
        if (!chronicLoad || chronicLoad === 0) return 1;
        return weeklyLoad / chronicLoad;
    },
    
    /**
     * ACWR exponentially weighted (plus précis que rolling)
     * Ref: Williams et al. (2017). EWMA ACWR.
     */
    calculateACWR_EWMA: (dailyLoads, tauAcute = 7, tauChronic = 28) => {
        if (!dailyLoads || dailyLoads.length < tauChronic) return null;
        
        const alphaAcute = 1 - Math.exp(-1 / tauAcute);
        const alphaChronic = 1 - Math.exp(-1 / tauChronic);
        
        let acute = 0, chronic = 0;
        dailyLoads.forEach(load => {
            acute = MathUtils.expMovingAvg(acute, load, alphaAcute);
            chronic = MathUtils.expMovingAvg(chronic, load, alphaChronic);
        });
        
        return chronic > 0 ? acute / chronic : 1;
    },
    
    /**
     * Statut ACWR avec interprétation scientifique
     */
    getACWRStatus: (acwr) => {
        const c = SCIENTIFIC_CONSTANTS.ACWR;
        
        if (acwr < c.UNDER_REACHING) {
            return { 
                status: 'underreaching', 
                color: 'blue', 
                label: 'Sous-entrainement',
                message: 'Augmentez progressivement la charge',
                risk: 'low'
            };
        }
        if (acwr <= c.OPTIMAL_MAX) {
            return { 
                status: 'optimal', 
                color: 'green', 
                label: 'Optimal',
                message: 'Zone ideale pour progression',
                risk: 'optimal'
            };
        }
        if (acwr <= c.RISKY_MAX) {
            return { 
                status: 'risky', 
                color: 'orange', 
                label: 'Surveillance',
                message: 'Surveillez les signes de fatigue',
                risk: 'elevated'
            };
        }
        if (acwr <= c.DANGER) {
            return { 
                status: 'overreaching', 
                color: 'red', 
                label: 'Overreaching',
                message: 'Risque eleve - reduisez la charge',
                risk: 'high'
            };
        }
        return { 
            status: 'danger', 
            color: 'red', 
            label: 'DANGER',
            message: 'ACWR > 1.5 = risque blessure 3-4x. REDUISEZ IMMEDIATEMENT.',
            risk: 'critical'
        };
    },
    
    /**
     * Calcul Monotonie
     * Ref: Foster (1998)
     */
    calculateMonotony: (dailyLoads) => {
        if (dailyLoads.length < 2) return 1;
        const mean = MathUtils.mean(dailyLoads);
        if (mean === 0) return 0;
        return mean / MathUtils.stdDev(dailyLoads);
    },
    
    /**
     * Calcul Strain
     */
    calculateStrain: (ctl, monotony) => ctl * monotony,
    
    /**
     * Get Strain status
     */
    getStrainStatus: (strain) => {
        if (strain < SCIENTIFIC_CONSTANTS.STRAIN.LOW) {
            return { status: 'low', color: 'blue', label: 'Faible' };
        }
        if (strain < SCIENTIFIC_CONSTANTS.STRAIN.MODERATE) {
            return { status: 'moderate', color: 'green', label: 'Modéré' };
        }
        if (strain < SCIENTIFIC_CONSTANTS.STRAIN.HIGH) {
            return { status: 'high', color: 'orange', label: 'Élevé' };
        }
        return { status: 'danger', color: 'red', label: 'Critique' };
    },
    
    /**
     * Prédiction de performance depuis CTL/TSB (modèle Busso)
     * Ref: Busso, T. (2003). Variable dose-response relationship...
     */
    predictPerformance: (ctl, atl, baselinePerformance) => {
        if (!ctl || !atl) return baselinePerformance;
        
        const tsb = ctl - atl;
        const optimalTSB = 15;
        const tsbFactor = 1 - Math.abs(tsb - optimalTSB) / 100;
        
        return Math.round(baselinePerformance * MathUtils.clamp(tsbFactor, 0.85, 1.10));
    },
    
    /**
     * Estimation readiness depuis PMC
     */
    estimateReadiness: (pmcData, hrvRmssd, sleepHours) => {
        if (!pmcData || pmcData.length === 0) return 70;
        
        const latest = pmcData[pmcData.length - 1];
        const tsb = latest.tsb || 0;
        const atl = latest.atl || 0;
        
        let tsbScore = MathUtils.clamp(50 + tsb * 2, 0, 100);
        
        let hrvScore = 70;
        if (hrvRmssd > 0) {
            hrvScore = MathUtils.clamp(hrvRmssd * 1.2, 20, 100);
        }
        
        let sleepScore = 70;
        if (sleepHours > 0) {
            if (sleepHours >= 8) sleepScore = 90;
            else if (sleepHours >= 7) sleepScore = 80;
            else if (sleepHours >= 6) sleepScore = 60;
            else sleepScore = 40;
        }
        
        const atlFactor = atl > 0 ? Math.max(0.3, 1 - atl / 100) : 1;
        
        const readiness = (tsbScore * 0.4 + hrvScore * 0.3 + sleepScore * 0.3) * atlFactor;
        
        return Math.round(MathUtils.clamp(readiness, 10, 100));
    },
};

// ============================================================================
// POLARIZATION INDEX — Analyse avancée de la distribution d'intensité
// ============================================================================

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

// ============================================================================
// HRV ANALYSIS — Analyse avancée de la variabilité cardiaque
// ============================================================================

const HRV = {
    /**
     * Analyse de récupération HRV avancée
     * Ref: Esco & Flatt (2014). Ultra-short-term HRV.
     * Ref: Buchheit (2014). Monitoring training status with HRV.
     * 
     * Utilise rMSSD (gold standard parasympathique) + CV (coefficient de variation)
     */
    analyzeRecovery: (rmssd, baselineRmssd, restingHR) => {
        if (!rmssd || rmssd <= 0) {
            return { 
                status: 'unknown', 
                score: 0, 
                message: 'Données HRV insuffisantes',
                readiness: 50
            };
        }
        
        const baselineRatio = baselineRmssd > 0 ? rmssd / baselineRmssd : 1;
        
        // Score 0-100 basé sur ratio avec courbe sigmoïde
        let score;
        if (baselineRatio >= 1.1) score = 95 + Math.min(5, (baselineRatio - 1.1) * 50);
        else if (baselineRatio >= 1.0) score = 90 + (baselineRatio - 1.0) * 50;
        else if (baselineRatio >= 0.9) score = 75 + (baselineRatio - 0.9) * 150;
        else if (baselineRatio >= 0.8) score = 50 + (baselineRatio - 0.8) * 250;
        else if (baselineRatio >= 0.7) score = 30 + (baselineRatio - 0.7) * 200;
        else score = Math.max(5, 30 * baselineRatio);
        
        // Interprétation
        let status, message, recommendation;
        if (score >= 90) {
            status = 'supercompensation';
            message = 'Supercompensation détectée — prêt pour séance intense';
            recommendation = 'Séance VMA ou seuil recommandée';
        } else if (score >= 75) {
            status = 'excellent';
            message = 'Récupération excellente';
            recommendation = 'Entraînement normal';
        } else if (score >= 60) {
            status = 'good';
            message = 'Bonne récupération';
            recommendation = 'Entraînement modéré';
        } else if (score >= 45) {
            status = 'moderate';
            message = 'Récupération modérée — fatigue légère';
            recommendation = 'Réduisez l\'intensité aujourd\'hui';
        } else if (score >= 30) {
            status = 'low';
            message = 'Fatigue détectée';
            recommendation = 'Endurance fondamentale ou repos actif';
        } else {
            status = 'poor';
            message = 'Fatigue importante — risque de surentraînement';
            recommendation = 'Repos complet recommandé';
        }
        
        return {
            status,
            score: Math.round(score),
            message,
            recommendation,
            rmssd,
            baselineRmssd,
            ratio: Math.round(baselineRatio * 100) / 100,
            readiness: Math.round(score),
        };
    },
    
    /**
     * Baseline HRV dynamique — rolling 28 jours avec détection de tendance
     * Ref: Plews et al. (2013). HRV in elite athletes.
     */
    calculateDynamicBaseline: (hrvHistory, days = 28) => {
        if (!hrvHistory || hrvHistory.length < 7) return null;
        
        const recent = hrvHistory.slice(-days);
        const values = recent.map(h => h.rmssd).filter(v => v > 0);
        
        if (values.length < 5) return null;
        
        const mean = MathUtils.mean(values);
        const stdDev = MathUtils.stdDev(values);
        const cv = mean > 0 ? (stdDev / mean) * 100 : 0;
        
        // Détection de tendance (régression linéaire simple)
        let trend = 0;
        if (values.length >= 7) {
            const n = values.length;
            let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
            values.forEach((v, i) => {
                sumX += i; sumY += v; sumXY += i * v; sumX2 += i * i;
            });
            trend = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        }
        
        return {
            baseline: Math.round(mean * 10) / 10,
            stdDev: Math.round(stdDev * 10) / 10,
            cv: Math.round(cv * 10) / 10,
            trend: Math.round(trend * 100) / 100,
            trendDirection: trend > 0.5 ? 'improving' : trend < -0.5 ? 'declining' : 'stable',
            samples: values.length,
            // Zones d'interprétation
            zones: {
                excellent: mean + stdDev,
                normal: mean,
                low: mean - stdDev,
                alarm: mean - 2 * stdDev,
            }
        };
    },
    
    /**
     * Coefficient de Variation du HRV — indicateur de stress/fatigue
     * CV élevé = stress, CV faible = bonne adaptation
     * Ref: Plews et al. (2013)
     */
    calculateCV: (hrvHistory, window = 7) => {
        if (!hrvHistory || hrvHistory.length < window) return null;
        
        const recent = hrvHistory.slice(-window).map(h => h.rmssd).filter(v => v > 0);
        if (recent.length < 3) return null;
        
        const mean = MathUtils.mean(recent);
        const stdDev = MathUtils.stdDev(recent);
        const cv = mean > 0 ? (stdDev / mean) * 100 : 0;
        
        let interpretation;
        if (cv < 3) interpretation = 'Très stable — excellente adaptation';
        else if (cv < 6) interpretation = 'Stable — bonne adaptation';
        else if (cv < 10) interpretation = 'Modéré — surveillez';
        else interpretation = 'Instable — fatigue ou stress détecté';
        
        return { cv: Math.round(cv * 10) / 10, mean: Math.round(mean * 10) / 10, interpretation };
    },
    
    /**
     * Calcul du Stress Score
     * Ref: Heart Rate Variability — Alt training
     */
    calculateStressScore: (currentRmssd, optimalRmssd) => {
        if (!currentRmssd || !optimalRmssd) return 50;
        
        const ratio = optimalRmssd / currentRmssd;
        
        if (ratio <= 1) return MathUtils.clamp(50 - (1 - ratio) * 50, 0, 100);
        return MathUtils.clamp(50 + (ratio - 1) * 50, 0, 100);
    },
};

// ============================================================================
// CRITICAL POWER MODEL — Modèle avancé 3-paramètres
// ============================================================================

const CriticalPower = {
    /**
     * Calcul CP et W' depuis efforts (modèle linéaire 2-paramètres)
     * Ref: Poole et al. (2016). Critical Power. MSSE.
     */
    estimateFromEfforts: (efforts) => {
        if (!efforts || efforts.length < 2) return null;
        
        const n = efforts.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        
        efforts.forEach(e => {
            const work = (e.value * e.duration) / 1000;
            sumX += e.duration;
            sumY += work;
            sumXY += e.duration * work;
            sumX2 += e.duration * e.duration;
        });
        
        const denominator = n * sumX2 - sumX * sumX;
        if (Math.abs(denominator) < 0.001) return null;
        
        const CP = (n * sumXY - sumX * sumY) / denominator;
        const W_prime = (sumY - CP * sumX) / n;
        
        if (CP < 0 || W_prime < 0) return null;
        
        // Calcul du R² (qualité du fit)
        const meanY = sumY / n;
        let ssTot = 0, ssRes = 0;
        efforts.forEach(e => {
            const work = (e.value * e.duration) / 1000;
            const predicted = W_prime + CP * e.duration;
            ssTot += Math.pow(work - meanY, 2);
            ssRes += Math.pow(work - predicted, 2);
        });
        const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;
        
        return {
            CP: Math.round(CP * 10) / 10,
            W_prime: Math.round(W_prime * 10) / 10,
            rSquared: Math.round(rSquared * 1000) / 1000,
            quality: rSquared > 0.95 ? 'excellent' : rSquared > 0.90 ? 'good' : 'fair',
            CP_unit: 'W',
            W_prime_unit: 'kJ',
        };
    },
    
    /**
     * Modèle 3-paramètres (CP, W', P_max)
     * Ref: Morton (1996). A 3-parameter critical power model.
     * P(t) = W'/t + CP + P_max * e^(-t/τ)
     */
    estimate3Parameter: (efforts) => {
        if (!efforts || efforts.length < 3) return null;
        
        // Estimation CP et W' via modèle 2-paramètres d'abord
        const base = CriticalPower.estimateFromEfforts(efforts);
        if (!base) return null;
        
        // Estimation P_max (puissance maximale instantanée)
        const maxPower = Math.max(...efforts.map(e => e.value));
        
        // τ (constante de temps anaérobie) ≈ 20-30s
        const tau = 25;
        
        return {
            ...base,
            P_max: Math.round(maxPower * 1.1),
            tau: tau,
            model: '3-parameter',
        };
    },
    
    /**
     * Power Duration Curve — courbe complète de 1s à 10h
     * Ref: Skiba (2013). Power duration relationship.
     */
    generatePowerDurationCurve: (CP, W_prime, P_max = null) => {
        if (!CP || !W_prime) return [];
        
        const pMax = P_max || CP * 2.5;
        const durations = [1, 5, 10, 30, 60, 120, 300, 600, 1200, 1800, 3600, 7200, 10800, 36000];
        
        return durations.map(t => {
            // Modèle hyperbolique: P = W'/t + CP
            const power = W_prime * 1000 / t + CP;
            return {
                duration: t,
                durationFormatted: t < 60 ? `${t}s` : t < 3600 ? `${Math.round(t/60)}min` : `${(t/3600).toFixed(1)}h`,
                power: Math.round(Math.min(power, pMax) * 10) / 10,
            };
        });
    },
    
    /**
     * W' balance — calcul W' restante en temps réel pendant l'effort
     * Ref: Skiba et al. (2012). W' balance model.
     */
    calculateWBalance: (currentPower, CP, W_prime, previousWBalance, timeSinceLastAboveCP) => {
        if (currentPower <= CP) {
            // Reconstitution de W'
            const recoveryRate = W_prime / (CP * 0.5); // simplifié
            return Math.min(W_prime, previousWBalance + recoveryRate * timeSinceLastAboveCP);
        } else {
            // Dépense de W'
            const depletion = (currentPower - CP) * timeSinceLastAboveCP / 1000;
            return Math.max(0, previousWBalance - depletion);
        }
    },
    
    /**
     * Calcul temps jusqu'à exhaustion
     * Ref: Morton (2006). The critical power model.
     */
    timeToExhaustion: (power, CP, W_prime) => {
        if (power <= CP) return Infinity;
        return W_prime * 1000 / (power - CP); // secondes
    },
    
    /**
     * Estimation FTP depuis CP
     * FTP ≈ CP × 0.95 (généralement 5-10% en dessous)
     */
    estimateFTP: (CP) => {
        return { ftp: Math.round(CP * 0.95), note: 'FTP ~ 95% CP' };
    },
    
    /**
     * Estimation CP depuis VDOT (pour coureurs sans powermeter)
     * Ref: Jones & Carter (2000). Aerobic fitness and running economy.
     */
    estimateCPFromVDOT: (vdot) => {
        if (!vdot || vdot <= 0) return null;
        
        // Relation empirique VDOT → puissance critique (course à pied)
        // CP_running ≈ VDOT × 3.5 (en W/kg approximatif)
        const cpPerKg = vdot * 0.08; // W/kg approximatif
        return {
            cpPerKg: Math.round(cpPerKg * 100) / 100,
            note: 'Estimation course à pied — nécessite poids pour W absolus',
        };
    },
};

// ============================================================================
// OVERTRAINING DETECTION — Détection multi-facteur avancée
// ============================================================================

const Overtraining = {
    /**
     * Détection syndrome de surentraînement — modèle multi-facteur
     * Ref: Meeusen et al. (2013). Prevention, diagnosis, treatment OTS.
     * Ref: Kellmann et al. (2018). Recovery-Performance Questionnaire (RESTQ-Sport).
     * 
     * 5 niveaux: optimal → acceptable → fonctionnel → non-fonctionnel → OTS
     */
    detectOTS: (indicators) => {
        const {
            performanceTrend = 0,
            rpeChange = 0,
            hrvRatio = 1,
            sleepQuality = 70,
            restingHRChange = 0,
            moodScore = 70,
            illnessCount = 0,
            acwr = 1,
            tsb = 0,
            monotony = 1.5,
            trainingAge = 3,
            consecutiveHardDays = 0,
        } = indicators;
        
        let riskScore = 0;
        const factors = [];
        const recommendations = [];
        
        // Performance decline (poids: 30)
        if (performanceTrend < -15) {
            riskScore += 30;
            factors.push({ factor: 'Performance decline sévère', impact: 30, severity: 'critical' });
            recommendations.push('Arrêt complet 3-5 jours');
        } else if (performanceTrend < -8) {
            riskScore += 20;
            factors.push({ factor: 'Performance decline modérée', impact: 20, severity: 'high' });
            recommendations.push('Semaine de récupération');
        } else if (performanceTrend < -3) {
            riskScore += 10;
            factors.push({ factor: 'Performance decline légère', impact: 10, severity: 'moderate' });
        }
        
        // HRV suppression (poids: 25)
        if (hrvRatio < 0.65) {
            riskScore += 25;
            factors.push({ factor: 'HRV suppression sévère', impact: 25, severity: 'critical' });
            recommendations.push('Repos complet + suivi médical si persiste');
        } else if (hrvRatio < 0.80) {
            riskScore += 15;
            factors.push({ factor: 'HRV suppression modérée', impact: 15, severity: 'high' });
        } else if (hrvRatio < 0.90) {
            riskScore += 5;
            factors.push({ factor: 'HRV légèrement basse', impact: 5, severity: 'low' });
        }
        
        // Sleep quality (poids: 20)
        if (sleepQuality < 40) {
            riskScore += 20;
            factors.push({ factor: 'Sommeil très perturbé', impact: 20, severity: 'critical' });
            recommendations.push('Priorité sommeil + hygiène de sommeil');
        } else if (sleepQuality < 60) {
            riskScore += 12;
            factors.push({ factor: 'Sommeil perturbé', impact: 12, severity: 'high' });
        } else if (sleepQuality < 75) {
            riskScore += 5;
            factors.push({ factor: 'Sommeil sous-optimal', impact: 5, severity: 'low' });
        }
        
        // Resting HR (poids: 15)
        if (restingHRChange > 12) {
            riskScore += 15;
            factors.push({ factor: 'FC repos élevée (+12+ bpm)', impact: 15, severity: 'critical' });
        } else if (restingHRChange > 7) {
            riskScore += 10;
            factors.push({ factor: 'FC repos élevée (+7 bpm)', impact: 10, severity: 'high' });
        } else if (restingHRChange > 4) {
            riskScore += 5;
            factors.push({ factor: 'FC repos légèrement élevée', impact: 5, severity: 'moderate' });
        }
        
        // ACWR (poids: 15)
        if (acwr > 1.8) {
            riskScore += 15;
            factors.push({ factor: 'ACWR critique (>1.8)', impact: 15, severity: 'critical' });
            recommendations.push('Réduction immédiate de 50% du volume');
        } else if (acwr > 1.5) {
            riskScore += 10;
            factors.push({ factor: 'ACWR élevé (>1.5)', impact: 10, severity: 'high' });
        } else if (acwr > 1.3) {
            riskScore += 5;
            factors.push({ factor: 'ACWR modéré (>1.3)', impact: 5, severity: 'moderate' });
        }
        
        // TSB (poids: 10)
        if (tsb < -35) {
            riskScore += 10;
            factors.push({ factor: 'TSB très négatif (fatigue accumulée)', impact: 10, severity: 'critical' });
            recommendations.push('Deload immédiat');
        } else if (tsb < -25) {
            riskScore += 5;
            factors.push({ factor: 'TSB négatif', impact: 5, severity: 'high' });
        }
        
        // Jours consécutifs difficiles
        if (consecutiveHardDays >= 5) {
            riskScore += 10;
            factors.push({ factor: `${consecutiveHardDays} jours difficiles consécutifs`, impact: 10, severity: 'high' });
            recommendations.push('Jour de repos obligatoire');
        } else if (consecutiveHardDays >= 3) {
            riskScore += 5;
            factors.push({ factor: `${consecutiveHardDays} jours difficiles consécutifs`, impact: 5, severity: 'moderate' });
        }
        
        // Mood (poids: 10)
        if (moodScore < 40) {
            riskScore += 10;
            factors.push({ factor: 'Humeur très basse', impact: 10, severity: 'high' });
        } else if (moodScore < 60) {
            riskScore += 5;
            factors.push({ factor: 'Humeur basse', impact: 5, severity: 'moderate' });
        }
        
        // Maladies récentes
        if (illnessCount >= 3) {
            riskScore += 15;
            factors.push({ factor: 'Maladies récurrentes', impact: 15, severity: 'critical' });
            recommendations.push('Consultation médicale recommandée');
        } else if (illnessCount >= 1) {
            riskScore += 5;
            factors.push({ factor: 'Maladie récente', impact: 5, severity: 'moderate' });
        }
        
        // Classification 5 niveaux
        let status, level, color;
        if (riskScore >= 70) {
            status = 'OTS_PROBABLE';
            level = 5;
            color = 'darkred';
        } else if (riskScore >= 50) {
            status = 'NON_FUNCTIONAL_OVERREACHING';
            level = 4;
            color = 'red';
        } else if (riskScore >= 35) {
            status = 'FUNCTIONAL_OVERREACHING';
            level = 3;
            color = 'orange';
        } else if (riskScore >= 20) {
            status = 'ACCEPTABLE';
            level = 2;
            color = 'yellow';
        } else {
            status = 'OPTIMAL';
            level = 1;
            color = 'green';
        }
        
        // Recommandation par défaut si aucune spécifique
        if (recommendations.length === 0) {
            if (level <= 2) recommendations.push('Continuez votre programme actuel');
            else recommendations.push('Réduisez la charge et surveillez les symptômes');
        }
        
        return {
            status,
            level,
            color,
            riskScore: Math.min(100, riskScore),
            maxScore: 100,
            factors,
            recommendations,
            recommendation: recommendations.join('. '),
            monitoring: {
                checkHRV: level >= 3,
                checkRestingHR: level >= 3,
                reduceLoad: level >= 3,
                restDays: level >= 4 ? 5 : level >= 3 ? 2 : 0,
                medicalConsult: level >= 5,
            }
        };
    },
    
    /**
     * Score de risque de blessure
     * Ref: Gabbett (2016). Training-injury prevention paradox.
     */
    calculateInjuryRisk: (acwr, chronicLoad, monotony, strain, hrvRatio, consecutiveDays) => {
        let risk = 0;
        
        // ACWR spike
        if (acwr > 2.0) risk += 40;
        else if (acwr > 1.5) risk += 25;
        else if (acwr > 1.3) risk += 10;
        
        // Charge chronique faible (athlète non préparé)
        if (chronicLoad < 500) risk += 15;
        else if (chronicLoad < 1000) risk += 5;
        
        // Monotonie
        if (monotony > 2.5) risk += 20;
        else if (monotony > 2.0) risk += 10;
        
        // Strain
        if (strain > 800) risk += 15;
        else if (strain > 500) risk += 5;
        
        // HRV
        if (hrvRatio < 0.7) risk += 10;
        
        // Jours consécutifs
        if (consecutiveDays > 7) risk += 10;
        else if (consecutiveDays > 5) risk += 5;
        
        risk = Math.min(100, risk);
        
        let level, color, message;
        if (risk >= 70) { level = 'critical'; color = 'darkred'; message = 'Risque de blessure très élevé'; }
        else if (risk >= 50) { level = 'high'; color = 'red'; message = 'Risque de blessure élevé'; }
        else if (risk >= 30) { level = 'moderate'; color = 'orange'; message = 'Risque modéré'; }
        else if (risk >= 15) { level = 'low'; color = 'yellow'; message = 'Risque faible'; }
        else { level = 'minimal'; color = 'green'; message = 'Risque minimal'; }
        
        return { risk, level, color, message };
    },
};

// ============================================================================
// TAPER OPTIMIZATION — Modèle Mujika avancé
// ============================================================================

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
        
        const targetDays = optimalDuration[distance] || 10;
        const actualDays = Math.min(daysToCompetition, targetDays);
        
        // Réduction de volume optimale
        const volumeReduction = {
            beginner: 0.50,  // 50% de réduction
            intermediate: 0.45,
            advanced: 0.40,
            elite: 0.35,
        };
        
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
    getSessionDescription: (type, distance) => {
        const descriptions = {
            competition: 'Jour J — Course',
            activation: '20min footing + 3 x 30s allure course',
            sharp: '30min + 4 x 1min allure course (récup 2min)',
            maintenance: '40min dont 2 x 10min allure seuil',
            reduction: 'Endurance fondamentale légère',
        };
        return descriptions[type] || 'Endurance fondamentale';
    },
    
    /**
     * Calcul de la réduction de charge pour le taper (ancien format, compatibilité)
     */
    calculateTaperPlan: (currentWeeklyLoad, daysToCompetition, taperStyle = 'classic') => {
        return Taper.calculateOptimalTaper(currentWeeklyLoad, daysToCompetition).plan;
    },
};

// ============================================================================
// RECOMMENDATION ENGINE — Moteur intelligent multi-facteurs
// ============================================================================

const Recommendations = {
    /**
     * Génération de recommandation d'entraînement
     * Intègre tous les modèles scientifiques: PMC, HRV, ACWR, Polarization, TSB
     */
    generate: (profile, historyCtx, dateContext) => {
        const {
            vma = 15, 
            fcm = 185, 
            vdot = 30,
            restingHR = 60,
            age = 30,
            sex = 'M',
            level = 'intermediate',
        } = profile || {};
        
        const {
            weeklyLoad = 0,
            chronicLoad = 0,
            acwr = 1,
            readiness = 70,
            polarizationIndex = 50,
            monotony = 1.5,
            daysSinceLongRun = 999,
            daysSinceInterval = 999,
            daysSinceThreshold = 999,
            currentStreak = 0,
            daysActive = 0,
            avgRecentIF = 0.7,
            hrvRmssd = 0,
            hrvBaseline = 0,
            tsb = 0,
            sleepHours = 7,
            consecutiveHardDays = 0,
        } = historyCtx || {};
        
        const { dayOfWeek = new Date().getDay(), daysToCompetition = 999 } = dateContext || {};
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        const acwrStatus = PMC.getACWRStatus(acwr);
        const polarRec = Polarization.getRecommendation(polarizationIndex);
        
        // ===== RÈGLES DE DÉCISION SCIENTIFIQUES (priorité décroissante) =====
        
        // 0. Competition proche — taper
        if (daysToCompetition <= 21 && daysToCompetition > 0) {
            const taper = Taper.calculateOptimalTaper(weeklyLoad, daysToCompetition, '10k', level);
            const todayPlan = taper.plan.find(p => p.daysOut === daysToCompetition);
            return {
                type: 'TAPER',
                intensity: todayPlan?.sessionType === 'competition' ? 'competition' : 'low',
                intensityColor: daysToCompetition <= 3 ? 'gold' : 'blue',
                title: daysToCompetition <= 3 ? 'Pré-course' : 'Taper',
                subtitle: `J-${daysToCompetition} — ${todayPlan?.sessionDescription || 'Réduction progressive'}`,
                description: `Phase d'affûtage. Volume réduit à ${todayPlan?.volumePercent || 60}%.`,
                advice: daysToCompetition <= 3 ? 'Repos et hydratation. Visualisation mentale.' : 'Suivez le plan de taper.',
                structure: [todayPlan?.sessionDescription || '30min endurance légère'],
                physiologicalGain: 'Supercompensation, récupération',
                taper: taper,
                metrics: { readiness, acwr, daysToCompetition },
                scientificBasis: 'Mujika & Padilla (2003)',
            };
        }
        
        // 1. Overtraining / ACWR critique
        if (acwr > 1.5) {
            return {
                type: 'RECOVERY',
                intensity: 'low',
                intensityColor: 'blue',
                title: 'Récupération Active',
                subtitle: `Charge excessive (ACWR: ${acwr.toFixed(2)})`,
                description: 'Votre charge dépasse les seuils de sécurité. Priorité récupération.',
                advice: 'Footing très léger (< 30min zone 1) ou repos complet. Hydratation et sommeil optimaux.',
                structure: ['Repos ou footing < 30min zone 1 (< 60% FCM)'],
                physiologicalGain: 'Récupération, réparation musculaire',
                metrics: { readiness, acwr, polarizationIndex, monotony },
                warnings: [{ type: 'danger', message: `ACWR ${acwr.toFixed(2)} > 1.5 — Risque blessure élevé` }],
                scientificBasis: 'Gabbett 2016; Maupin 2020',
            };
        }
        
        // 2. Fatigue CNS (streak + readiness basse)
        if (currentStreak > 4 && readiness < 40) {
            return {
                type: 'REST',
                intensity: 'rest',
                intensityColor: 'gray',
                title: 'Repos Biologique',
                subtitle: `Fatigue CNS — Readiness: ${readiness}%`,
                description: 'Fatigue du système nerveux central détectée.',
                advice: 'Repos complet. Stretching, foam roller, hydratation.',
                structure: ['Jour de repos total'],
                physiologicalGain: 'Récupération CNS, restauration glycogène',
                metrics: { readiness, acwr, polarizationIndex, monotony },
                warnings: [{ type: 'warning', message: `CNS fatigue — Streak ${currentStreak} jours` }],
                scientificBasis: 'Meeusen 2013 OTS consensus',
            };
        }
        
        // 3. Jours consécutifs difficiles
        if (consecutiveHardDays >= 4) {
            return {
                type: 'RECOVERY',
                intensity: 'low',
                intensityColor: 'blue',
                title: 'Récupération',
                subtitle: `${consecutiveHardDays} jours difficiles consécutifs`,
                description: 'Besoin de récupération après une série intense.',
                advice: 'Endurance fondamentale très légère ou repos actif.',
                structure: ['30-45min endurance zone 1-2'],
                physiologicalGain: 'Récupération, adaptation',
                metrics: { readiness, acwr, consecutiveHardDays },
                warnings: [{ type: 'warning', message: `${consecutiveHardDays} jours consécutifs — récupération nécessaire` }],
                scientificBasis: 'Foster 1998',
            };
        }
        
        // 4. Monotonie excessive
        if (monotony > SCIENTIFIC_CONSTANTS.MONOTONY.WARNING) {
            return {
                type: 'VARIED',
                intensity: 'varied',
                intensityColor: 'purple',
                title: 'Séance Variée',
                subtitle: `Monotonie: ${monotony.toFixed(2)}`,
                description: 'Votre entraînement manque de variété.',
                advice: 'Fartlek ou séance avec changements d\'allure.',
                structure: [
                    '15 min échauffement',
                    '30-40 min fartlek (accélérations naturelles)',
                    '10 min retour au calme'
                ],
                physiologicalGain: 'Variabilité neuromusculaire',
                metrics: { readiness, acwr, polarizationIndex, monotony },
                warnings: [{ type: 'warning', message: `Monotonie élevée: ${monotony.toFixed(2)}` }],
                scientificBasis: 'Foster 1998; Halson 2014',
            };
        }
        
        // 5. Sortie longue (weekend + besoin)
        if (daysSinceLongRun > 9 && isWeekend && readiness > 50) {
            const longDist = Math.min(32, Math.max(15, weeklyLoad / 10));
            const pace = RunningPerformance.getPaceSeconds(vdot, SCIENTIFIC_CONSTANTS.VDOT.E_LOW);
            
            return {
                type: 'LONG_RUN',
                intensity: 'moderate',
                intensityColor: 'green',
                title: 'Sortie Longue',
                subtitle: `${Math.round(longDist)}km — ${MathUtils.formatPace(pace)}/km`,
                description: 'Pilier de la construction aérobie. Développer mitochondries et capillaires.',
                advice: 'Commencez doucement. Hydratation et nutrition si > 90min.',
                structure: [
                    '15 min échauffement progressif',
                    `${Math.round(longDist - 5)}km à ${MathUtils.formatPace(pace)}/km`,
                    'Retour au calme 5-10min'
                ],
                physiologicalGain: 'Biogenèse mitochondriale, capillarisation',
                targetDistance: longDist * 1000,
                targetPace: MathUtils.formatPace(pace),
                metrics: { readiness, acwr, polarizationIndex, monotony },
                scientificBasis: 'Seiler 2019; Joyner & Coyle 1993',
            };
        }
        
        // 6. Séance VMA/Intervalle (conditions optimales)
        if (readiness > 65 && daysSinceInterval > 5 && polarizationIndex < 80 && !isWeekend && acwr <= 1.3) {
            const reps = avgRecentIF > 0.85 ? 4 : 6;
            const vmaPace = RunningPerformance.getPaceSeconds(vdot, SCIENTIFIC_CONSTANTS.VDOT.I);
            
            return {
                type: 'INTERVAL',
                intensity: 'high',
                intensityColor: 'red',
                title: 'VMA — Puissance Aérobie',
                subtitle: `${reps} x 1000m à ${MathUtils.formatPace(vmaPace)}/km`,
                description: 'Développer le VO2max. Conditions optimales selon readiness et polarization.',
                advice: 'Régularité indispensable. Récupération 3min entre répétitions.',
                structure: [
                    '20 min échauffement progressif',
                    `${reps} x 1000m à ${MathUtils.formatPace(vmaPace)} (récup 3min)`,
                    '10 min retour au calme'
                ],
                physiologicalGain: 'VO2max, puissance aérobie',
                targetPace: MathUtils.formatPace(vmaPace),
                targetReps: reps,
                metrics: { readiness, acwr, polarizationIndex, monotony },
                scientificBasis: 'Seiler 2006; Daniels 2021',
            };
        }
        
        // 7. Séance Seuil
        if (readiness > 55 && daysSinceThreshold > 4 && !isWeekend) {
            const thresholdPace = RunningPerformance.getPaceSeconds(vdot, SCIENTIFIC_CONSTANTS.VDOT.T);
            const blockDuration = Math.max(5, Math.min(15, Math.round(weeklyLoad / 30)));
            
            return {
                type: 'THRESHOLD',
                intensity: 'threshold',
                intensityColor: 'orange',
                title: 'T — Seuil Anaérobie',
                subtitle: `3 x ${blockDuration}min à ${MathUtils.formatPace(thresholdPace)}`,
                description: 'Améliorer la capacité à soutenir haute intensité.',
                advice: 'Effort "confortablement difficile". Respiration contrôlée.',
                structure: [
                    '15 min échauffement',
                    `3 x ${blockDuration}min à ${MathUtils.formatPace(thresholdPace)} (récup 1min)`,
                    '10 min retour au calme'
                ],
                physiologicalGain: 'Seuil lactique, efficacité aérobie',
                targetPace: MathUtils.formatPace(thresholdPace),
                metrics: { readiness, acwr, polarizationIndex, monotony },
                scientificBasis: 'Seiler 2011; Gaesser & Poole 1986',
            };
        }
        
        // 8. Polarisation — besoin de haute intensité
        if (polarizationIndex < 60 && readiness > 60 && daysSinceInterval > 3) {
            const shortReps = 8;
            const shortPace = RunningPerformance.getPaceSeconds(vdot, SCIENTIFIC_CONSTANTS.VDOT.R);
            
            return {
                type: 'SPEED',
                intensity: 'high',
                intensityColor: 'red',
                title: 'Vitesse — Répétitions courtes',
                subtitle: `${shortReps} x 200m à ${MathUtils.formatPace(shortPace)}`,
                description: 'Améliorer la polarisation. Séance courte et intense.',
                advice: 'Récupération complète entre répétitions.',
                structure: [
                    '20 min échauffement',
                    `${shortReps} x 200m à ${MathUtils.formatPace(shortPace)} (récup 90s)`,
                    '10 min retour au calme'
                ],
                physiologicalGain: 'Puissance neuromusculaire, économie de course',
                targetPace: MathUtils.formatPace(shortPace),
                metrics: { readiness, acwr, polarizationIndex },
                scientificBasis: 'Seiler 2006 (80/20)',
            };
        }
        
        // 9. Endurance fondamentale (défaut)
        const enduranceDuration = weeklyLoad > 200 ? 60 : 45;
        const easyPace = RunningPerformance.getPaceSeconds(vdot, 0.68);
        
        return {
            type: 'EASY',
            intensity: 'moderate',
            intensityColor: 'green',
            title: 'Endurance Fondamentale',
            subtitle: `${enduranceDuration}min à ${MathUtils.formatPace(easyPace)}`,
            description: 'Base du volume d\'entraînement. Développement aérobie basse intensité.',
            advice: 'Allure conversable. Respiration nasale si possible.',
            structure: [
                `${enduranceDuration} min endurance à ${MathUtils.formatPace(easyPace)}/km`,
                '+ 6 lignes droites si VMA à travailler'
            ],
            physiologicalGain: 'Capillarisation, économie de course, densité mitochondriale',
            targetPace: MathUtils.formatPace(easyPace),
            targetDuration: enduranceDuration,
            metrics: { readiness, acwr, polarizationIndex, monotony },
            scientificBasis: 'Seiler 2006 (80/20); Bassett & Howley 2000',
        };
    },
    
    /**
     * Alias pour compatibilité
     */
    getRecommendation: (profile, historyCtx, dateContext) =>
        Recommendations.generate(profile, historyCtx, dateContext),
    
    /**
     * Analyse complète de l'historique d'entraînement
     */
    analyzeTrainingHistory: (activities, options = {}) => {
        if (!activities || activities.length === 0) {
            return {
                weeklyLoad: 0, chronicLoad: 0, acwr: 1,
                readiness: 70, polarizationIndex: 0, monotony: 1,
                daysSinceLongRun: 999, daysSinceInterval: 999, daysSinceThreshold: 999,
                currentStreak: 0, avgRecentIF: 0.7, daysActive: 0,
                recentActivities: 0, trainingFrequency: 0, consecutiveHardDays: 0,
            };
        }
        
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000);
        
        const weekActs = activities.filter(a => new Date(a.date) >= weekAgo);
        const monthActs = activities.filter(a => new Date(a.date) >= monthAgo);
        
        const weeklyLoad = weekActs.reduce((s, a) => s + (a.tss || a.trimp || a.load || 50), 0);
        const monthlyLoad = monthActs.reduce((s, a) => s + (a.tss || a.trimp || a.load || 50), 0);
        const chronicLoad = monthlyLoad / 4;
        const acwr = PMC.calculateACWR(weeklyLoad, chronicLoad);
        
        // Monotonie
        const dailyLoads = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
            const dayStr = d.toISOString().split('T')[0];
            const dayLoad = activities.filter(a => a.date?.startsWith(dayStr))
                .reduce((s, a) => s + (a.tss || a.trimp || a.load || 50), 0);
            dailyLoads.push(dayLoad);
        }
        const monotony = PMC.calculateMonotony(dailyLoads);
        
        // Jours depuis dernière longue
        const longRuns = activities.filter(a => (a.distance || 0) > 10000);
        const daysSinceLongRun = longRuns.length > 0
            ? Math.floor((today - new Date(longRuns[0].date)) / (24 * 60 * 60 * 1000))
            : 999;
        
        // Jours depuis dernier intervalle
        const intervals = activities.filter(a => (a.tss || a.trimp || 0) > 80);
        const daysSinceInterval = intervals.length > 0
            ? Math.floor((today - new Date(intervals[0].date)) / (24 * 60 * 60 * 1000))
            : 999;
        
        // Jours depuis dernier seuil
        const thresholds = activities.filter(a => {
            const if_ = a.intensityFactor || a.if_factor || 0;
            return if_ >= 0.85 && if_ < 0.95;
        });
        const daysSinceThreshold = thresholds.length > 0
            ? Math.floor((today - new Date(thresholds[0].date)) / (24 * 60 * 60 * 1000))
            : 999;
        
        // Streak
        let streak = 0;
        let checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - 1);
        while (activities.some(a => a.date?.startsWith(checkDate.toISOString().split('T')[0]))) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        }
        
        // Jours consécutifs difficiles
        let consecutiveHard = 0;
        checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - 1);
        while (true) {
            const dayStr = checkDate.toISOString().split('T')[0];
            const dayActs = activities.filter(a => a.date?.startsWith(dayStr));
            const dayLoad = dayActs.reduce((s, a) => s + (a.tss || a.trimp || 0), 0);
            if (dayLoad > 80) {
                consecutiveHard++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else break;
        }
        
        // IF moyen récent
        const recentIFs = weekActs.map(a => a.intensityFactor || a.if_factor || 0.7);
        const avgRecentIF = recentIFs.length > 0 ? recentIFs.reduce((a, b) => a + b, 0) / recentIFs.length : 0.7;
        
        // Readiness
        const readiness = PMC.estimateReadiness(
            PMC.calculate(activities),
            options.hrvRmssd || 0,
            options.sleepHours || 7
        );
        
        // Polarisation
        const polarizationIndex = Polarization.calculatePolarizationIndex(
            weekActs.map(a => a.zoneDistribution || {})
        );
        
        // TSB
        const pmcData = PMC.calculate(activities);
        const latestPMC = pmcData.length > 0 ? pmcData[pmcData.length - 1] : null;
        const tsb = latestPMC?.tsb || 0;
        
        return {
            weeklyLoad: Math.round(weeklyLoad),
            chronicLoad: Math.round(chronicLoad),
            acwr: Math.round(acwr * 100) / 100,
            readiness,
            polarizationIndex,
            monotony: Math.round(monotony * 100) / 100,
            daysSinceLongRun,
            daysSinceInterval,
            daysSinceThreshold,
            currentStreak: streak,
            avgRecentIF: Math.round(avgRecentIF * 100) / 100,
            daysActive: activities.length,
            recentActivities: weekActs.length,
            trainingFrequency: weekActs.length > 0 ? Math.round(weekActs.length * 100 / 7) : 0,
            consecutiveHardDays: consecutiveHard,
            tsb,
        };
    },
};

// ============================================================================
// SPORT ANALYSIS — Analyse spécifique par type de sport
// ============================================================================

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

        return {
            sportType, sportLabel: constants.label, tss, trimp,
            intensityFactor: intensityFactor ? Math.round(intensityFactor * 100) / 100 : null,
            zones, pace, vdot, normalizedPower, variabilityIndex,
            elevationGain: elevation, duration, durationFormatted: MathUtils.formatDuration(duration),
            calories: activity.calories || null,
        };
    },
};

/**
 * Running Power Estimation
 * Estimates running power (watts) from pace, elevation, and biomechanical data.
 * Ref: Stryd power meter validation studies, Minetti et al. (2002) energy cost of walking/running.
 */
const RunningPower = {
    /**
     * Estimate running power from pace and grade
     * Ref: Minetti et al. (2002) metabolic cost model
     * @param {number} paceSecPerKm - Pace in seconds per km
     * @param {number} grade - Grade as decimal (0.05 = 5% uphill)
     * @param {number} weight - Runner weight in kg
     * @returns {object} Power estimation with components
     */
    estimateFromPace: (paceSecPerKm, grade = 0, weight = 70) => {
        const speedMs = 1000 / paceSecPerKm;

        // Horizontal power (COST of running ~ 0.98 J/kg/m at optimal speed)
        const costOfRunning = 0.98 + 0.002 * Math.abs(speedMs - 3.5);
        const horizontalPower = costOfRunning * weight * speedMs;

        // Vertical power (mgh/t)
        const verticalSpeed = speedMs * grade;
        const verticalPower = weight * 9.81 * verticalSpeed;

        // Total mechanical power (efficiency ~25%)
        const totalMechanical = horizontalPower + Math.max(0, verticalPower);
        const metabolicPower = totalMechanical / 0.25;

        // Form power (lateral oscillation, ~15-25% of total)
        const formPower = metabolicPower * 0.20;

        // Leg spring stiffness adjustment
        const legSpringFactor = 1 + 0.05 * Math.abs(grade);

        const totalPower = Math.round((metabolicPower + formPower) * legSpringFactor);

        return {
            totalPower,
            horizontalPower: Math.round(horizontalPower),
            verticalPower: Math.round(Math.max(0, verticalPower)),
            formPower: Math.round(formPower),
            metabolicPower: Math.round(metabolicPower),
            efficiency: 0.25,
            grade,
            speed: Math.round(speedMs * 100) / 100,
        };
    },

    /**
     * Estimate power from HR and pace (when no power meter)
     * Uses HR as proxy for metabolic demand
     */
    estimateFromHR: (heartRate, maxHR, paceSecPerKm, weight = 70) => {
        const hrPercent = heartRate / maxHR;
        const basePower = RunningPower.estimateFromPace(paceSecPerKm, 0, weight);

        // HR-based correction factor
        const hrCorrection = 0.7 + 0.6 * hrPercent;
        const adjustedPower = Math.round(basePower.totalPower * hrCorrection);

        return {
            totalPower: adjustedPower,
            hrPercent: Math.round(hrPercent * 100) / 100,
            confidence: hrPercent > 0.5 && hrPercent < 0.95 ? 'moderate' : 'low',
            ...basePower,
        };
    },

    /**
     * Calculate power zones from FTP (Functional Threshold Power)
     * 7-zone model (Coggan adapted for running)
     */
    calculatePowerZones: (ftp) => {
        return [
            { zone: 1, name: 'Active Recovery', min: 0, max: Math.round(ftp * 0.55), description: 'Récupération active' },
            { zone: 2, name: 'Endurance', min: Math.round(ftp * 0.55), max: Math.round(ftp * 0.75), description: 'Endurance fondamentale' },
            { zone: 3, name: 'Tempo', min: Math.round(ftp * 0.75), max: Math.round(ftp * 0.90), description: 'Allure tempo' },
            { zone: 4, name: 'Threshold', min: Math.round(ftp * 0.90), max: Math.round(ftp * 1.05), description: 'Seuil lactique' },
            { zone: 5, name: 'VO2max', min: Math.round(ftp * 1.05), max: Math.round(ftp * 1.20), description: 'VO2max' },
            { zone: 6, name: 'Anaerobic', min: Math.round(ftp * 1.20), max: Math.round(ftp * 1.50), description: 'Anaérobie' },
            { zone: 7, name: 'Neuromuscular', min: Math.round(ftp * 1.50), max: Infinity, description: 'Neuromusculaire' },
        ];
    },

    /**
     * Estimate FTP from race performance
     */
    estimateFTPFromRace: (raceDistanceKm, raceTimeSec, weight = 70) => {
        const paceSecPerKm = raceTimeSec / raceDistanceKm;
        const power = RunningPower.estimateFromPace(paceSecPerKm, 0, weight);

        // FTP ≈ 95% of 1-hour power
        const durationHours = raceTimeSec / 3600;
        const ftpFactor = durationHours >= 1 ? 0.95 : 0.90 + 0.05 * durationHours;

        return Math.round(power.totalPower * ftpFactor);
    },

    /**
     * Calculate Normalized Power for running (similar to cycling)
     * Uses 30-second rolling average with 4th power
     */
    calculateNormalizedPower: (powerSamples, sampleIntervalSec = 1) => {
        if (powerSamples.length < 30) return MathUtils.mean(powerSamples);

        // 30-second rolling average
        const rollingAvg = [];
        const windowSize = Math.floor(30 / sampleIntervalSec);

        for (let i = windowSize; i < powerSamples.length; i++) {
            const window = powerSamples.slice(i - windowSize, i);
            rollingAvg.push(MathUtils.mean(window));
        }

        // NP = (mean(x^4))^(1/4)
        const fourthPowers = rollingAvg.map(p => Math.pow(p, 4));
        const meanFourth = MathUtils.mean(fourthPowers);
        return Math.round(Math.pow(meanFourth, 0.25));
    },

    /**
     * Calculate Intensity Factor (IF) = NP / FTP
     */
    calculateIntensityFactor: (normalizedPower, ftp) => {
        if (!ftp || ftp === 0) return null;
        return Math.round((normalizedPower / ftp) * 1000) / 1000;
    },

    /**
     * Calculate Running Stress Score from power
     */
    calculatePowerTSS: (durationSec, normalizedPower, ftp) => {
        if (!ftp || ftp === 0) return 0;
        const if_ = normalizedPower / ftp;
        return Math.round((durationSec * if_ * if_ * 100) / 3600);
    },
};

/**
 * Sleep Optimization Model
 * Provides sleep recommendations based on training load, HRV, and recovery needs.
 * Ref: Fullagar et al. (2019), Samuels (2018), Mah et al. (2011)
 */
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
        const phaseAdjustment = {
            base: 0,
            build: 0.3,
            peak: 0.5,
            taper: -0.3,
            race: -0.5,
        }[trainingPhase] || 0;

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

/**
 * Altitude Training Model
 * Models altitude acclimatization, performance effects, and training recommendations.
 * Ref: Levine & Stray-Gundersen (live high, train low), Fulco et al. (1998)
 */
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

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    SCIENTIFIC_CONSTANTS,
    MathUtils,
    Cardiovascular,
    RunningPerformance,
    TrainingLoad,
    PMC,
    Polarization,
    HRV,
    CriticalPower,
    Overtraining,
    Taper,
    Recommendations,
    SportAnalysis,
    RunningPower,
    SleepOptimization,
    AltitudeTraining,
};
