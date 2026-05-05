const { dbGetUser, dbRunUser, dbAllUser } = require('./database');

function calculateTSS(durationSeconds, avgHR, thresholdHR, maxHR = null) {
    if (!avgHR || !thresholdHR || avgHR <= 0 || thresholdHR <= 0) {
        return null;
    }

    const durationHours = durationSeconds / 3600;
    
    const intensityFactor = avgHR / thresholdHR;
    
    if (intensityFactor <= 0 || intensityFactor > 2) {
        return null;
    }
    
    const tss = durationHours * intensityFactor * intensityFactor * 100;
    
    return Math.round(tss * 10) / 10;
}

function calculateTRIMP(durationMinutes, avgHR, restingHR, maxHR, sex = 'M') {
    if (!avgHR || !restingHR || !maxHR) {
        return null;
    }

    const hrr = (avgHR - restingHR) / (maxHR - restingHR);
    
    if (hrr < 0 || hrr > 1) {
        return null;
    }

    const k = sex === 'F' ? 0.86 : 1.92;
    
    const trimp = durationMinutes * hrr * Math.exp(k * hrr);
    
    return Math.round(trimp * 10) / 10;
}

function estimateThresholdHR(profile) {
    const { fcm, restingHR } = profile;
    
    if (!fcm || !restingHR) {
        return null;
    }
    
    return fcm * 0.85;
}

async function calculateAndStoreTSS(userId, userDb, activity) {
    try {
        const profile = await dbGetUser(userDb, `
            SELECT fcm, resting_hr FROM user_profiles WHERE user_id = ?
        `, [userId]).catch(() => null);
        
        let tss = null;
        let trimp = null;
        let intensityFactor = null;

        const durationSeconds = activity.moving_time || activity.duration || 0;
        const avgHR = activity.average_heartrate || activity.avg_hr;
        const maxHR = activity.max_heartrate || activity.max_hr;
        
        if (avgHR && profile?.fcm) {
            const thresholdHR = estimateThresholdHR({ fcm: profile.fcm, restingHR: profile.resting_hr || 50 });
            
            if (thresholdHR) {
                tss = calculateTSS(durationSeconds, avgHR, thresholdHR, profile.fcm);
                intensityFactor = avgHR / thresholdHR;
            }
            
            if (profile.resting_hr) {
                const durationMinutes = durationSeconds / 60;
                trimp = calculateTRIMP(durationMinutes, avgHR, profile.resting_hr, profile.fcm, 'M');
            }
        }

        await dbRunUser(userDb, `
            UPDATE activities 
            SET tss = ?, trimp = ?, intensity_factor = ?
            WHERE id = ?
        `, [tss, trimp, intensityFactor, activity.id]).catch(() => {});

        return { tss, trimp, intensityFactor };
    } catch (error) {
        return { tss: null, trimp: null, intensityFactor: null };
    }
}

async function checkOvertraining(userId, userDb) {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const activities = await dbAllUser(userDb, `
            SELECT date(start_date) as date, tss, trimp
            FROM activities 
            WHERE start_date >= ? AND tss IS NOT NULL
            ORDER BY start_date ASC
        `, [thirtyDaysAgo.toISOString().split('T')[0]]).catch(() => []);

        if (activities.length < 7) {
            return { risk: 'low', acwr: null, message: 'Not enough data' };
        }

        const dailyTSS = {};
        activities.forEach(act => {
            const date = act.date;
            dailyTSS[date] = (dailyTSS[date] || 0) + (act.tss || 0);
        });

        const dates = Object.keys(dailyTSS).sort();
        const tssValues = dates.map(d => dailyTSS[d]);

        const ctl = calculateCTL(tssValues);
        const atl = calculateATL(tssValues);
        const acwr = atl > 0 ? ctl / atl : 0;
        const tsb = ctl - atl;

        let risk = 'low';
        let message = 'Training load is optimal. Keep going!';
        let recommendation = null;

        if (acwr > 1.5) {
            risk = 'high';
            message = 'High risk of overtraining. Consider reducing volume.';
            recommendation = 'Take 2-3 rest days. Focus on recovery. Skip high-intensity sessions.';
        } else if (acwr > 1.3) {
            risk = 'moderate';
            message = 'Training load is increasing. Monitor recovery carefully.';
            recommendation = 'Consider a recovery week. Reduce volume by 20%.';
        } else if (acwr < 0.8) {
            risk = 'low';
            message = 'Training load is low. You may be detraining.';
            recommendation = 'Gradually increase training volume if feeling good.';
        }

        if (tsb > 20) {
            message = risk === 'low' ? 'Great fitness! You are well rested.' : message;
        } else if (tsb < -30) {
            risk = risk === 'low' ? 'moderate' : risk;
            message = 'Training stress is high. Prioritize recovery.';
        }

        return {
            risk,
            acwr: Math.round(acwr * 100) / 100,
            ctl: Math.round(ctl),
            atl: Math.round(atl),
            tsb: Math.round(tsb),
            message,
            recommendation
        };
    } catch (error) {
        return { risk: 'unknown', acwr: null, message: 'Error calculating risk' };
    }
}

function calculateCTL(tssValues, tau = 42) {
    if (tssValues.length === 0) return 0;
    
    let ctl = tssValues[0];
    const decayFactor = Math.exp(-1 / tau);
    
    for (let i = 1; i < tssValues.length; i++) {
        ctl = ctl * decayFactor + tssValues[i] * (1 - decayFactor);
    }
    
    return ctl;
}

function calculateATL(tssValues, tau = 7) {
    if (tssValues.length === 0) return 0;
    
    let atl = tssValues[0];
    const decayFactor = Math.exp(-1 / tau);
    
    for (let i = 1; i < tssValues.length; i++) {
        atl = atl * decayFactor + tssValues[i] * (1 - decayFactor);
    }
    
    return atl;
}

module.exports = {
    calculateTSS,
    calculateTRIMP,
    estimateThresholdHR,
    calculateAndStoreTSS,
    checkOvertraining,
    calculateCTL,
    calculateATL
};