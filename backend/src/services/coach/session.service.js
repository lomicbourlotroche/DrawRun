'use strict';

const { getUserDb, dbGetUser, dbRunUser, dbAllUser } = require('../../database');
const { estimateVDOTFromVMA, calculatePaces } = require('./plan.service');
const { PMC } = require('../../algorithms');

async function getActivePlan(userId) {
    const userDb = await getUserDb(userId);

    const plan = await dbGetUser(userDb, `
        SELECT * FROM training_plans 
        WHERE user_id = ? AND is_active = 1 
        ORDER BY created_at DESC LIMIT 1
    `, [userId]);
    
    if (!plan) return null;
    
    const sessions = await dbAllUser(userDb, `
        SELECT * FROM training_sessions 
        WHERE plan_id = ? AND completed = 0
        ORDER BY week_number, session_number
    `, [plan.id]);
    
    return {
        plan,
        sessions,
        planId: plan.id
    };
}

async function getPlanSessions(userId, planId, includeCompleted = false) {
    const userDb = await getUserDb(userId);

    const query = includeCompleted
        ? 'SELECT * FROM training_sessions WHERE plan_id = ? ORDER BY week_number, session_number'
        : 'SELECT * FROM training_sessions WHERE plan_id = ? AND completed = 0 ORDER BY week_number, session_number';
    
    return await dbAllUser(userDb, query, [planId]);
}

async function markSessionCompleted(userId, sessionId, feedback = {}) {
    const { actualDistance, actualDuration, actualAvgHR, actualMaxHR, rpe: _rpe, notes } = feedback;
    const userDb = await getUserDb(userId);
    
    await dbRunUser(userDb, `
        UPDATE training_sessions SET
            completed = 1,
            completion_date = datetime('now'),
            actual_distance = ?,
            actual_time = ?,
            actual_avg_hr = ?,
            actual_max_hr = ?,
            actual_notes = ?
        WHERE id = ? AND user_id = ?
    `, [
        actualDistance || null,
        actualDuration || null,
        actualAvgHR || null,
        actualMaxHR || null,
        notes || null,
        sessionId,
        userId
    ]);
    
    return { success: true };
}

async function getTodaySessions(userId) {
    const today = new Date();
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
    const userDb = await getUserDb(userId);
    
    return await dbAllUser(userDb, `
        SELECT ts.*, tp.name as plan_name
        FROM training_sessions ts
        JOIN training_plans tp ON ts.plan_id = tp.id
        WHERE tp.user_id = ? AND tp.is_active = 1 
        AND ts.completed = 0
        AND ts.day_number = ?
        ORDER BY ts.week_number, ts.session_number
    `, [userId, dayOfWeek]);
}

async function getUpcomingSessions(userId, daysAhead = 7) {
    const userDb = await getUserDb(userId);

    return await dbAllUser(userDb, `
        SELECT ts.*, tp.name as plan_name
        FROM training_sessions ts
        JOIN training_plans tp ON ts.plan_id = tp.id
        WHERE tp.user_id = ? AND tp.is_active = 1 
        AND ts.completed = 0
        ORDER BY ts.week_number, ts.session_number
        LIMIT ?
    `, [userId, daysAhead]);
}

async function markSessionMissed(userId, { sessionId }) {
    const userDb = await getUserDb(userId);
    await dbRunUser(userDb,
        "UPDATE training_sessions SET status = 'missed' WHERE id = ? AND user_id = ?",
        [sessionId, userId]
    );
    return { success: true };
}

