/* eslint-disable security/detect-object-injection, unused-imports/no-unused-vars */
/**
 * ============================================================
 * COACH ROUTES (Express)
 * ============================================================
 * Routes API pour le coaching adaptatif
 * 
 * Note: Les fonctions métier sont dans coach_plan.js et services/coach.service.js
 */

'use strict';

const express = require('express');
const { verifyToken } = require('../auth');
const coachPlan = require('../coach_plan');
const { validateBody, validatePlanBody } = require('../validators');
const { logger } = require('../logger');

const router = express.Router();

// ============================================================================
// WIZARD DEFAULTS — pré-remplissage depuis les données utilisateur
// ============================================================================

router.get('/wizard-defaults', verifyToken, async (req, res) => {
    try {
        const { dbGetMain, getUserDb, dbAllUser, dbGetUser } = require('../database');
        const { RunningPerformance, PMC } = require('../algorithms');

        // Profil utilisateur (FCM, VDOT, VMA, poids)
        const user = await dbGetMain(
            'SELECT profile_data FROM users WHERE id = ?',
            [req.user.id]
        );
        let fcm = null, vdot = null, vma = null, weight = null;
        if (user?.profile_data) {
            try {
                const p = JSON.parse(user.profile_data);
                fcm  = p.fcm  || p.max_heart_rate  || null;
                vdot = p.vdot || null;
                vma  = p.vma  || null;
                weight = p.weight || null;
            } catch { /* ignore */ }
        }

        // Activités des 90 derniers jours
        const userDb = await getUserDb(req.user.id);
        const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const activities = await dbAllUser(userDb,
            `SELECT distance, moving_time, average_heartrate, max_heartrate,
                    average_speed, start_date, type, tss
             FROM activities
             WHERE start_date >= ? AND type IN ('run','Run','running','Running')
             ORDER BY start_date DESC
             LIMIT 100`,
            [since]
        );

        const defaults = {};

        if (activities.length === 0) {
            return res.json({ defaults: {}, message: 'Aucune activité récente trouvée' });
        }

        // 1. Volume hebdomadaire moyen (km/semaine)
        const totalKm = activities.reduce((s, a) => s + (a.distance || 0) / 1000, 0);
        const weeks = Math.max(1, activities.length / (activities.length > 20 ? 5 : 3));
        defaults.currentWeeklyKm = Math.round(totalKm / weeks);

        // 2. Niveau d'expérience déduit du volume
        if (defaults.currentWeeklyKm >= 60) defaults.experienceLevel = 'advanced';
        else if (defaults.currentWeeklyKm >= 25) defaults.experienceLevel = 'intermediate';
        else defaults.experienceLevel = 'beginner';

        // 3. FCM depuis les activités si pas dans le profil
        if (!fcm) {
            const maxHRs = activities.map(a => a.max_heartrate).filter(Boolean);
            if (maxHRs.length > 0) {
                fcm = Math.max(...maxHRs);
            }
        }
        if (fcm) defaults.fcm = fcm;

        // 4. VDOT estimé depuis la meilleure performance récente
        if (!vdot) {
            // Chercher la meilleure performance sur une distance ≥ 3km
            const goodRuns = activities
                .filter(a => a.distance >= 3000 && a.moving_time > 0)
                .map(a => ({
                    distKm: a.distance / 1000,
                    timeMin: a.moving_time / 60,
                    vdot: RunningPerformance.estimateVDOT
                        ? RunningPerformance.estimateVDOT(a.distance / 1000, a.moving_time / 60)
                        : null,
                }))
                .filter(r => r.vdot && r.vdot > 20);

            if (goodRuns.length > 0) {
                vdot = Math.max(...goodRuns.map(r => r.vdot));
                vdot = Math.round(vdot * 10) / 10;
            }
        }
        if (vdot) {
            defaults.vdotValue = vdot;
            defaults.hasVDOT = true;
        }

        // 5. VMA estimée depuis VDOT (VDOT ≈ VMA * 0.82 pour coureurs moyens)
        if (!vma && vdot) {
            vma = Math.round(vdot / 0.82 * 10) / 10;
        }
        if (vma) {
            defaults.vmaValue = vma;
            defaults.hasVMA = true;
        }

        // 6. Jours d'entraînement préférés (jours où l'utilisateur court le plus)
        const dayCount = {};
        activities.forEach(a => {
            const d = new Date(a.start_date).getDay();
            dayCount[d] = (dayCount[d] || 0) + 1;
        });
        const sortedDays = Object.entries(dayCount)
            .sort((a, b) => b[1] - a[1])
            .map(([day]) => day);
        if (sortedDays.length > 0) {
            defaults.trainingDays = sortedDays.slice(0, 4);
        }

        // 7. Nombre de séances par semaine (médiane des semaines récentes)
        const sessionsByWeek = {};
        activities.forEach(a => {
            const d = new Date(a.start_date);
            const weekKey = `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`;
            sessionsByWeek[weekKey] = (sessionsByWeek[weekKey] || 0) + 1;
        });
        const weekCounts = Object.values(sessionsByWeek);
        if (weekCounts.length > 0) {
            const sorted = weekCounts.sort((a, b) => a - b);
            const median = sorted[Math.floor(sorted.length / 2)];
            const clamped = Math.min(6, Math.max(2, Math.round(median)));
            defaults.sessionsPerWeek = String(clamped);
        }

        // 8. Durée moyenne par séance → availableTimePerSession
        const avgDurationMin = activities.reduce((s, a) => s + (a.moving_time || 0), 0) / activities.length / 60;
        if (avgDurationMin < 30) defaults.availableTimePerSession = '20';
        else if (avgDurationMin < 45) defaults.availableTimePerSession = '30';
        else if (avgDurationMin < 65) defaults.availableTimePerSession = '45';
        else defaults.availableTimePerSession = '60';

        // 9. Équipement déduit (si FC disponible → montre cardio)
        const hasHR = activities.some(a => a.average_heartrate);
        defaults.equipment = hasHR ? 'hrm' : 'watch';

        res.json({ defaults, activitiesAnalyzed: activities.length });
    } catch (error) {
        logger.error('Wizard defaults error', { error: error.message });
        res.status(500).json({ error: 'Failed to compute wizard defaults' });
    }
});

