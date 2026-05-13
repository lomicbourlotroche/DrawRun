'use strict';
const { logger } = require('../../utils/logger');
const express = require('express');
const router = express.Router();
const { Polarization, Taper, TrainingLoad, CriticalPower } = require('../../algorithms');

// ============================================================================
// POLARIZATION - Analyse distribution d'intensité
// ============================================================================

/**
 * GET /api/algo/polarization
 * Analyse la distribution polarisée de l'entraînement
 * 
 * Query params:
 *   - activities: JSON array [{zonePercent: {1,2,3,4,5}}]
 */
router.get('/polarization', (req, res) => {
    try {
        const { activities } = req.query;
        
        if (!activities) {
            return res.status(400).json({ error: 'Paramètre activities requis' });
        }
        
        const activitiesList = JSON.parse(activities);
        
        const index = Polarization.calculatePolarizationIndex(activitiesList);
        const recommendation = Polarization.getRecommendation(index);
        
        // Calcul des moyennes
        let totalLow = 0, totalModerate = 0, totalHigh = 0;
        let count = 0;
        
        activitiesList.forEach(act => {
            const zones = act.zonePercent || {};
            totalLow += (zones[1] || 0) + (zones[2] || 0);
            totalModerate += zones[3] || 0;
            totalHigh += (zones[4] || 0) + (zones[5] || 0);
            count++;
        });
        
        const avgLow = count > 0 ? Math.round(totalLow / count) : 0;
        const avgModerate = count > 0 ? Math.round(totalModerate / count) : 0;
        const avgHigh = count > 0 ? Math.round(totalHigh / count) : 0;
        
        const classification = Polarization.classifyDistribution(avgLow, avgModerate, avgHigh);
        
        res.json({
            index,
            distribution: { low: avgLow, moderate: avgModerate, high: avgHigh },
            classification,
            recommendation,
            target: { low: 80, moderate: 0, high: 20 }
        });
    } catch (error) {
        logger.error('Polarization error:', error);
        res.status(500).json({ error: 'Erreur analyse polarization' });
    }
});

// ============================================================================
// TAPER - Plan de tapering
// ============================================================================

/**
 * GET /api/algo/taper
 * Génère un plan de taper pour compétition
 * 
 * Query params:
 *   - currentLoad: charge hebdomadaire actuelle (CTL)
 *   - daysToCompetition: jours jusqu'à la compétition
 *   - style: 'classic' | 'linear' | 'exponential' | 'step' (défaut: classic)
 */
router.get('/taper', (req, res) => {
    try {
        const { currentLoad, daysToCompetition, style = 'classic' } = req.query;
        
        if (!currentLoad || !daysToCompetition) {
            return res.status(400).json({ error: 'Paramètres currentLoad et daysToCompetition requis' });
        }
        
        const load = parseFloat(currentLoad);
        const days = parseInt(daysToCompetition);
        
        if (days < 1 || days > 21) {
            return res.status(400).json({ error: 'daysToCompetition doit être entre 1 et 21' });
        }
        
        const plan = Taper.calculateTaperPlan(load, days, style);
        
        res.json({
            style,
            currentLoad: load,
            daysToCompetition: days,
            plan,
            summary: {
                startLoad: plan[0]?.targetLoad || load,
                competitionLoad: plan[plan.length - 1]?.targetLoad || load * 0.4,
                reduction: Math.round((1 - plan[plan.length - 1].loadPercent / 100) * 100) + '%'
            }
        });
    } catch (error) {
        logger.error('Taper error:', error);
        res.status(500).json({ error: 'Erreur génération taper' });
    }
});

// ============================================================================
// CRITICAL POWER - Modèle CP/W'
// ============================================================================

/**
 * GET /api/algo/critical-power
 * Estime CP et W' depuis efforts courts
 * 
 * Query params:
 *   - efforts: JSON array [{duration: sec, value: watts}] (minimum 2)
 */
router.get('/critical-power', (req, res) => {
    try {
        const { efforts } = req.query;
        
        if (!efforts) {
            return res.status(400).json({ error: 'Paramètre efforts requis' });
        }
        
        const effortsList = JSON.parse(efforts);
        
        if (!Array.isArray(effortsList) || effortsList.length < 2) {
            return res.status(400).json({ error: 'Minimum 2 efforts requis' });
        }
        
        const result = CriticalPower.estimateFromEfforts(effortsList);
        
        if (!result) {
            return res.status(400).json({ error: 'Impossible de calculer CP/W\'' });
        }
        
        // Estimation FTP
        const ftp = CriticalPower.estimateFTP(result.CP);
        
        res.json({
            ...result,
            ftp
        });
    } catch (error) {
        logger.error('CriticalPower error:', error);
        res.status(500).json({ error: 'Erreur calcul CP/W\'' });
    }
});

// ============================================================================
// TSS - Calcul Training Stress Score
// ============================================================================

/**
 * GET /api/algo/tss
 * Calcule TSS et TRIMP
 * 
 * Query params:
 *   - duration: durée en secondes
 *   - intensityFactor: IF (0.5-1.5)
 *   OU
 *   - avgHR: FC moyenne
 *   - maxHR: FC max
 *   - durationMin: durée en minutes
 */
router.get('/tss', (req, res) => {
    try {
        const { duration, intensityFactor, avgHR, maxHR, durationMin, sex = 'M' } = req.query;
        
        let tss = null;
        let trimp = null;
        let method = null;
        
        // TSS depuis IF
        if (duration && intensityFactor) {
            tss = TrainingLoad.calculateTSS(parseFloat(duration), parseFloat(intensityFactor));
            method = 'TSS (Coggan)';
        }
        
        // TRIMP depuis HR
        if (avgHR && maxHR && durationMin) {
            trimp = TrainingLoad.calculateTRIMPFromAvgHR(
                parseFloat(durationMin),
                parseFloat(avgHR),
                parseFloat(maxHR),
                sex
            );
            method = trimp ? 'TRIMP (Edwards)' : null;
        }
        
        res.json({
            tss: tss ? Math.round(tss) : null,
            trimp: trimp ? Math.round(trimp) : null,
            method,
            notes: {
                tss: 'Training Stress Score = duration_hours × IF² × 100',
                trimp: 'TRIMP = duration × zone_factor × sex_factor'
            }
        });
    } catch (error) {
        logger.error('TSS error:', error);
        res.status(500).json({ error: 'Erreur calcul TSS' });
    }
});

module.exports = router;
