/* eslint-disable no-empty */
/**
 * ============================================================
 * USER CONSTANTS ROUTES
 * ============================================================
 * Endpoint unifié qui retourne toutes les constantes utilisateur
 * (VDOT, zones FC, allures d'entraînement, profil, etc.)
 * en une seule requête.
 */

'use strict';

const express = require('express');
const { verifyToken } = require('../auth');
const { dbGetMain, getUserDb, dbGetUser } = require('../database');
const { Cardiovascular, RunningPerformance } = require('../algorithms/index');
const { logger } = require('../logger');

const router = express.Router();

/**
 * GET /api/user/constants
 * Retourne toutes les constantes utilisateur calculées à partir du profil.
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Get profile from main.db
        const user = await dbGetMain(
            'SELECT profile_data FROM users WHERE id = ?',
            [userId]
        );

        let profileData = {};
        if (user?.profile_data) {
            try {
                profileData = JSON.parse(user.profile_data);
            } catch (_) {}
        }

        // Extract profile values with defaults
        const age = profileData.age || 30;
        const fcm = profileData.fcm || Cardiovascular.calculateMaxHR(age);
        const restingHR = profileData.restingHR || 60;
        const sex = profileData.sex || 'M';
        const weight = profileData.weight || 70;
        const vma = profileData.vma || null;
        const vdot = profileData.vdot || null;
        const ftp = profileData.ftp || null;

        // 2. Try to get VDOT from user_profiles table if not in profile_data
        let effectiveVdot = vdot;
        let effectiveVma = vma;
        try {
            const userDb = await getUserDb(userId);
            const userProfile = await dbGetUser(userDb,
                'SELECT vdot, vma FROM user_profiles WHERE user_id = ?',
                [userId]
            );
            if (userProfile) {
                effectiveVdot = userProfile.vdot || effectiveVdot;
                effectiveVma = userProfile.vma || effectiveVma;
            }
        } catch (_) {
            // User DB may not exist yet
        }

        // Calculate VMA from VDOT if not set
        if (!effectiveVma && effectiveVdot) {
            effectiveVma = (effectiveVdot - 2.209) / 3.5;
        }

        // 3. Calculate HR zones
        const hrZones = Cardiovascular.calculateKarvonenZones(age, restingHR, sex);
        const hrPercentZones = Cardiovascular.calculatePercentZones(fcm);

        // 4. Calculate speed zones if VMA available
        const speedZones = effectiveVma
            ? RunningPerformance.calculateSpeedZones(effectiveVma)
            : null;

        // 5. Calculate training paces if VDOT available
        const trainingPaces = effectiveVdot
            ? RunningPerformance.getTrainingPaces(effectiveVdot)
            : null;

        // 6. Calculate FCM from Tanaka formula
        const calculatedFcm = Cardiovascular.calculateMaxHR(age);

        res.json({
            profile: {
                age,
                fcm,
                restingHR,
                sex,
                weight,
                vma: effectiveVma,
                vdot: effectiveVdot,
                ftp,
                calculatedFcm,
            },
            zones: {
                hrZones,
                hrPercentZones,
                speedZones,
                trainingPaces,
            },
            // Indicate which values are user-set vs calculated
            sources: {
                fcm: profileData.fcm ? 'user' : 'calculated',
                vma: profileData.vma ? 'user' : (effectiveVdot ? 'derived_from_vdot' : 'unknown'),
                vdot: profileData.vdot ? 'user' : 'unknown',
                restingHR: profileData.restingHR ? 'user' : 'default',
                age: profileData.age ? 'user' : 'default',
            },
        });
    } catch (error) {
        logger.error('[UserConstants] Error:', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch user constants' });
    }
});

module.exports = router;