// ============================================================================
// COACH PROFILE
// ============================================================================

router.get('/profile', verifyToken, async (req, res) => {
    try {
        const profile = await coachPlan.getCoachProfile(req.user.id);
        res.json(profile);
    } catch (error) {
        logger.error('Get coach profile error', { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Failed to fetch coach profile' });
    }
});

// ============================================================================
// TRAINING PLANS
// ============================================================================

router.post('/start-plan', verifyToken, validateBody(validatePlanBody), async (req, res) => {
    try {
        const result = await coachPlan.createTrainingPlan(req.user.id, req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create training plan' });
    }
});

// Generate plan (legacy/simple version)
router.post('/plan', verifyToken, async (req, res) => {
    try {
        const { type = 'endurance', level = 'intermediate', weeks = 4 } = req.body;
        const result = await coachPlan.createTrainingPlan(req.user.id, {
            type,
            level,
            weeks
        });
        res.json(result);
    } catch (error) {
        logger.error('Generate plan error', { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Failed to generate plan' });
    }
});

// Generate plan (alias for frontend compatibility)
router.post('/generate-plan', verifyToken, async (req, res) => {
    try {
        const { target, vdot, weeklyKm, includePPG = false } = req.body;
        const result = await coachPlan.createTrainingPlan(req.user.id, {
            targetDistance: target ? parseFloat(target) : 0,
            vdotValue: vdot,
            currentWeeklyKm: weeklyKm,
            usePPG: includePPG,
            weeks: 8,
            sessionsPerWeek: 4,
            goals: target || 'custom'
        });
        res.json(result);
    } catch (error) {
        logger.error('Generate plan error', { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Failed to generate plan' });
    }
});

router.get('/plan', verifyToken, async (req, res) => {
    try {
        const plan = await coachPlan.getActivePlan(req.user.id);
        res.json(plan);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get plan' });
    }
});

router.get('/plan/today', verifyToken, async (req, res) => {
    try {
        const sessions = await coachPlan.getTodaySessions(req.user.id);
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get today sessions' });
    }
});

// ============================================================================
// SESSION FEEDBACK
// ============================================================================

router.post('/plan-feedback', verifyToken, async (req, res) => {
    try {
        const result = await coachPlan.markSessionCompleted(req.user.id, req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit feedback' });
    }
});

// ============================================================================
// PLAN BY ID
// ============================================================================

router.get('/plan/:id', verifyToken, async (req, res) => {
    try {
        const planId = parseInt(req.params.id);
        if (isNaN(planId)) {
            return res.status(400).json({ error: 'Invalid plan id' });
        }
        const result = await coachPlan.getPlanById(req.user.id, planId);
        if (!result) return res.status(404).json({ error: 'Plan not found' });
        res.json(result);
    } catch (error) {
        logger.error('Get plan by id error', { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Failed to get plan' });
    }
});

// ============================================================================
// PLAN PROGRESS
// ============================================================================

router.get('/progress/:id', verifyToken, async (req, res) => {
    try {
        const planId = parseInt(req.params.id);
        if (isNaN(planId)) {
            return res.status(400).json({ error: 'Invalid plan id' });
        }
        const result = await coachPlan.getPlanProgress(req.user.id, planId);
        if (!result) return res.status(404).json({ error: 'Plan not found' });
        res.json(result);
    } catch (error) {
        logger.error('Get plan progress error', { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Failed to get plan progress' });
    }
});

// ============================================================================
// GAMIFICATION
// ============================================================================

router.get('/gamification/:id', verifyToken, async (req, res) => {
    try {
        const planId = parseInt(req.params.id);
        if (isNaN(planId)) {
            return res.status(400).json({ error: 'Invalid plan id' });
        }
        const result = await coachPlan.getGamification(req.user.id, planId);
        if (!result) return res.status(404).json({ error: 'Plan not found' });
        res.json(result);
    } catch (error) {
        logger.error('Get gamification error', { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Failed to get gamification data' });
    }
});

// ============================================================================
// SESSION MISSED
// ============================================================================

router.post('/session-missed', verifyToken, async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) {
            return res.status(400).json({ error: 'Invalid sessionId' });
        }
        const result = await coachPlan.markSessionMissed(req.user.id, { sessionId });
        res.json(result);
    } catch (error) {
        logger.error('Mark session missed error', { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Failed to mark session as missed' });
    }
});

// ============================================================================
// SCHEDULE TEST
// ============================================================================

router.post('/schedule-test', verifyToken, async (req, res) => {
    try {
        const result = await coachPlan.scheduleTest(req.user.id, req.body);
        res.json(result);
    } catch (error) {
        logger.error('Schedule test error', { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Failed to schedule test' });
    }
});

// ============================================================================
// SUBMIT TEST RESULTS
// ============================================================================

router.post('/submit-test-results', verifyToken, async (req, res) => {
    try {
        const result = await coachPlan.submitTestResults(req.user.id, req.body);
        res.json(result);
    } catch (error) {
        logger.error('Submit test results error', { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Failed to submit test results' });
    }
});

// ============================================================================
// EXTERNAL EVENT
// ============================================================================

router.post('/external-event', verifyToken, async (req, res) => {
    try {
        const result = await coachPlan.addExternalEvent(req.user.id, req.body);
        res.json(result);
    } catch (error) {
        logger.error('Add external event error', { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Failed to add external event' });
    }
});

// ============================================================================
// MATCH ACTIVITY TO SESSION
// ============================================================================

router.post('/match-activity', verifyToken, async (req, res) => {
    try {
        const result = await coachPlan.matchActivityToSession(req.user.id, req.body);
        res.json(result);
    } catch (error) {
        logger.error('Match activity to session error', { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Failed to match activity to session' });
    }
});

// ============================================================================
// PENDING SESSIONS
// ============================================================================

router.get('/pending-sessions', verifyToken, async (req, res) => {
    try {
        const result = await coachPlan.getPendingSessions(req.user.id);
        res.json(result);
    } catch (error) {
        logger.error('Get pending sessions error', { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Failed to get pending sessions' });
    }
});

module.exports = router;
