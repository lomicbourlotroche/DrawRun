'use strict';

const { dbGetMain, dbRunMain, dbAllMain } = require('../../database');
const dbGet = (q, p) => dbGetMain(q, p);
const dbRun = (q, p) => dbRunMain(q, p);
const dbAll = (q, p) => dbAllMain(q, p);

async function createChallenge(userId, title, description, type, targetValue, targetUnit, durationDays, isPublic = true, maxParticipants = null, options = {}) {
    const {
        challengeMode = 'quota',
        milestones = null,
        weeklyTarget = null,
        weeklyIncreasePct = 10,
        streakDays = null,
        frequencyPerWeek = null,
        sportType = 'any',
        badgeIcon = '🏆',
        groupId = null,
    } = options;

    const defaultMilestones = JSON.stringify([
        { pct: 25, label: 'Bronze', icon: '🥉' },
        { pct: 50, label: 'Argent', icon: '🥈' },
        { pct: 75, label: 'Or', icon: '🥇' },
        { pct: 100, label: 'Légendaire', icon: '💎' },
    ]);

    const result = await dbRun(`
        INSERT INTO challenges (
            title, description, type, target_value, target_unit, duration_days,
            created_by, is_public, max_participants,
            challenge_mode, milestones, weekly_target, weekly_increase_pct,
            streak_days, frequency_per_week, sport_type, badge_icon, group_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        title, description || '', type, targetValue, targetUnit, durationDays,
        userId, isPublic ? 1 : 0, maxParticipants,
        challengeMode,
        milestones ? JSON.stringify(milestones) : defaultMilestones,
        weeklyTarget,
        weeklyIncreasePct,
        streakDays,
        frequencyPerWeek,
        sportType,
        badgeIcon,
        groupId,
    ]);

    const challengeId = result.lastID;

    await dbRun(`
        INSERT INTO user_challenges (user_id, challenge_id, start_date, end_date, progress, status)
        VALUES (?, ?, datetime('now'), datetime('now', '+' || ? || ' days'), 0, 'active')
    `, [userId, challengeId, durationDays]);

    return { success: true, challengeId };
}

async function joinChallenge(userId, challengeId) {
    
    
    const challenge = await dbGet(`SELECT * FROM challenges WHERE id = ?`, [challengeId]);
    if (!challenge) return { success: false, error: 'Challenge not found' };
    
    if (challenge.max_participants) {
        const count = await dbGet(`SELECT COUNT(*) as count FROM user_challenges WHERE challenge_id = ?`, [challengeId]);
        if (count.count >= challenge.max_participants) {
            return { success: false, error: 'Challenge is full' };
        }
    }
    
    const duration = challenge.duration_days || 30;
    await dbRun(`
        INSERT INTO user_challenges (user_id, challenge_id, start_date, end_date, progress, status)
        VALUES (?, ?, datetime('now'), datetime('now', '+' || ? || ' days'), 0, 'active')
    `, [userId, challengeId, duration]);
    
    return { success: true };
}

async function updateChallengeProgress(userId, challengeId, progress) {
    
    
    await dbRun(`
        UPDATE user_challenges 
        SET progress = ?, status = CASE WHEN ? >= 100 THEN 'completed' ELSE status END
        WHERE user_id = ? AND challenge_id = ?
    `, [progress, progress, userId, challengeId]);
    
    return { success: true };
}

async function getUserChallenges(userId) {
    
    return await dbAll(`
        SELECT c.*, uc.progress, uc.status as user_status, uc.start_date, uc.end_date
        FROM challenges c
        JOIN user_challenges uc ON c.id = uc.challenge_id
        WHERE uc.user_id = ?
        ORDER BY uc.start_date DESC
    `, [userId]);
}

async function getPublicChallenges() {
    
    return await dbAll(`
        SELECT c.*, 
            (SELECT COUNT(*) FROM user_challenges WHERE challenge_id = c.id) as participant_count
        FROM challenges c
        WHERE c.is_public = 1 AND c.end_date > datetime('now')
        ORDER BY c.created_at DESC
    `);
}

async function getChallengeDetails(challengeId) {
    
    
    const challenge = await dbGet(`SELECT * FROM challenges WHERE id = ?`, [challengeId]);
    if (!challenge) return null;
    
    const participants = await dbAll(`
        SELECT uc.*, u.name
        FROM user_challenges uc
        LEFT JOIN users u ON uc.user_id = u.id
        WHERE uc.challenge_id = ?
        ORDER BY uc.progress DESC
    `, [challengeId]);
    
    return { ...challenge, participants };
}

async function getGroupChallenges(groupId) {
    return await dbAll(`
        SELECT c.*,
            (SELECT COUNT(*) FROM user_challenges WHERE challenge_id = c.id) as participant_count,
            json_extract(u.profile_data, '$.name') as creator_name
        FROM challenges c
        LEFT JOIN users u ON c.created_by = u.id
        WHERE c.group_id = ?
        ORDER BY c.created_at DESC
    `, [groupId]);
}

// ============================================================
// PHASE 2: CHALLENGE TEAMS
// ============================================================

async function createChallengeTeam(userId, challengeId, teamName) {
    
    
    
    // Check if user is part of the challenge
    const userChallenge = await dbGet(`
        SELECT * FROM user_challenges 
        WHERE user_id = ? AND challenge_id = ?
    `, [userId, challengeId]);
    
    if (!userChallenge) {
        return { success: false, error: 'You must join the challenge first' };
    }
    
    // Check if challenge is a team challenge
    const challenge = await dbGet(`SELECT * FROM challenges WHERE id = ?`, [challengeId]);
    if (!challenge.is_team) {
        return { success: false, error: 'This is not a team challenge' };
    }
    
    // Create team
    const result = await dbRun(`
        INSERT INTO challenge_teams (challenge_id, name, created_by)
        VALUES (?, ?, ?)
    `, [challengeId, teamName, userId]);
    
    const teamId = result.lastID;
    
    // Add creator to team
    await dbRun(`
        INSERT INTO challenge_team_members (team_id, user_id)
        VALUES (?, ?)
    `, [teamId, userId]);
    
    // Update user challenge with team
    await dbRun(`
        UPDATE user_challenges 
        SET team_id = ?
        WHERE user_id = ? AND challenge_id = ?
    `, [teamId, userId, challengeId]);
    
    const team = await dbGet(`
        SELECT ct.*, NULL as email, NULL as creator_name
        FROM challenge_teams ct
        WHERE ct.id = ?
    `, [teamId]);
    
    return { success: true, team };
}

async function joinChallengeTeam(userId, teamId) {
    
    
    
    // Check if team exists
    const team = await dbGet(`SELECT * FROM challenge_teams WHERE id = ?`, [teamId]);
    if (!team) {
        return { success: false, error: 'Team not found' };
    }
    
    // Check if user is part of the challenge
    const userChallenge = await dbGet(`
        SELECT * FROM user_challenges 
        WHERE user_id = ? AND challenge_id = ?
    `, [userId, team.challenge_id]);
    
    if (!userChallenge) {
        return { success: false, error: 'You must join the challenge first' };
    }
    
    // Check if team is full
    if (team.max_members) {
        const memberCount = await dbGet(`
            SELECT COUNT(*) as count FROM challenge_team_members WHERE team_id = ?
        `, [teamId]);
        
        if (memberCount.count >= team.max_members) {
            return { success: false, error: 'Team is full' };
        }
    }
    
    // Check if already in a team for this challenge
    if (userChallenge.team_id) {
        return { success: false, error: 'You are already in a team for this challenge' };
    }
    
    // Join team
    await dbRun(`
        INSERT INTO challenge_team_members (team_id, user_id)
        VALUES (?, ?)
    `, [teamId, userId]);
    
    // Update user challenge with team
    await dbRun(`
        UPDATE user_challenges 
        SET team_id = ?
        WHERE user_id = ? AND challenge_id = ?
    `, [teamId, userId, team.challenge_id]);
    
    return { success: true, message: 'Joined team successfully' };
}

async function getChallengeTeams(challengeId) {
    
    
    
    const teams = await dbAll(`
        SELECT ct.*, 
               (SELECT COUNT(*) FROM challenge_team_members WHERE team_id = ct.id) as member_count,
               (SELECT SUM(progress) FROM user_challenges WHERE team_id = ct.id) as team_progress
        FROM challenge_teams ct
        WHERE ct.challenge_id = ?
        ORDER BY team_progress DESC
    `, [challengeId]);
    
    return teams;
}

// ============================================================
// PHASE 2: BADGES & XP
// ============================================================

async function createBadge(name, description, icon, xpReward, criteria) {
    
    
    const result = await dbRun(`
        INSERT INTO badges (name, description, icon, xp_reward, criteria)
        VALUES (?, ?, ?, ?, ?)
    `, [name, description, icon, xpReward, criteria]);
    
    const badge = await dbGet(`SELECT * FROM badges WHERE id = ?`, result.lastID);
    
    return { success: true, badge };
}

async function awardBadge(userId, badgeId) {
    
    
    
    // Check if badge exists
    const badge = await dbGet(`SELECT * FROM badges WHERE id = ?`, [badgeId]);
    if (!badge) {
        return { success: false, error: 'Badge not found' };
    }
    
    // Check if already awarded
    const existing = await dbGet(`
        SELECT * FROM user_badges WHERE user_id = ? AND badge_id = ?
    `, [userId, badgeId]);
    
    if (existing) {
        return { success: false, error: 'Badge already awarded' };
    }
    
    // Award badge
    await dbRun(`
        INSERT INTO user_badges (user_id, badge_id)
        VALUES (?, ?)
    `, [userId, badgeId]);
    
    // Award XP
    await addXP(userId, badge.xp_reward);
    
    return { success: true, message: 'Badge awarded' };
}

async function getUserBadges(userId) {
    
    
    
    const badges = await dbAll(`
        SELECT b.*, ub.earned_at
        FROM user_badges ub
        JOIN badges b ON ub.badge_id = b.id
        WHERE ub.user_id = ?
        ORDER BY ub.earned_at DESC
    `, [userId]);
    
    return badges;
}

async function addXP(userId, xp) {
    
    
    
    // Check if user has XP record
    let userXP = await dbGet(`SELECT * FROM user_xp WHERE user_id = ?`, [userId]);
    
    if (!userXP) {
        // Create new record
        await dbRun(`
            INSERT INTO user_xp (user_id, total_xp, level)
            VALUES (?, ?, ?)
        `, [userId, xp, Math.floor(xp / 100) + 1]);
    } else {
        // Update existing record
        const newTotalXP = userXP.total_xp + xp;
        const newLevel = Math.floor(newTotalXP / 100) + 1;
        
        await dbRun(`
            UPDATE user_xp 
            SET total_xp = ?, level = ?, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
        `, [newTotalXP, newLevel, userId]);
    }
    
    return { success: true };
}

async function getUserLevel(userId) {
    
    
    
    let userXP = await dbGet(`SELECT * FROM user_xp WHERE user_id = ?`, [userId]);
    
    if (!userXP) {
        return { level: 1, total_xp: 0, xp_to_next_level: 100 };
    }
    
    const xpToNextLevel = (userXP.level * 100) - userXP.total_xp;
    
    return {
        level: userXP.level,
        total_xp: userXP.total_xp,
        xp_to_next_level: Math.max(0, xpToNextLevel)
    };
}

module.exports = {
    createChallenge,
    joinChallenge,
    updateChallengeProgress,
    getUserChallenges,
    getPublicChallenges,
    getChallengeDetails,
    getGroupChallenges,
    createChallengeTeam,
    joinChallengeTeam,
    getChallengeTeams,
    createBadge,
    awardBadge,
    getUserBadges,
    addXP,
    getUserLevel,
};
