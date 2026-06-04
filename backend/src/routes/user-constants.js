/* eslint-disable no-empty */
/**
 * ============================================================
 * USER CONSTANTS ROUTES
 * ============================================================
 * Endpoint unifié qui retourne toutes les constantes utilisateur
 * (VDOT, zones FC, allures d'entraînement, profil, etc.)
 * 
 * Source de vérité unique : tout vient de resolveUserConstants()
 * pour garantir des valeurs identiques sur tous les écrans.
 */

'use strict';

const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { Cardiovascular, RunningPerformance } = require('../algorithms/index');
const { resolveUserConstants } = require('../services/userConstants.service');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/user/constants
 * Retourne toutes les constantes utilisateur, résolues via le service unifié.
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        const constants = await resolveUserConstants(req.user.id);

        const hrZones = Cardiovascular.calculateKarvonenZones(constants.age, constants.restingHR, constants.sex);
        const hrPercentZones = Cardiovascular.calculatePercentZones(constants.fcm);

        const speedZones = constants.vma
            ? RunningPerformance.calculateSpeedZones(constants.vma)
            : null;

        const trainingPaces = constants.vdot
            ? RunningPerformance.getTrainingPaces(constants.vdot)
            : null;

        res.json({
            profile: {
                age: constants.age,
                fcm: constants.fcm,
                restingHR: constants.restingHR,
                sex: constants.sex,
                weight: constants.weight,
                vma: constants.vma,
                vdot: constants.vdot,
                vo2max: constants.vo2max,
                ftp: null,
                calculatedFcm: Cardiovascular.calculateMaxHR(constants.age),
            },
            zones: {
                hrZones,
                hrPercentZones,
                speedZones,
                trainingPaces,
                fcm: constants.fcm,
                vma: constants.vma || 0,
                vdot: constants.vdot || 0,
            },
            sources: {
                fcm: constants.fcmSource,
                vma: constants.vmaSource,
                vdot: constants.vdotSource,
                vo2max: constants.vo2maxSource,
                restingHR: constants.restingHRSource,
                age: constants.age ? 'user' : 'default',
            },
        });
    } catch (error) {
        logger.error('[UserConstants] Error:', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch user constants' });
    }
});

module.exports = router;
