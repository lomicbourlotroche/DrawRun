'use strict';

const { logger } = require('../logger');
const { getUserDb, dbGetUser, dbAllUser, dbGetMain, dbRunUser } = require('../database');
const { Cardiovascular, RunningPerformance } = require('../algorithms');

const RESOLUTION_SOURCES = {
    MANUAL: 'manual',
    COMPUTED: 'computed',
    ESTIMATED: 'estimated',
};

async function resolveUserConstants(userId) {
    const userDb = await getUserDb(userId);

    const manual = await getManualConstants(userId, userDb);
    const activities = await getRelevantActivities(userDb);
    const autoUpdate = await getAutoUpdate(userId);

    const fcm = resolveFCM(userId, userDb, manual, activities, autoUpdate);
    const vdot = resolveVDOT(userId, userDb, manual, activities, autoUpdate);
    const vma = resolveVMA(manual, vdot);
    const vo2max = resolveVO2max(manual, vma, vdot);
    const restingHR = resolveRestingHR(manual, fcm);
    const age = manual.age || 30;
    const sex = manual.sex || 'M';
    const weight = manual.weight || null;

    return {
        fcm: fcm.value,
        fcmSource: fcm.source,
        vma: vma.value,
        vmaSource: vma.source,
        vdot: vdot.value,
        vdotSource: vdot.source,
        vo2max: vo2max.value,
        vo2maxSource: vo2max.source,
        restingHR: restingHR.value,
        restingHRSource: restingHR.source,
        age,
        sex,
        weight,
    };
}

async function getAutoUpdate(userId) {
    const row = await dbGetMain('SELECT profile_data FROM users WHERE id = ?', [userId]).catch(() => null);
    if (row?.profile_data) {
        try {
            const p = JSON.parse(row.profile_data);
            return p.auto_update !== false;
        } catch (_) {}
    }
    return true;
}

async function getManualConstants(userId, userDb) {
    let profile = await dbGetUser(userDb,
        'SELECT fcm, vma, vdot, weight, height, resting_hr, max_hr, age, sex FROM user_profiles WHERE user_id = ?',
        [userId]
    ).catch(() => null);

    if (profile) {
        return {
            fcm: profile.fcm || profile.max_hr || null,
            vma: profile.vma || null,
            vdot: profile.vdot || null,
            weight: profile.weight || null,
            height: profile.height || null,
            restingHR: profile.resting_hr || null,
            age: profile.age || null,
            sex: profile.sex || 'M',
        };
    }

    const mainProfile = await dbGetMain('SELECT profile_data FROM users WHERE id = ?', [userId]);
    if (mainProfile?.profile_data) {
        try {
            const p = JSON.parse(mainProfile.profile_data);
            return {
                fcm: p.fcm || p.max_heart_rate || null,
                vma: p.vma || null,
                vdot: p.vdot || null,
                weight: p.weight || null,
                height: p.height || null,
                restingHR: p.restingHR || p.resting_hr || null,
                age: p.age || null,
                sex: p.sex || 'M',
            };
        } catch (_) {}
    }

    return { fcm: null, vma: null, vdot: null, weight: null, height: null, restingHR: null, age: null, sex: 'M' };
}

async function getRelevantActivities(userDb) {
    return await dbAllUser(userDb, `
        SELECT distance, moving_time, average_speed, max_speed,
               average_heartrate, max_heartrate, start_date, type
        FROM activities
        WHERE moving_time IS NOT NULL AND moving_time > 0
        ORDER BY start_date DESC
        LIMIT 200
    `).catch(() => []);
}

function resolveFCM(userId, userDb, manual, activities, autoUpdate) {
    if (!autoUpdate) {
        if (manual.fcm) {
            return { value: manual.fcm, source: RESOLUTION_SOURCES.MANUAL };
        }
        const age = manual.age || 30;
        return { value: Cardiovascular.calculateMaxHR(age), source: RESOLUTION_SOURCES.ESTIMATED };
    }

    const formulaFCM = Cardiovascular.calculateMaxHR(manual.age || 30);

    const maxHRs = activities
        .filter(a => a.max_heartrate && a.max_heartrate > 0)
        .map(a => a.max_heartrate);

    if (maxHRs.length > 0) {
        const observedMax = Math.max(...maxHRs);
        if (observedMax >= formulaFCM * 0.85) {
            return { value: Math.round(observedMax), source: RESOLUTION_SOURCES.COMPUTED };
        }
        if (observedMax > 0) {
            return { value: Math.round(Math.max(observedMax, formulaFCM)), source: RESOLUTION_SOURCES.COMPUTED };
        }
    }

    return { value: formulaFCM, source: RESOLUTION_SOURCES.ESTIMATED };
}

