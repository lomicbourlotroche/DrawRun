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
