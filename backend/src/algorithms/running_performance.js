'use strict';

const { MathUtils } = require('./math_utils');
const SCIENTIFIC_CONSTANTS = require('./scientific_constants');

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
     * GAP - Grade Adjusted Pace
     * Allure ajustée à la pente basée sur le coût métabolique.
     * Ref: Minetti, A. E. et al. (2002). Energy cost of walking and running at extreme uphill and downhill slopes.
     * 
     * @param {number} paceSeconds - Allure actuelle en sec/km
     * @param {number} grade - Pente en décimal (ex: 0.05 pour 5%)
     */
    calculateGAP: (paceSeconds, grade) => {
        if (!paceSeconds || paceSeconds <= 0) return 0;
        
        // Pente clampée pour éviter les aberrations
        const g = MathUtils.clamp(grade, SCIENTIFIC_CONSTANTS.MINETTI.GRADE_CLAMP_MIN, SCIENTIFIC_CONSTANTS.MINETTI.GRADE_CLAMP_MAX);
        const { c5, c4, c3, c2, c1, c0 } = SCIENTIFIC_CONSTANTS.MINETTI.COEFFICIENTS;
        const costG = c5 * Math.pow(g, 5) + c4 * Math.pow(g, 4) + c3 * Math.pow(g, 3) + c2 * Math.pow(g, 2) + c1 * g + c0;
        const cost0 = c0;
        
        const factor = costG / cost0;
        
        // GAP = Allure / Facteur de difficulté
        // En montée (factor > 1), le GAP est plus rapide (secondes plus petites)
        return paceSeconds / factor;
    },

    /**
     * Facteur d'Efficacité (EF)
     * Mesure la relation entre l'intensité (allure ajustée) et la réponse cardiaque.
     * Une augmentation de l'EF indique une amélioration de la condition aérobie.
     * 
     * @param {number} gapSeconds - Allure ajustée (GAP) en sec/km
     * @param {number} avgHR - Fréquence cardiaque moyenne
     */
    calculateEfficiencyFactor: (gapSeconds, avgHR) => {
        if (!gapSeconds || gapSeconds <= 0 || !avgHR || avgHR <= 0) return 0;
        
        // Vitesse en m/min pour une valeur lisible (ex: 1.5 - 2.5)
        const speedMetersPerMin = 1000 / (gapSeconds / 60);
        return speedMetersPerMin / avgHR;
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
    predictRaceTimeMultiModel: (knownDistance, knownTimeSeconds, targetDistance, _vdot = null) => {
        if (!knownDistance || !knownTimeSeconds || !targetDistance) return null;
        
        const targetKm = targetDistance / 1000;
        const knownKm = knownDistance / 1000;
        
        // Modèle 1: Riegel adaptatif
        const riegel = RunningPerformance.predictRaceTime(knownDistance, knownTimeSeconds, targetDistance);
        
        // Modèle 2: Mercier (basé sur VMA)
        const _knownSpeed = knownDistance / (knownTimeSeconds / 3600); // km/h
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

         // eslint-disable-next-line security/detect-object-injection
         const table = tables[event];
        if (!table) return null;
        
        // performance en secondes pour les courses
        const points = Math.round(table.A * Math.pow(Math.abs(table.B - performance), table.C));
        return Math.max(0, points);
    },

    /**
     * Prédictions groupées pour les distances classiques
     */
    predictRaceTimes: (vdot) => {
        const m = RunningPerformance.predictMarathon(vdot);
        const h = RunningPerformance.predictHalfMarathon(vdot);
        
        // Estimations 10k et 5k (simplifiées pour VDOT)
        const pace10k = RunningPerformance.getPaceSeconds(vdot, SCIENTIFIC_CONSTANTS.VDOT.T);
        const pace5k = RunningPerformance.getPaceSeconds(vdot, SCIENTIFIC_CONSTANTS.VDOT.I);
        
        return {
            marathon: parseFloat(m.time.split(':')[0]) + parseFloat(m.time.split(':')[1] || 0)/60 + parseFloat(m.time.split(':')[2] || 0)/3600,
            half: parseFloat(h.time.split(':')[0]) + parseFloat(h.time.split(':')[1] || 0)/60 + parseFloat(h.time.split(':')[2] || 0)/3600,
            '10k': (pace10k * 10) / 3600,
            '5k': (pace5k * 5) / 3600
        };
    }
};

module.exports = { RunningPerformance };
