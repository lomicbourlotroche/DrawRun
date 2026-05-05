/**
 * DrawRun - Post-Sync Metrics Calculator
 * ======================================
 * 
 * Ce module calcule et stocke automatiquement les métriques après chaque synchronisation:
 * - TSS (Training Stress Score)
 * - TRIMP (Training Impulse)
 * - VDOT (Jack Daniels Score)
 * - CTL (Chronic Training Load)
 * - ATL (Acute Training Load)
 * - TSB (Training Stress Balance)
 * - ACWR (Acute:Chronic Workload Ratio)
 * 
 * Utilise le module SportAnalysis pour les calculs par sport.
 */

'use strict';
const { logger } = require('./logger');

const { dbGetUser, dbRunUser, dbAllUser, getUserDb, dbGetMain } = require('./database');
const { RunningPerformance, TrainingLoad, PMC, Cardiovascular, SportAnalysis } = require('./algorithms');

async function calculateAndStoreMetrics(userId, userDb) {
    logger.info(`[MetricsCalculator] Starting calculations for user ${userId}`);
    
    try {
        // 1. Récupérer le profil utilisateur
        const profile = await getUserProfile(userId, userDb);
        
        // 2. Récupérer toutes les activités
        const activities = await dbAllUser(userDb, `
            SELECT id, distance, moving_time, elapsed_time, average_speed, max_speed,
                   average_heartrate, max_heartrate, average_cadence, average_power,
                   total_elevation_gain, calories,
                   start_date, type, tss, trimp, intensity_factor
            FROM activities 
            WHERE moving_time IS NOT NULL 
            ORDER BY start_date ASC
        `);
        
        if (activities.length === 0) {
            logger.info(`[MetricsCalculator] No activities found for user ${userId}`);
            return { success: true, calculated: 0 };
        }
        
        // 3. Calculer TSS, TRIMP, IF pour chaque activité avec SportAnalysis
        let metricsCalculated = 0;
        for (const activity of activities) {
            // Préparer l'objet activité pour l'analyse
            const activityData = {
                type: activity.type,
                distance: activity.distance,
                moving_time: activity.moving_time,
                elapsed_time: activity.elapsed_time,
                average_speed: activity.average_speed,
                max_speed: activity.max_speed,
                average_heartrate: activity.average_heartrate,
                max_heartrate: activity.max_heartrate,
                average_cadence: activity.average_cadence,
                average_watts: activity.average_power,
                weighted_average_watts: null,
                max_watts: null,
                total_elevation_gain: activity.total_elevation_gain,
                calories: activity.calories,
                tss: activity.tss,
                trimp: activity.trimp,
            };
            
            // Profil pour les calculs
            const profileData = {
                fcm: profile.fcm,
                resting_hr: profile.resting_hr,
                vma: profile.vma,
                vdot: profile.vdot,
                ftp: profile.ftp,
                swim_ftp: profile.swim_ftp,
                age: profile.age,
                sex: profile.sex,
                weight: profile.weight,
            };
            
            // Utiliser SportAnalysispour l'analyse
            const analysis = SportAnalysis.analyze(activityData, profileData);
            
            // Mettre à jour l'activité si on a du TSS ou TRIMP
            if (analysis.tss !== null || analysis.trimp !== null) {
                await dbRunUser(userDb, `
                    UPDATE activities SET 
                        tss = COALESCE(?, tss),
                        trimp = COALESCE(?, trimp),
                        intensity_factor = COALESCE(?, intensity_factor)
                    WHERE id = ?
                `, [
                    analysis.tss ?? activity.tss,
                    analysis.trimp ?? activity.trimp,
                    analysis.intensityFactor ?? activity.intensity_factor,
                    activity.id
                ]);
                metricsCalculated++;
            }
        }
        
        // 4. Pour les courses: Calculer VDOT depuis les meilleures perfs
        const runs = activities.filter(a => 
            (a.type === 'run' || a.type === 'Run' || a.type === 'trail_run') && 
            a.distance >= 3000 && a.moving_time >= 900
        );
        let bestVDOT = profile.vdot || null;
        const recentRuns = runs.slice(-20);
        
        for (const run of recentRuns) {
            const timeMinutes = run.moving_time / 60;
            const vdot = RunningPerformance.calculateVDOT(run.distance, timeMinutes);
            
            if (vdot && vdot > 20 && (!bestVDOT || vdot > bestVDOT)) {
                bestVDOT = vdot;
            }
        }
        
        // 5. Mettre à jour le profil avec le meilleur VDOT
        if (bestVDOT && bestVDOT !== profile.vdot) {
            await updateUserProfile(userId, userDb, { vdot: bestVDOT });
            logger.info(`[MetricsCalculator] Updated VDOT to ${bestVDOT}`);
        }
        
        // 6. Calculer PMC (CTL, ATL, TSB)
        const activitiesWithTSS = await dbAllUser(userDb, `
            SELECT start_date, tss, trimp
            FROM activities 
            WHERE (tss IS NOT NULL OR trimp IS NOT NULL) 
            AND start_date IS NOT NULL
            ORDER BY start_date ASC
            LIMIT 365
        `);
        
        if (activitiesWithTSS.length > 0) {
            const pmcData = PMC.calculate(activitiesWithTSS.map(a => ({
                date: (a.start_date || '').split('T')[0],
                tss: a.tss || a.trimp || 50
            })));
            
            if (pmcData.length > 0) {
                const latest = pmcData[pmcData.length - 1];
                
                // Stocker les métriques PMC
                const today = new Date().toISOString().split('T')[0];
                
                await dbRunUser(userDb, `
                    INSERT OR REPLACE INTO performance_metrics
                    (user_id, metric_type, metric_value, recorded_at, source)
                    VALUES (?, 'ctl', ?, ?, 'calculated')
                `, [userId, latest.ctl, today]);
                
                await dbRunUser(userDb, `
                    INSERT OR REPLACE INTO performance_metrics
                    (user_id, metric_type, metric_value, recorded_at, source)
                    VALUES (?, 'atl', ?, ?, 'calculated')
                `, [userId, latest.atl, today]);
                
                await dbRunUser(userDb, `
                    INSERT OR REPLACE INTO performance_metrics
                    (user_id, metric_type, metric_value, recorded_at, source)
                    VALUES (?, 'tsb', ?, ?, 'calculated')
                `, [userId, latest.tsb, today]);
                
                // Calculer ACWR
                const ctl = latest.ctl;
                const atl = latest.atl;
                const acwr = atl > 0 ? ctl / atl : 0;
                
                await dbRunUser(userDb, `
                    INSERT OR REPLACE INTO performance_metrics
                    (user_id, metric_type, metric_value, recorded_at, source)
                    VALUES (?, 'acwr', ?, ?, 'calculated')
                `, [userId, Math.round(acwr * 100) / 100, today]);
                
                // Stocker les données PMC complètes
                await dbRunUser(userDb, `
                    INSERT OR REPLACE INTO performance_metrics
                    (user_id, metric_type, metric_value, metric_unit, recorded_at, source)
                    VALUES (?, 'pmc_data', ?, 'json', ?, 'calculated')
                `, [userId, JSON.stringify(pmcData.slice(-30)), today]);
            }
        }
        
        // 7. Calculer les zones de FC si on a les données
        if (profile.age) {
            const zones = Cardiovascular.calculateKarvonenZones(
                profile.age || 30,
                profile.resting_hr || 60,
                profile.sex || 'M'
            );
            
            await dbRunUser(userDb, `
                INSERT OR REPLACE INTO performance_metrics
                (user_id, metric_type, metric_value, metric_unit, recorded_at, source)
                VALUES (?, 'hr_zones', ?, 'json', ?, 'calculated')
            `, [userId, JSON.stringify(zones), new Date().toISOString().split('T')[0]]);
        }
        
        // 8. Calculer le volume hebdomadaire
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weeklyStats = await dbAllUser(userDb, `
            SELECT SUM(distance) as total_distance, SUM(moving_time) as total_time, COUNT(*) as count
            FROM activities 
            WHERE start_date >= ? AND type IN ('run', 'Run', 'trail_run', 'Ride', 'ride')
        `, [weekAgo.toISOString().split('T')[0]]);
        
        if (weeklyStats.length > 0) {
            const week = weeklyStats[0];
            await dbRunUser(userDb, `
                INSERT OR REPLACE INTO performance_metrics
                (user_id, metric_type, metric_value, metric_unit, recorded_at, source)
                VALUES (?, 'weekly_distance', ?, 'm', ?, 'calculated')
            `, [userId, week.total_distance || 0, new Date().toISOString().split('T')[0]]);
            
            await dbRunUser(userDb, `
                INSERT OR REPLACE INTO performance_metrics
                (user_id, metric_type, metric_value, metric_unit, recorded_at, source)
                VALUES (?, 'weekly_time', ?, 's', ?, 'calculated')
            `, [userId, week.total_time || 0, new Date().toISOString().split('T')[0]]);
            
            await dbRunUser(userDb, `
                INSERT OR REPLACE INTO performance_metrics
                (user_id, metric_type, metric_value, metric_unit, recorded_at, source)
                VALUES (?, 'weekly_activities', ?, 'count', ?, 'calculated')
            `, [userId, week.count || 0, new Date().toISOString().split('T')[0]]);
        }
        
        logger.info(`[MetricsCalculator] Completed for user ${userId}: metrics calculated=${metricsCalculated}`);
        
        return {
            success: true,
            calculated: metricsCalculated,
            vdot: bestVDOT
        };
        
    } catch (error) {
        logger.error(`[MetricsCalculator] Error for user ${userId}:`, error);
        return { success: false, error: error.message };
    }
}

