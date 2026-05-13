const { dbGetMain, getUserDb, dbAllUser, dbGetUser } = require('../../database');
const { resolveUserConstants } = require('../userConstants.service');
const { RunningPerformance } = require('../../algorithms');
const { getActivePlan } = require('./session.service');

async function getCoachProfile(userId) {
    const user = await dbGetMain('SELECT id, email, name FROM users WHERE id = ?', [userId]);
    const userDb = await getUserDb(userId);

    const constants = await resolveUserConstants(userId);

    const since90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const recentActivities = await dbAllUser(userDb, `
        SELECT distance, moving_time, average_speed, start_date
        FROM activities
        WHERE start_date >= ? AND type IN ('run','Run','running','Running')
        ORDER BY start_date DESC
    `, [since90]).catch(() => []);

    const totalKm = recentActivities.reduce((s, a) => s + (a.distance || 0) / 1000, 0);
    const weeks = Math.max(1, recentActivities.length / (recentActivities.length > 20 ? 5 : 3));
    const weeklyKm = Math.round(totalKm / weeks);

    let pace = null;
    if (constants.vdot) {
        const paces = RunningPerformance.getTrainingPaces(constants.vdot);
        if (paces?.easy?.pace) pace = paces.easy.pace;
    }
    if (!pace && recentActivities.length > 0) {
        const avgSpeed = recentActivities.reduce((s, a) => s + (a.average_speed || 0), 0) / recentActivities.length;
        if (avgSpeed > 0) {
            const minPerKm = 60 / (avgSpeed * 3.6);
            const min = Math.floor(minPerKm);
            const sec = Math.round((minPerKm - min) * 60);
            pace = `${min}:${sec.toString().padStart(2, '0')} min/km`;
        }
    }

    const profile = {
        vdot: constants.vdot,
        vma: constants.vma,
        fcm: constants.fcm,
        resting_hr: constants.restingHR,
        age: constants.age,
        sex: constants.sex,
        weight: constants.weight,
        weeklyKm: weeklyKm > 0 ? weeklyKm : null,
        pace,
    };

    const plan = await getActivePlan(userId);

    return {
        user,
        profile,
        activePlan: plan,
        hasActivePlan: !!plan
    };
}

async function getGamification(userId, planId) {
    const userDb = await getUserDb(userId);
    const plan = await dbGetUser(userDb,
        'SELECT * FROM training_plans WHERE id = ? AND user_id = ?',
        [planId, userId]
    );
    if (!plan) return null;

    const sessions = await dbAllUser(userDb,
        'SELECT * FROM training_sessions WHERE plan_id = ? AND user_id = ?',
        [planId, userId]
    );

    const completedSessions = sessions.filter(s => s.completed || s.status === 'completed');
    const totalKm = completedSessions.reduce((s, sess) => s + (sess.actual_distance || sess.target_distance || 0) / 1000, 0);
    const totalHours = completedSessions.reduce((s, sess) => s + (sess.actual_time || sess.target_duration || 0) / 3600, 0);

    let currentStreak = 0;
    let longestStreak = 0;
    let streak = 0;
    for (const _s of completedSessions) {
        streak++;
        if (streak > longestStreak) longestStreak = streak;
    }
    currentStreak = streak;

    const xp = completedSessions.length * 100 + Math.round(totalKm * 10);
    const xpToNext = 1000;
    const level = Math.floor(xp / xpToNext) + 1;
    const levelTitles = ['Débutant', 'Coureur', 'Athlète', 'Champion', 'Élite'];
    const levelTitle = levelTitles[Math.min(level - 1, levelTitles.length - 1)];

    const badges = [];
    if (completedSessions.length >= 1) badges.push({ id: 'first_session', name: 'Première séance', description: 'Complétez votre première séance', icon: 'star', earnedAt: completedSessions[0]?.completion_date || new Date().toISOString() });
    if (completedSessions.length >= 5) badges.push({ id: 'five_sessions', name: '5 séances', description: 'Complétez 5 séances', icon: 'flame', earnedAt: completedSessions[4]?.completion_date || new Date().toISOString() });
    if (totalKm >= 50) badges.push({ id: 'fifty_km', name: '50 km', description: 'Courez 50 km au total', icon: 'trophy', earnedAt: new Date().toISOString() });
    if (completedSessions.length >= 10) badges.push({ id: 'ten_sessions', name: '10 séances', description: 'Complétez 10 séances', icon: 'medal', earnedAt: completedSessions[9]?.completion_date || new Date().toISOString() });

    const achievements = [
        { id: 'sessions_10', name: '10 séances', progress: Math.min(completedSessions.length, 10), target: 10, unlocked: completedSessions.length >= 10 },
        { id: 'km_100', name: '100 km', progress: Math.min(Math.round(totalKm), 100), target: 100, unlocked: totalKm >= 100 },
        { id: 'streak_7', name: 'Série de 7', progress: Math.min(currentStreak, 7), target: 7, unlocked: currentStreak >= 7 },
    ];

    return {
        planId,
        badges,
        streaks: {
            current: currentStreak,
            longest: longestStreak,
            lastActiveDate: completedSessions.length > 0
                ? (completedSessions[completedSessions.length - 1].completion_date || new Date().toISOString())
                : new Date().toISOString(),
        },
        achievements,
        level: {
            current: level,
            xp: xp % xpToNext,
            xpToNext,
            title: levelTitle,
        },
        stats: {
            totalKm: Math.round(totalKm * 10) / 10,
            totalHours: Math.round(totalHours * 10) / 10,
            totalSessions: completedSessions.length,
        },
    };
}

async function addExternalEvent(userId, { eventType = 'other', date, description: _description = '', impact = 'low' }) {
    const userDb = await getUserDb(userId);

    const eventDate = new Date(date || new Date());
    const windowStart = new Date(eventDate);
    windowStart.setDate(windowStart.getDate() - 3);
    const windowEnd = new Date(eventDate);
    windowEnd.setDate(windowEnd.getDate() + 3);

    const affectedSessions = await dbAllUser(userDb, `
        SELECT id FROM training_sessions
        WHERE user_id = ? AND scheduled_date BETWEEN ? AND ? AND completed = 0
    `, [userId, windowStart.toISOString().split('T')[0], windowEnd.toISOString().split('T')[0]]);

    const planAdjustments = [];
    if (impact === 'high' && affectedSessions.length > 0) {
        planAdjustments.push(`${affectedSessions.length} séance(s) dans la fenêtre de l'événement`);
        planAdjustments.push('Réduction de l\'intensité recommandée');
    }

    return {
        success: true,
        message: `Événement "${eventType}" enregistré pour le ${date || 'aujourd\'hui'}`,
        affectedSessions: affectedSessions.map(s => s.id),
        planAdjustments,
    };
}

module.exports = {
    getCoachProfile,
    getGamification,
    addExternalEvent,
};
