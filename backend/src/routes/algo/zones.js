'use strict';
const { logger } = require('../../utils/logger');
const express = require('express');
const router = express.Router();
const { Cardiovascular, RunningPerformance, MathUtils, SCIENTIFIC_CONSTANTS } = require('../../algorithms');

// ============================================================================
// ZONES - Zones d'entraînement
// ============================================================================

/**
 * GET /api/algo/zones
 * Calcule les zones de FC et les allures d'entraînement
 * 
 * Query params:
 *   - age: nombre (obligatoire)
 *   - fcm: nombre (optionnel, calculé si absent)
 *   - restingHR: nombre (défaut: 60)
 *   - vma: nombre (pour zones de vitesse)
 *   - vdot: nombre (pour allures Jack Daniels)
 *   - sex: 'M' ou 'F' (défaut: M)
 */
router.get('/zones', (req, res) => {
    try {
        const { age = 30, fcm, restingHR = 60, vma, vdot, sex = 'M' } = req.query;
        
        const ageNum = parseInt(age);
        const fcmNum = fcm ? parseInt(fcm) : Cardiovascular.calculateMaxHR(ageNum);
        const vmaNum = vma ? parseFloat(vma) : null;
        const vdotNum = vdot ? parseFloat(vdot) : null;
        
        const response = {
            age: ageNum,
            fcm: fcmNum,
            restingHR: parseInt(restingHR),
            sex,
            
            // Zones Karvonen (5 zones)
            hrZones: Cardiovascular.calculateKarvonenZones(ageNum, parseInt(restingHR), sex),
            
            // Zones par %FCM (5 zones)
            hrPercentZones: Cardiovascular.calculatePercentZones(fcmNum),
        };
        
        // Zones de vitesse si VMA fourni
        if (vmaNum && vmaNum > 0) {
            response.speedZones = RunningPerformance.calculateSpeedZones(vmaNum);
        }
        
        // Allures d'entraînement si VDOT fourni
        if (vdotNum && vdotNum > 10) {
            response.trainingPaces = RunningPerformance.getTrainingPaces(vdotNum);
            response.vdot = vdotNum;
        }
        
        res.json(response);
    } catch (error) {
        logger.error('Zones error:', error);
        res.status(500).json({ error: 'Erreur calcul zones' });
    }
});

// ============================================================================
// VDOT - Calcul performance
// ============================================================================

/**
 * GET /api/algo/vdot
 * Calcule le VDOT et prédit les temps de course
 * 
 * Query params:
 *   - distance: distance en mètres (obligatoire)
 *   - time: temps en minutes (obligatoire)
 *   OU
 *   - vdot: VDOT pour prédictions
 */
router.get('/vdot', (req, res) => {
    try {
        const { distance, time, vdot } = req.query;
        
        let vdotResult = null;
        let predictions = null;
        
        // Calcul VDOT depuis performance
        if (distance && time) {
            vdotResult = RunningPerformance.calculateVDOT(parseFloat(distance), parseFloat(time));
        }
        // Ou utiliser VDOT fourni pour prédictions
        else if (vdot) {
            vdotResult = parseFloat(vdot);
        }
        
        if (!vdotResult || vdotResult < 10) {
            return res.status(400).json({ error: 'VDOT invalide' });
        }
        
        // VMA estimé
        const vma = RunningPerformance.estimateVMA(vdotResult);
        
        // Prédictions de course
        predictions = {
            marathon: RunningPerformance.predictMarathon(vdotResult),
            halfMarathon: RunningPerformance.predictHalfMarathon(vdotResult),
        };
        
        // Distance classique — use VDOT-based pace as reference
        const classicDistances = [5000, 10000, 21097, 42195];
        const referencePaceSec = RunningPerformance.getPaceSeconds(vdotResult, SCIENTIFIC_CONSTANTS.VDOT.I);
        const referenceDistance = 10000;
        const referenceTimeSec = referencePaceSec * (referenceDistance / 1000);

        predictions.classicRaces = classicDistances.map(dist => {
            const distKm = dist / 1000;
            const timeSec = RunningPerformance.predictRaceTime(referenceDistance, referenceTimeSec, dist);
            const paceSec = timeSec / dist;
            return {
                distance: distKm < 1 ? `${dist}m` : `${distKm}km`,
                time: MathUtils.formatDuration(timeSec),
                pace: MathUtils.formatPace(paceSec)
            };
        });
        
        // Niveau de performance
        const level = RunningPerformance.getPerformanceLevel('VDOT', vdotResult);
        
        res.json({
            vdot: Math.round(vdotResult * 10) / 10,
            vma: Math.round(vma * 10) / 10,
            level,
            predictions
        });
    } catch (error) {
        logger.error('VDOT error:', error);
        res.status(500).json({ error: 'Erreur calcul VDOT' });
    }
});

module.exports = router;
