'use strict';
const { logger } = require('../../utils/logger');
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middleware/auth');
const { Recommendations, HRV, PMC, Cardiovascular, SCIENTIFIC_CONSTANTS, SportAnalysis } = require('../../algorithms');

function safeJsonParse(str, defaultVal = null) {
    if (!str) return defaultVal;
    try {
        const parsed = JSON.parse(str);
        return parsed;
    } catch {
        return defaultVal;
    }
}

const zonesRouter = require('./zones');
const pmcRouter = require('./pmc');
const trainingRouter = require('./training');
router.use(zonesRouter);
router.use(pmcRouter);
router.use(trainingRouter);

// ============================================================================
// RECOMMENDATIONS - Recommandations d'entraînement
// ============================================================================

/**
 * GET /api/algo/recommendations
 * Génère une recommandation d'entraînement personnalisée
 * 
 * Query params:
 *   - profile: JSON {vma, fcm, vdot, restingHR, age, sex}
 *   - history: JSON {weeklyLoad, chronicLoad, acwr, readiness, ...}
 *   - dayOfWeek: 0-6 (défaut: aujourd'hui)
 */
router.get('/recommendations', verifyToken, (req, res) => {
    try {
        const { profile, history, dayOfWeek } = req.query;
        
        const profileObj = safeJsonParse(profile, {});
        const historyObj = safeJsonParse(history, {});
        const day = dayOfWeek !== undefined ? parseInt(dayOfWeek) : new Date().getDay();
        
        const recommendation = Recommendations.generate(profileObj, historyObj, { dayOfWeek: day });
        
        res.json(recommendation);
    } catch (error) {
        logger.error('Recommendations error:', error);
        res.status(500).json({ error: 'Erreur génération recommandation' });
    }
});

// ============================================================================
// HRV - Analyse récupération
// ============================================================================

/**
 * GET /api/algo/hrv
 * Analyse HRV et récupération
 * 
 * Query params:
 *   - rmssd: valeur rMSSD actuelle (ms)
 *   - baseline: rMSSD de base (ms)
 *   - restingHR: FC de repos (bpm)
 */
router.get('/hrv', (req, res) => {
    try {
        const { rmssd, baseline, restingHR = 60 } = req.query;
        
        if (!rmssd) {
            return res.status(400).json({ error: 'Paramètre rmssd requis' });
        }
        
        const rmssdNum = parseFloat(rmssd);
        const baselineNum = baseline ? parseFloat(baseline) : null;
        
        const analysis = HRV.analyzeRecovery(rmssdNum, baselineNum, parseInt(restingHR));
        const stressScore = baselineNum ? HRV.calculateStressScore(rmssdNum, baselineNum) : null;
        
        res.json({
            ...analysis,
            stressScore
        });
    } catch (error) {
        logger.error('HRV error:', error);
        res.status(500).json({ error: 'Erreur analyse HRV' });
    }
});

// ============================================================================
// HEALTH - Status global de l'athlète
// ============================================================================

/**
 * GET /api/algo/health
 * Retourne un résumé complet de la santé/forme de l'athlète
 * 
 * Query params:
 *   - profile: JSON {age, vma, fcm, restingHR, sex}
 *   - pmc: JSON array PMC data
 *   - hrv: JSON {rmssd, baseline}
 */
router.get('/health', verifyToken, (req, res) => {
    try {
        const { profile, pmc, hrv } = req.query;
        
        const profileObj = safeJsonParse(profile, {});
        const pmcData = safeJsonParse(pmc, []);
        if (!Array.isArray(pmcData)) pmcData.length = 0;
        const hrvObj = safeJsonParse(hrv, {});
        
        const latest = pmcData[pmcData.length - 1] || {};
        
        // Readiness
        const readiness = PMC.estimateReadiness(
            pmcData,
            hrvObj.rmssd || 0,
            7
        );
        
        // ACWR
        const acwr = PMC.calculateACWR(
            latest.tss || 0,
            latest.ctl || 50
        );
        
        // HRV status
        let hrvStatus = null;
        if (hrvObj.rmssd) {
            hrvStatus = HRV.analyzeRecovery(hrvObj.rmssd, hrvObj.baseline);
        }
        
        // Zones
        const fcm = profileObj.fcm || Cardiovascular.calculateMaxHR(profileObj.age || 30);
        const hrZones = Cardiovascular.calculateKarvonenZones(
            profileObj.age || 30,
            profileObj.restingHR || 60,
            profileObj.sex || 'M'
        );
        
        res.json({
            readiness,
            acwr: Math.round(acwr * 100) / 100,
            acwrStatus: PMC.getACWRStatus(acwr),
            pmc: {
                ctl: latest.ctl || 0,
                atl: latest.atl || 0,
                tsb: latest.tsb || 0
            },
            hrv: hrvStatus,
            zones: hrZones,
            profile: {
                fcm,
                vma: profileObj.vma,
                vdot: profileObj.vdot
            },
            recommendations: {
                trainingLoad: acwr > 1.3 ? 'reduce' : acwr < 0.8 ? 'increase' : 'maintain',
                intensity: readiness < 50 ? 'low' : readiness < 70 ? 'moderate' : 'high'
            }
        });
    } catch (error) {
        logger.error('Health error:', error);
        res.status(500).json({ error: 'Erreur calcul santé' });
    }
});

