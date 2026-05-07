/**
 * ============================================================
 * RACE PLANNER ROUTES (Express)
 * ============================================================
 * Routes pour la planification de course et stratégie d'allure
 */

'use strict';

const express = require('express');
const { verifyToken } = require('../auth');
const { RaceStrategy } = require('../algorithms/index');
const { logger } = require('../logger');
const { dbGetMain } = require('../database');
const GpxUtils = require('../utils/gpx_utils');

const router = express.Router();

/**
 * POST /api/coach/race-planner/race-strategy
 * Génère un plan d'allure basé sur un profil GPX et des conditions
 */
router.post('/race-strategy', verifyToken, async (req, res) => {
    try {
        let { points, gpxData, params } = req.body;

        // Si on a du GPX brut, on le parse
        if (!points && gpxData) {
            points = GpxUtils.parse(gpxData);
        }

        if (!points || !Array.isArray(points) || points.length < 2) {
            return res.status(400).json({ error: 'Données de parcours (points ou gpxData) manquantes ou invalides' });
        }

        // Récupérer le profil utilisateur pour VDOT et poids
        const user = await dbGetMain('SELECT profile_data FROM users WHERE id = ?', [req.user.id]);
        let vdot = 40, weight = 70;
        
        if (user?.profile_data) {
            try {
                const p = JSON.parse(user.profile_data);
                vdot = p.vdot || p.vma_vdot || 40;
                weight = p.weight || 70;
            } catch (e) {
                logger.warn('Failed to parse user profile for race strategy', { error: e.message });
            }
        }

        const strategy = RaceStrategy.generatePlan(points, { vdot, weight }, params || {});

        if (!strategy) {
            return res.status(500).json({ error: 'Impossible de générer la stratégie' });
        }

        res.json(strategy);
    } catch (error) {
        logger.error('Race strategy generation error', { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Erreur lors de la génération de la stratégie de course' });
    }
});

module.exports = router;
