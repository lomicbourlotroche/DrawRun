'use strict';
const { logger } = require('../../utils/logger');
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middleware/auth');
const { PMC, Overtraining } = require('../../algorithms');

function safeJsonParse(str, defaultVal = null) {
    if (!str) return defaultVal;
    try {
        return JSON.parse(str);
    } catch {
        return defaultVal;
    }
}

// ============================================================================
// PMC - Performance Management Chart
// ============================================================================

/**
 * GET /api/algo/pmc
 * Calcule PMC, CTL, ATL, TSB, ACWR
 * 
 * Query params:
 *   - activities: JSON array [{date, tss}] (obligatoire)
 *   - weeks: nombre de semaines à retourner (défaut: 12)
 */
router.get('/pmc', (req, res) => {
    try {
        const { activities, weeks = 12 } = req.query;
        
        if (!activities) {
            return res.status(400).json({ error: 'Paramètre activities requis' });
        }
        
        let activitiesList;
        try {
            activitiesList = JSON.parse(activities);
        } catch {
            return res.status(400).json({ error: 'Activities JSON invalide' });
        }
        
        if (!Array.isArray(activitiesList) || activitiesList.length === 0) {
            return res.json({
                data: [],
                summary: {
                    ctl: 0,
                    atl: 0,
                    tsb: 0,
                    acwr: 1,
                    acwrStatus: PMC.getACWRStatus(1),
                    monotony: 1,
                    strain: 0
                }
            });
        }
        
        // Calcul PMC
        const pmcData = PMC.calculate(activitiesList);
        
        // Limiter aux dernières semaines
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - (parseInt(weeks) * 7));
        const filteredData = pmcData.filter(d => new Date(d.date) >= cutoffDate);
        
        // Résumé actuel
        const latest = filteredData[filteredData.length - 1] || { ctl: 0, atl: 0, tsb: 0 };
        
        // Calcul ACWR (7 derniers jours vs moyenne 28 jours)
        const last7Days = filteredData.slice(-7);
        const last28Days = filteredData.slice(-28);
        
        const weeklyLoad = last7Days.reduce((sum, d) => sum + (d.tss || 0), 0);
        const chronicLoad = last28Days.length > 0 
            ? last28Days.reduce((sum, d) => sum + (d.tss || 0), 0) / last28Days.length * 7
            : weeklyLoad;
        
        const acwr = PMC.calculateACWR(weeklyLoad, chronicLoad);
        
        // Monotonie (7 derniers jours)
        const dailyLoads = last7Days.map(d => d.tss || 0);
        const monotony = PMC.calculateMonotony(dailyLoads);
        
        // Strain
        const strain = PMC.calculateStrain(latest.ctl, monotony);
        const strainStatus = PMC.getStrainStatus(strain);
        
        res.json({
            data: filteredData,
            summary: {
                ctl: latest.ctl,
                atl: latest.atl,
                tsb: latest.tsb,
                sb: latest.sb,
                acwr: Math.round(acwr * 100) / 100,
                acwrStatus: PMC.getACWRStatus(acwr),
                monotony: Math.round(monotony * 100) / 100,
                strain: Math.round(strain),
                strainStatus,
                weeklyLoad,
                chronicLoad: Math.round(chronicLoad)
            }
        });
    } catch (error) {
        logger.error('PMC error:', error);
        res.status(500).json({ error: 'Erreur calcul PMC' });
    }
});

// ============================================================================
// OVERTRAINING - Détection surentraînement
// ============================================================================

/**
 * GET /api/algo/overtraining
 * Détecte les signes de surentraînement
 * 
 * Query params:
 *   - indicators: JSON {performanceTrend, rpeChange, hrvRatio, sleepQuality, restingHRChange, moodScore, illnessCount}
 */
router.get('/overtraining', verifyToken, (req, res) => {
    try {
        const { indicators } = req.query;
        
        // Sans indicators → réponse par défaut (appelé depuis le dashboard sans données)
        if (!indicators) {
            return res.json({
                risk: 'unknown',
                riskScore: 0,
                status: 'insufficient_data',
                symptoms: [],
                recommendation: 'Pas assez de données pour évaluer le risque de surentraînement.',
                scientificBasis: 'Meeusen et al. (2013) OTS Consensus; Carrard et al. (2021)'
            });
        }
        
        const indicatorsObj = safeJsonParse(indicators, {});
        if (!indicatorsObj || typeof indicatorsObj !== 'object') {
            return res.status(400).json({ error: 'Indicateurs JSON invalides' });
        }
        const result = Overtraining.detectOTS(indicatorsObj);
        
        res.json({
            ...result,
            scientificBasis: 'Meeusen et al. (2013) OTS Consensus; Carrard et al. (2021)'
        });
    } catch (error) {
        logger.error('Overtraining error:', error);
        res.status(500).json({ error: 'Erreur détection OTS' });
    }
});

// ============================================================================
// READINESS - Score de forme
// ============================================================================

/**
 * GET /api/algo/readiness
 * Calcule le score de forme/readiness
 * 
 * Query params:
 *   - pmc: JSON array [{tss, ctl, atl, tsb}] (derniers jours)
 *   - hrv: rMSSD actuel
 *   - sleep: heures de sommeil
 *   - restingHR: FC de repos
 */
router.get('/readiness', verifyToken, (req, res) => {
    try {
        const { pmc, hrv, sleep } = req.query;
        
        // Calcul readiness depuis PMC
        let pmcData = [];
        if (pmc) {
            pmcData = safeJsonParse(pmc, []);
            if (!Array.isArray(pmcData)) pmcData = [];
        }
        
        const result = PMC.estimateReadiness(
            pmcData,
            hrv ? parseFloat(hrv) : 0,
            sleep ? parseFloat(sleep) : 7
        );
        
        const { readiness, factors } = result;
        
        // Statuts
        let status, color, label;
        if (readiness >= 85) {
            status = 'excellent'; color = 'green'; label = 'Excellent';
        } else if (readiness >= 70) {
            status = 'good'; color = 'blue'; label = 'Bon';
        } else if (readiness >= 50) {
            status = 'moderate'; color = 'orange'; label = 'Modéré';
        } else if (readiness >= 30) {
            status = 'low'; color = 'red'; label = 'Faible';
        } else {
            status = 'poor'; color = 'gray'; label = 'Repos recommandé';
        }
        
        // Conseils selon le status
        const advice = {
            excellent: 'Jour parfait pour une séance intense ou compétition!',
            good: 'Bonne forme. Séance de qualité recommandée.',
            moderate: 'Séance légère à modérée. Évitez les efforts max.',
            low: 'Récupération active légère ou repos.',
            poor: 'Repos complet recommandé. Fatigue importante détectée.'
        };
        
        res.json({
            readiness,
            status,
            color,
            label,
            // eslint-disable-next-line security/detect-object-injection
         advice: advice[status],
            factors: {
                ...factors,
                pmc: pmcData.length > 0,
                hrvValue: hrv ? parseFloat(hrv) : null,
                sleepHours: sleep ? parseFloat(sleep) : null
            }
        });
    } catch (error) {
        logger.error('Readiness error:', error);
        res.status(500).json({ error: 'Erreur calcul readiness' });
    }
});

module.exports = router;
