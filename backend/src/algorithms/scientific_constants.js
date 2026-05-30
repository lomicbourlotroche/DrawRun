'use strict';

const SCIENTIFIC_CONSTANTS = {
    // ============================================================================
    // BANISTER IMPULSE-RESPONSE MODEL (1975)
    // ============================================================================
    // Modèle mathématique de la réponse à l'entraînement
    // Formule: Performance(t) = P0 + k1*CTL(t) - k2*ATL(t)
    // où CTL = Chronic Training Load (fitness), ATL = Acute Training Load (fatigue)
    // 
    // Tau constants (Hellard et al. 2006):
    // - τf (fitness): constante de temps pour l'adaptation positive (30-60 jours)
    // - τa (fatigue): constante de temps pour la fatigue (4-12 jours)
    // - Plus τ est élevé, plus l'effet persiste longtemps
    // ============================================================================
    PMC: {
        TAU_FITNESS_DEFAULT: 42,      // jours - temps pour atteindre 63% de l'adaptation
        TAU_FATIGUE_DEFAULT: 7,        // jours - temps pour dissiper 63% de la fatigue
        TAU_FITNESS_MIN: 30,          // Athlètes très rapides à s'adapter
        TAU_FITNESS_MAX: 60,          // Athlètes très lents à s'adapter
        TAU_FATIGUE_MIN: 4,           // Récupération très rapide
        TAU_FATIGUE_MAX: 12,          // Récupération très lente
        
        // Facteurs de décroissance exponentielle: α = 1 - e^(-1/τ)
        // Représente la proportion de charge qui reste après 1 jour
        ALPHA_FITNESS: 1 - Math.exp(-1 / 42),    // ~2.3% de perte par jour
        ALPHA_FATIGUE: 1 - Math.exp(-1 / 7),      // ~13.3% de perte par jour
        ALPHA_STABILITY: 1 - Math.exp(-1 / 14),   // Balance stabilité (6.7%)
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

    // Facteurs environnementaux
    ENVIRONMENTAL: {
        TEMP_OPTIMAL_MIN: 8,      // °C - Température idéale marathon
        TEMP_OPTIMAL_MAX: 15,
        HEAT_DEGRADATION_START: 20, // °C - Début de la perte de performance significante
        ALTITUDE_DEGRADATION_START: 700, // m - Début de la baisse de VO2max
    },

    // Minetti Energy Cost Model (2002)
    // Polynomial coefficients for grade-adjusted metabolic cost of running
    // Ref: Minetti, A. E. et al. (2002). Energy cost of walking and running
    //      at extreme uphill and downhill slopes. J Appl Physiol.
    MINETTI: {
        COEFFICIENTS: { c5: 155.4, c4: -30.4, c3: -43.3, c2: 46.3, c1: 19.5, c0: 3.6 },
        GRADE_CLAMP_MIN: -0.45,
        GRADE_CLAMP_MAX: 0.45,
    },
};

module.exports = SCIENTIFIC_CONSTANTS;
