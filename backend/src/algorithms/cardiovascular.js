'use strict';

const { MathUtils } = require('./math_utils');
const SCIENTIFIC_CONSTANTS = require('./scientific_constants');

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
    calculateKarvonenZones: (age, restingHR = 60, _sex = 'M', options = {}) => {
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

module.exports = { Cardiovascular };