// ============================================================================
// CONSTANTS - Retourne les constantes scientifiques
// ============================================================================

/**
 * GET /api/algo/constants
 * Retourne les constantes scientifiques utilisées
 */
router.get('/constants', (req, res) => {
    res.json({
        pmc: {
            tauFitnessDefault: SCIENTIFIC_CONSTANTS.PMC.TAU_FITNESS_DEFAULT,
            tauFatigueDefault: SCIENTIFIC_CONSTANTS.PMC.TAU_FATIGUE_DEFAULT,
            tauFitnessRange: [SCIENTIFIC_CONSTANTS.PMC.TAU_FITNESS_MIN, SCIENTIFIC_CONSTANTS.PMC.TAU_FITNESS_MAX],
            tauFatigueRange: [SCIENTIFIC_CONSTANTS.PMC.TAU_FATIGUE_MIN, SCIENTIFIC_CONSTANTS.PMC.TAU_FATIGUE_MAX],
        },
        acwr: {
            optimal: [SCIENTIFIC_CONSTANTS.ACWR.OPTIMAL_MIN, SCIENTIFIC_CONSTANTS.ACWR.OPTIMAL_MAX],
            risky: [SCIENTIFIC_CONSTANTS.ACWR.RISKY_MIN, SCIENTIFIC_CONSTANTS.ACWR.RISKY_MAX],
            danger: SCIENTIFIC_CONSTANTS.ACWR.DANGER,
            spikeDanger: SCIENTIFIC_CONSTANTS.ACWR.SPIKE_DANGER,
        },
        polarization: {
            targetLow: SCIENTIFIC_CONSTANTS.POLARIZATION.TARGET_LOW,
            targetModerate: SCIENTIFIC_CONSTANTS.POLARIZATION.TARGET_MODERATE,
            targetHigh: SCIENTIFIC_CONSTANTS.POLARIZATION.TARGET_HIGH,
        },
        vdot: {
            zones: {
                E: [SCIENTIFIC_CONSTANTS.VDOT.E_LOW, SCIENTIFIC_CONSTANTS.VDOT.E_HIGH],
                M: SCIENTIFIC_CONSTANTS.VDOT.M,
                T: SCIENTIFIC_CONSTANTS.VDOT.T,
                I: SCIENTIFIC_CONSTANTS.VDOT.I,
                R: SCIENTIFIC_CONSTANTS.VDOT.R,
            }
        },
        fcm: {
            formula: '208 - 0.7 × age (Tanaka et al. 2001)',
            coefficient: SCIENTIFIC_CONSTANTS.FCM.TANAKA_AGE_COEFFICIENT,
            intercept: SCIENTIFIC_CONSTANTS.FCM.TANAKA_INTERCEPT,
        }
    });
});

// ============================================================================
// SPORT ANALYSIS - Analyse d'activité par sport
// ============================================================================

/**
 * POST /api/algo/analyze
 * Analyse une activité selon son type de sport
 * 
 * Body:
 *   - activity: objet activité avec toutes les propriétés
 *   - profile: profil utilisateur (fcm, vma, ftp, etc.)
 */
router.post('/analyze', verifyToken, (req, res) => {
    try {
        const { activity, profile = {} } = req.body;
        
        if (!activity || typeof activity !== 'object') {
            return res.status(400).json({ error: 'Activité requise et doit être un objet' });
        }
        
        const analysis = SportAnalysis.analyze(activity, profile);
        
        res.json(analysis);
    } catch (error) {
        logger.error('Sport analysis error:', error);
        res.status(500).json({ error: 'Erreur analyse sport' });
    }
});

// ============================================================================
// SPORTS LIST - Liste tous les sports supportés
// ============================================================================

/**
 * GET /api/algo/sports
 * Retourne la liste des sports supportés avec leurs métriques
 */
router.get('/sports', (req, res) => {
    try {
        res.json({
            sports: Object.keys(SportAnalysis.SPORT_CONSTANTS),
            constants: {
                running: 'TSS depuis FC/VMA',
                bike: 'TSS depuis puissance/FC, VI, Normalized Power',
                swim: 'TSS depuisFC/allure, SWOLF',
                trail: 'TSS ajusté pour denivelé',
                hike: 'TSS lower intensity',
                weight_training: 'Volume etTSS bas',
                hiit: 'TSS elevated'
            }
        });
    } catch (error) {
        logger.error('Sports list error:', error);
        res.status(500).json({ error: 'Erreur liste sports' });
    }
});

module.exports = router;