async function getUserProfile(userId, userDb) {
    // Essayer d'abord user_profiles
    let profile = await dbGetUser(userDb, `
        SELECT * FROM user_profiles WHERE user_id = ?
    `, [userId]).catch(() => null);
    
    if (profile) {
        return {
            fcm: profile.fcm,
            resting_hr: profile.resting_hr,
            vma: profile.vma,
            vdot: profile.vdot,
            age: profile.age,
            sex: profile.sex,
            weight: profile.weight
        };
    }
    
    // Sinon, essayer de construire depuis les métriques
    const fcmMetric = await dbGetUser(userDb, `
        SELECT metric_value FROM performance_metrics 
        WHERE user_id = ? AND metric_type = 'fcm' 
        ORDER BY recorded_at DESC LIMIT 1
    `, [userId]).catch(() => null);
    
    const vdotMetric = await dbGetUser(userDb, `
        SELECT metric_value FROM performance_metrics 
        WHERE user_id = ? AND metric_type = 'vdot' 
        ORDER BY recorded_at DESC LIMIT 1
    `, [userId]).catch(() => null);
    
    return {
        fcm: fcmMetric?.metric_value || null,
        resting_hr: 60,
        vdot: vdotMetric?.metric_value || null,
        age: 30,
        sex: 'M'
    };
}

async function updateUserProfile(userId, userDb, updates) {
    const existing = await dbGetUser(userDb, `
        SELECT id FROM user_profiles WHERE user_id = ?
    `, [userId]).catch(() => null);
    
    if (existing) {
        const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        await dbRunUser(userDb, `
            UPDATE user_profiles SET ${setClause}, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
        `, [...Object.values(updates), userId]);
    } else {
        await dbRunUser(userDb, `
            INSERT INTO user_profiles (user_id, fcm, vma, vdot, age, sex, weight, resting_hr, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
            userId,
            updates.fcm || null,
            updates.vma || null,
            updates.vdot || null,
            updates.age || 30,
            updates.sex || 'M',
            updates.weight || null,
            updates.resting_hr || 60
        ]);
    }
}

module.exports = {
    calculateAndStoreMetrics,
    getUserProfile,
    updateUserProfile
};