async function scheduleTest(userId, { testType = 'vma', scheduledDate }) {
    const userDb = await getUserDb(userId);
    const testProtocols = {
        vma: {
            name: 'Test VMA 6 minutes',
            description: 'Courez la plus grande distance possible en 6 minutes.',
            steps: ['Échauffement 10 min', 'Course maximale 6 min', 'Récupération 10 min'],
        },
        vdot: {
            name: 'Test VDOT 5 km',
            description: 'Courez 5 km à votre meilleure allure.',
            steps: ['Échauffement 10 min', 'Course 5 km effort maximal', 'Récupération 10 min'],
        },
        cooper: {
            name: 'Test de Cooper 12 minutes',
            description: 'Courez la plus grande distance possible en 12 minutes.',
            steps: ['Échauffement 10 min', 'Course maximale 12 min', 'Récupération 10 min'],
        },
    };

    // eslint-disable-next-line security/detect-object-injection
    const protocol = testProtocols[testType] || testProtocols.vma;
    const date = scheduledDate || new Date().toISOString().split('T')[0];

    const result = await dbRunUser(userDb, `
        INSERT INTO training_sessions (user_id, plan_id, type, title, description, day_number, week_number, scheduled_date, status)
        VALUES (?, NULL, 'TEST', ?, ?, 1, 0, ?, 'scheduled')
    `, [userId, protocol.name, protocol.description, date]);

    return {
        success: true,
        testId: result.lastID || 0,
        message: `Test ${protocol.name} planifié pour le ${date}`,
        testProtocol: protocol,
    };
}

async function submitTestResults(userId, { testType = 'vma', distance, time, heartRate: _heartRate }) {
    const userDb = await getUserDb(userId);

    let newVdot = null;
    let newVma = null;

    if (distance && time && time > 0) {
        const speedMs = distance / time;
        const speedKmh = speedMs * 3.6;

        if (testType === 'vma' || testType === 'cooper') {
            newVma = Math.round(speedKmh * 10) / 10;
            newVdot = Math.round(estimateVDOTFromVMA(newVma) * 10) / 10;
        } else if (testType === 'vdot') {
            const timeMins = time / 60;
            if (timeMins > 0) {
                newVdot = Math.round((29.54 + 5.000663 * (distance / 1000) - 1.455 * timeMins) * 10) / 10;
                newVma = Math.round(newVdot * 0.18 * 10) / 10;
            }
        }
    }

    const previous = await dbGetUser(userDb, 'SELECT vdot, vma FROM user_profiles WHERE user_id = ?', [userId]);

    if (newVdot) {
        await dbRunUser(userDb, `
            INSERT INTO user_profiles (user_id, vdot, vma, updated_at)
            VALUES (?, ?, ?, datetime('now'))
            ON CONFLICT(user_id) DO UPDATE SET vdot = excluded.vdot, vma = excluded.vma, updated_at = excluded.updated_at
        `, [userId, newVdot, newVma]);
    }

    const paces = newVdot ? calculatePaces(newVdot) : {};

    return {
        success: true,
        message: newVdot ? `VDOT mis à jour : ${newVdot}` : 'Résultats enregistrés',
        newVma,
        newVdot,
        updatedPaces: paces,
        progress: {
            previous: previous || {},
            current: { vdot: newVdot, vma: newVma },
            improvement: previous?.vdot && newVdot
                ? `+${Math.round((newVdot - previous.vdot) * 10) / 10} VDOT`
                : 'Première mesure',
        },
    };
}

async function matchActivityToSession(userId, { activityId, sessionId }) {
    const userDb = await getUserDb(userId);

    await dbRunUser(userDb, `
        UPDATE training_sessions
        SET completed = 1, activity_id = ?, completion_date = datetime('now'), status = 'completed'
        WHERE id = ? AND user_id = ?
    `, [activityId, sessionId, userId]);

    const session = await dbGetUser(userDb,
        'SELECT * FROM training_sessions WHERE id = ? AND user_id = ?',
        [sessionId, userId]
    );

    return {
        success: true,
        message: 'Activité associée à la séance',
        integrated: true,
        session: session ? {
            id: session.id,
            title: session.title || session.type,
            type: session.type,
            week: session.week_number,
            day: session.day_number,
        } : null,
        estimatedRpe: session?.rpe || null,
    };
}

async function getPendingSessions(userId) {
    const activePlanData = await getActivePlan(userId);
    if (!activePlanData || !activePlanData.plan) {
        return { plan: null, sessions: [], recentActivities: [] };
    }

    const userDb = await getUserDb(userId);
    const plan = activePlanData.plan;

    const sessions = await dbAllUser(userDb, `
        SELECT * FROM training_sessions
        WHERE plan_id = ? AND user_id = ? AND (completed = 0 OR completed IS NULL) AND status != 'completed'
        ORDER BY week_number, session_number
    `, [plan.id, userId]);

    return {
        plan: {
            id: plan.id,
            name: plan.name,
            target_distance: plan.target_distance,
            weeks: plan.weeks,
        },
        sessions: sessions.map(s => ({
            id: s.id,
            planId: s.plan_id,
            weekNumber: s.week_number,
            dayNumber: s.day_number,
            title: s.title || s.type,
            type: s.type,
            scheduledDate: s.scheduled_date || null,
        })),
        recentActivities: [],
    };
}