function resolveVDOT(userId, userDb, manual, activities, autoUpdate) {
    if (!autoUpdate) {
        if (manual.vdot) {
            return { value: manual.vdot, source: RESOLUTION_SOURCES.MANUAL };
        }
        return { value: null, source: RESOLUTION_SOURCES.ESTIMATED };
    }

    const runs = activities.filter(a =>
        (a.type === 'run' || a.type === 'Run' || a.type === 'trail_run') &&
        a.distance >= 1000 && a.moving_time >= 300
    );

    if (runs.length > 0) {
        let bestVDOT = null;
        for (const run of runs) {
            const timeMinutes = run.moving_time / 60;
            const vdot = RunningPerformance.calculateVDOT(run.distance, timeMinutes);
            if (vdot && vdot > 20 && (!bestVDOT || vdot > bestVDOT)) {
                bestVDOT = vdot;
            }
        }
        if (bestVDOT) {
            return { value: Math.round(bestVDOT * 10) / 10, source: RESOLUTION_SOURCES.COMPUTED };
        }
    }

    if (manual.vdot) {
        return { value: manual.vdot, source: RESOLUTION_SOURCES.MANUAL };
    }

    return { value: null, source: RESOLUTION_SOURCES.ESTIMATED };
}

function resolveVMA(manual, vdot) {
    if (!manual.vma && vdot.value) {
        const vma = RunningPerformance.estimateVMA(vdot.value);
        if (vma && vma > 0) {
            return { value: Math.round(vma * 10) / 10, source: vdot.source };
        }
    }

    if (manual.vma) {
        return { value: manual.vma, source: RESOLUTION_SOURCES.MANUAL };
    }

    return { value: null, source: RESOLUTION_SOURCES.ESTIMATED };
}

function resolveVO2max(manual, vma, vdot) {
    if (manual.vma && vma.value) {
        const vo2 = RunningPerformance.estimateVO2max(manual.vma);
        if (vo2 && vo2 > 0) {
            return { value: Math.round(vo2 * 10) / 10, source: RESOLUTION_SOURCES.MANUAL };
        }
    }

    if (vma.value) {
        const vo2 = RunningPerformance.estimateVO2max(vma.value);
        if (vo2 && vo2 > 0) {
            return { value: Math.round(vo2 * 10) / 10, source: vma.source };
        }
    }

    if (vdot.value) {
        return { value: Math.round(vdot.value * 10) / 10, source: vdot.source };
    }

    return { value: null, source: RESOLUTION_SOURCES.ESTIMATED };
}

function resolveRestingHR(manual, fcm) {
    if (manual.restingHR) {
        return { value: manual.restingHR, source: RESOLUTION_SOURCES.MANUAL };
    }
    return { value: 60, source: RESOLUTION_SOURCES.ESTIMATED };
}

async function updateUserProfileFromMain(userId, profileData) {
    const userDb = await getUserDb(userId);
    const existing = await dbGetUser(userDb, 'SELECT id FROM user_profiles WHERE user_id = ?', [userId]).catch(() => null);

    const updates = {
        fcm: profileData.fcm || null,
        vma: profileData.vma || null,
        vdot: profileData.vdot || null,
        weight: profileData.weight || null,
        height: profileData.height || null,
        resting_hr: profileData.restingHR || null,
        age: profileData.age || null,
        sex: profileData.sex || 'M',
    };

    if (existing) {
        const setClause = Object.keys(updates).filter(k => updates[k] !== undefined).map(k => `${k} = ?`).join(', ');
        const values = Object.keys(updates).filter(k => updates[k] !== undefined).map(k => updates[k]);
        if (setClause) {
            await dbRunUser(userDb, `UPDATE user_profiles SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`, [...values, userId]);
        }
    } else {
        await dbRunUser(userDb, `
            INSERT INTO user_profiles (user_id, fcm, vma, vdot, weight, height, resting_hr, age, sex, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
            userId,
            updates.fcm || null,
            updates.vma || null,
            updates.vdot || null,
            updates.weight || null,
            updates.height || null,
            updates.resting_hr || 60,
            updates.age || 30,
            updates.sex || 'M',
        ]);
    }
}

module.exports = {
    resolveUserConstants,
    getManualConstants,
    updateUserProfileFromMain,
    RESOLUTION_SOURCES,
};
