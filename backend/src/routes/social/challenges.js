'use strict';
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../auth');
const social = require('../../services/social.service');
const { dbAllMain } = require('../../database');
const { logger } = require('../../utils/logger');

const dbAll = (q, p) => dbAllMain(q, p);

router.post('/challenges', verifyToken, async (req, res) => {
    try {
        const {
            title, name, description, type = 'distance', target_value, target, end_date,
            challenge_mode = 'quota', milestones, weekly_target, weekly_increase_pct = 10,
            streak_days, frequency_per_week, sport_type = 'any', badge_icon = '🏆',
            is_public = true, max_participants = null,
        } = req.body;

        const challengeTitle = title || name;
        if (!challengeTitle) {
            return res.status(400).json({ error: 'title is required' });
        }

        let durationDays = 30;
        if (end_date) {
            const diff = new Date(end_date) - new Date();
            durationDays = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        }

         // Determine target unit based on type
         const unitMap = { distance: 'km', elevation: 'm', time: 'min', activities: 'sorties', pace: 'min/km', frequency: 'séances/sem' };
         // eslint-disable-next-line security/detect-object-injection
         const targetUnit = unitMap[type] || 'km';

        const result = await social.createChallenge(
            req.user.id,
            challengeTitle,
            description || '',
            type,
            parseFloat(target_value || target) || 0,
            targetUnit,
            durationDays,
            is_public !== false,
            max_participants || null,
            {
                challengeMode: challenge_mode,
                milestones: milestones || null,
                weeklyTarget: weekly_target || null,
                weeklyIncreasePct: weekly_increase_pct,
                streakDays: streak_days || null,
                frequencyPerWeek: frequency_per_week || null,
                sportType: sport_type,
                badgeIcon: badge_icon,
            }
        );
        res.status(201).json(result);
    } catch (error) {
        logger.error('Create challenge error:', { error: error.message });
        res.status(500).json({ error: 'Failed to create challenge' });
    }
});

router.get('/challenges/public', verifyToken, async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        try {
            const challenges = await dbAll(`
                SELECT c.*,
                    (SELECT COUNT(*) FROM user_challenges WHERE challenge_id = c.id) as participant_count,
                    json_extract(u.profile_data, '$.name') as creator_name
                FROM challenges c
                LEFT JOIN users u ON c.created_by = u.id
                WHERE c.is_public = 1
                ORDER BY c.created_at DESC
                LIMIT ?
            `, [parseInt(limit)]);
            res.json(challenges);
        } catch (_) {
            res.json([]);
        }
    } catch (error) {
        logger.error('Get public challenges error:', { error: error.message });
        res.status(500).json({ error: 'Failed to get challenges' });
    }
});

router.get('/challenges/user', verifyToken, async (req, res) => {
    try {
        try {
            const challenges = await social.getUserChallenges(req.user.id);
            res.json({ success: true, challenges });
        } catch (_) {
            res.json({ success: true, challenges: [] });
        }
    } catch (error) {
        logger.error('Get user challenges error:', { error: error.message });
        res.status(500).json({ error: 'Failed to get user challenges' });
    }
});

router.post('/challenges/:id/join', verifyToken, async (req, res) => {
    try {
        const challengeId = parseInt(req.params.id);
        if (!challengeId || challengeId <= 0) {
            return res.status(400).json({ error: 'Invalid challenge ID' });
        }
        try {
            const result = await social.joinChallenge(req.user.id, challengeId);
            res.json(result);
        } catch (_) {
            res.status(500).json({ error: 'Failed to join challenge' });
        }
    } catch (error) {
        logger.error('Join challenge error:', { error: error.message });
        res.status(500).json({ error: 'Failed to join challenge' });
    }
});

router.get('/challenges/:id', verifyToken, async (req, res) => {
    try {
        const challengeId = parseInt(req.params.id);
        if (!challengeId || challengeId <= 0) {
            return res.status(400).json({ error: 'Invalid challenge ID' });
        }
        try {
            const challenge = await social.getChallengeDetails(challengeId);
            if (!challenge) {
                return res.status(404).json({ error: 'Challenge not found' });
            }
            res.json({ success: true, challenge });
        } catch (_) {
            res.status(404).json({ error: 'Challenge not found' });
        }
    } catch (error) {
        logger.error('Get challenge error:', { error: error.message });
        res.status(500).json({ error: 'Failed to get challenge' });
    }
});

router.put('/challenges/:id/progress', verifyToken, async (req, res) => {
    try {
        const challengeId = parseInt(req.params.id);
        if (!challengeId || challengeId <= 0) {
            return res.status(400).json({ error: 'Invalid challenge ID' });
        }
        const { progress } = req.body;
        if (progress === undefined || progress === null) {
            return res.status(400).json({ error: 'progress is required' });
        }
        try {
            const result = await social.updateChallengeProgress(req.user.id, challengeId, progress);
            res.json(result);
        } catch (_) {
            res.status(500).json({ error: 'Failed to update progress' });
        }
    } catch (error) {
        logger.error('Update challenge progress error:', { error: error.message });
        res.status(500).json({ error: 'Failed to update challenge progress' });
    }
});

// ============================================================
// Challenge Teams (Phase 2)
// ============================================================

router.post('/challenges/:id/teams', verifyToken, async (req, res) => {
    try {
        const challengeId = parseInt(req.params.id);
        const { name } = req.body;
        if (!challengeId || challengeId <= 0) {
            return res.status(400).json({ error: 'Invalid challenge ID' });
        }
        if (!name) {
            return res.status(400).json({ error: 'Team name is required' });
        }
        try {
            const result = await social.createChallengeTeam(req.user.id, challengeId, name);
            res.status(201).json(result);
        } catch (_) {
            res.status(500).json({ error: 'Failed to create team' });
        }
    } catch (error) {
        logger.error('Create challenge team error:', { error: error.message });
        res.status(500).json({ error: 'Failed to create team' });
    }
});

router.post('/challenges/teams/:teamId/join', verifyToken, async (req, res) => {
    try {
        const teamId = parseInt(req.params.teamId);
        if (!teamId || teamId <= 0) {
            return res.status(400).json({ error: 'Invalid team ID' });
        }
        try {
            const result = await social.joinChallengeTeam(req.user.id, teamId);
            res.json(result);
        } catch (_) {
            res.status(500).json({ error: 'Failed to join team' });
        }
    } catch (error) {
        logger.error('Join challenge team error:', { error: error.message });
        res.status(500).json({ error: 'Failed to join team' });
    }
});

router.get('/challenges/:id/teams', verifyToken, async (req, res) => {
    try {
        const challengeId = parseInt(req.params.id);
        if (!challengeId || challengeId <= 0) {
            return res.status(400).json({ error: 'Invalid challenge ID' });
        }
        try {
            const teams = await social.getChallengeTeams(challengeId);
            res.json({ success: true, teams });
        } catch (_) {
            res.json({ success: true, teams: [] });
        }
    } catch (error) {
        logger.error('Get challenge teams error:', { error: error.message });
        res.status(500).json({ error: 'Failed to get teams' });
    }
});

module.exports = router;