async function adaptPlanBasedOnFeedback(userId, planId, sessionId, feedback) {
    const userDb = await getUserDb(userId);

    const session = await dbGetUser(userDb,
        'SELECT * FROM training_sessions WHERE id = ? AND plan_id = ?',
        [sessionId, planId]
    );
    if (!session) return { success: false, error: 'Session not found' };

    await markSessionCompleted(userId, sessionId, feedback);

    const recentActivities = await dbAllUser(userDb, `
        SELECT tss, start_date FROM activities
        WHERE date(start_date) >= date('now', '-42 days')
        ORDER BY start_date
    `);

    let adaptation = { adjustedSessions: 0, reason: 'none' };

    if (recentActivities[0]?.values?.length > 0) {
        const dailyTSS = {};
        /* eslint-disable security/detect-object-injection */
        for (const row of recentActivities[0].values) {
            const date = row[1]?.split('T')[0] || row[1];
            dailyTSS[date] = (dailyTSS[date] || 0) + (row[0] || 0);
        }

        const pmcData = Object.keys(dailyTSS).sort().map(date => ({
            date,
            tss: dailyTSS[date],
        }));
        /* eslint-enable security/detect-object-injection */

        const pmcResult = PMC.calculate(pmcData);
        const lastPmc = pmcResult[pmcResult.length - 1];
        const tsb = lastPmc.ctl - lastPmc.atl;
        const acwr = lastPmc.atl > 0 ? lastPmc.ctl / lastPmc.atl : 1;

        if (tsb < -20 || acwr > 1.5) {
            const upcomingSessions = await dbAllUser(userDb, `
                SELECT * FROM training_sessions
                WHERE plan_id = ? AND completed = 0 AND week_number >= ?
                ORDER BY week_number, session_number
                LIMIT 3
            `, [planId, session.week_number]);

            for (const upcoming of upcomingSessions) {
                let newIntensity = upcoming.intensity;
                let newDescription = upcoming.description;

                if (upcoming.intensity === 'high' || upcoming.intensity === 'very_high') {
                    newIntensity = 'moderate';
                    newDescription = `[ADAPTÉ] ${upcoming.description}\n?? Intensité réduite due à la fatigue accumulée (TSB: ${Math.round(tsb)}).`;
                    await dbRunUser(userDb, `
                        UPDATE training_sessions SET intensity = ?, description = ?, adapted = 1
                        WHERE id = ?
                    `, [newIntensity, newDescription, upcoming.id]);
                    adaptation.adjustedSessions++;
                    adaptation.reason = 'fatigue';
                }
            }
        }

        if (feedback.rpe && feedback.rpe > 8) {
            const nextSession = await dbGetUser(userDb, `
                SELECT * FROM training_sessions
                WHERE plan_id = ? AND completed = 0 AND (week_number > ? OR (week_number = ? AND session_number > ?))
                ORDER BY week_number, session_number LIMIT 1
            `, [planId, session.week_number, session.week_number, session.session_number]);

            if (nextSession && nextSession.intensity !== 'rest') {
                await dbRunUser(userDb, `
                    UPDATE training_sessions SET type = 'R', intensity = 'rest', title = 'Récupération (adapté)',
                    description = 'Jour de repos ajouté suite à un effort perçu élevé (RPE: ' || ? || ').',
                    adapted = 1
                    WHERE id = ?
                `, [feedback.rpe, nextSession.id]);
                adaptation.adjustedSessions++;
                adaptation.reason = adaptation.reason === 'none' ? 'high_rpe' : adaptation.reason + ',high_rpe';
            }
        }
    }

    return { success: true, adaptation };
}

module.exports = {
    getActivePlan,
    getPlanSessions,
    markSessionCompleted,
    getTodaySessions,
    getUpcomingSessions,
    markSessionMissed,
    scheduleTest,
    submitTestResults,
    matchActivityToSession,
    getPendingSessions,
    adaptPlanBasedOnFeedback,
};
