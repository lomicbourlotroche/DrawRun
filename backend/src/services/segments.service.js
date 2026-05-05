const { dbGetMain, dbRunMain, dbAllMain } = require('../database');
const { logger } = require('../logger');

const dbGet = (q, p) => dbGetMain(q, p);
const dbRun = (q, p) => dbRunMain(q, p);
const dbAll = (q, p) => dbAllMain(q, p);

/**
 * Créer un nouveau segment
 */
async function createSegment(userId, data) {
    try {
        const result = await dbRun(`
            INSERT INTO segments (name, description, created_by, start_lat, start_lng, 
                                  end_lat, end_lng, distance, elevation_gain, elevation_loss,
                                  avg_grade, max_grade, polyline, activity_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            data.name, data.description || '', userId, data.start_lat, data.start_lng,
            data.end_lat, data.end_lng, data.distance, data.elevation_gain || 0, 
            data.elevation_loss || 0, data.avg_grade, data.max_grade, data.polyline, 
            data.activity_type || 'Run'
        ]);
        
        return { success: true, segment_id: result.lastID };
    } catch (error) {
        logger.error('Error creating segment:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Récupérer un segment par ID
 */
async function getSegment(segmentId) {
    const segment = await dbGet(`
        SELECT s.*, 
               json_extract(u.profile_data, '$.name') as creator_name,
               u.email as creator_email
        FROM segments s
        LEFT JOIN users u ON s.created_by = u.id
        WHERE s.id = ?
    `, [segmentId]);
    
    if (!segment) return null;
    
    // Ajouter les stats
    const stats = await getSegmentStats(segmentId);
    
    return {
        ...segment,
        ...stats
    };
}

/**
 * Récupérer les segments à proximité
 */
async function getNearbySegments(lat, lng, radius = 5000, activityType = null) {
    // Conversion simple : 1 degré ~ 111km
    const latDelta = radius / 111000;
    const lngDelta = radius / (111000 * Math.cos(lat * Math.PI / 180));
    
    let query = `
        SELECT s.*,
               json_extract(u.profile_data, '$.name') as creator_name,
               (SELECT COUNT(*) FROM segment_efforts WHERE segment_id = s.id) as effort_count
        FROM segments s
        LEFT JOIN users u ON s.created_by = u.id
        WHERE s.start_lat BETWEEN ? AND ?
          AND s.start_lng BETWEEN ? AND ?
          AND s.is_public = 1
    `;
    
    const params = [lat - latDelta, lat + latDelta, lng - lngDelta, lng + lngDelta];
    
    if (activityType) {
        query += ' AND s.activity_type = ?';
        params.push(activityType);
    }
    
    query += ' ORDER BY s.created_at DESC LIMIT 50';
    
    return await dbAll(query, params);
}

/**
 * Récupérer tous les segments publics
 */
async function getPublicSegments(limit = 50, offset = 0) {
    return await dbAll(`
        SELECT s.*,
               json_extract(u.profile_data, '$.name') as creator_name,
               (SELECT COUNT(*) FROM segment_efforts WHERE segment_id = s.id) as effort_count
        FROM segments s
        LEFT JOIN users u ON s.created_by = u.id
        WHERE s.is_public = 1
        ORDER BY effort_count DESC
        LIMIT ? OFFSET ?
    `, [limit, offset]);
}

/**
 * Enregistrer un effort sur un segment
 */
async function createSegmentEffort(userId, segmentId, activityId, data) {
    try {
        // Vérifier si c'est un PR
        const bestEffort = await dbGet(`
            SELECT MIN(elapsed_time) as best_time
            FROM segment_efforts
            WHERE segment_id = ? AND user_id = ?
        `, [segmentId, userId]);
        
        const isPR = !bestEffort?.best_time || data.elapsed_time < bestEffort.best_time;
        
        const result = await dbRun(`
            INSERT INTO segment_efforts 
            (segment_id, user_id, activity_id, elapsed_time, moving_time, start_date,
             avg_watts, max_watts, avg_heartrate, max_heartrate, avg_speed, max_speed)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            segmentId, userId, activityId, data.elapsed_time, data.moving_time, data.start_date,
            data.avg_watts, data.max_watts, data.avg_heartrate, data.max_heartrate,
            data.avg_speed, data.max_speed
        ]);
        
        // Mettre à jour les classements KOM/QOM
        await updateSegmentLeaderboard(segmentId);
        
        return { 
            success: true, 
            effort_id: result.lastID,
            is_pr: isPR
        };
    } catch (error) {
        logger.error('Error creating segment effort:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Mettre à jour le leaderboard d'un segment (KOM/QOM)
 */
async function updateSegmentLeaderboard(segmentId) {
    try {
        // Reset all KOM/QOM flags
        await dbRun(`
            UPDATE segment_efforts 
            SET is_kom = 0, is_qom = 0 
            WHERE segment_id = ?
        `, [segmentId]);
        
        // Get user genders from users table
        const efforts = await dbAll(`
            SELECT se.*, json_extract(u.profile_data, '$.sex') as sex
            FROM segment_efforts se
            LEFT JOIN users u ON se.user_id = u.id
            WHERE se.segment_id = ?
            ORDER BY se.elapsed_time ASC
        `, [segmentId]);
        
        // Find best male and female
        let bestMale = null;
        let bestFemale = null;
        
        for (const effort of efforts) {
            const sex = effort.sex || 'M';
            if (sex === 'M' && !bestMale) {
                bestMale = effort;
            } else if (sex === 'F' && !bestFemale) {
                bestFemale = effort;
            }
            if (bestMale && bestFemale) break;
        }
        
        // Update KOM
        if (bestMale) {
            await dbRun(`
                UPDATE segment_efforts SET is_kom = 1 WHERE id = ?
            `, [bestMale.id]);
        }
        
        // Update QOM
        if (bestFemale) {
            await dbRun(`
                UPDATE segment_efforts SET is_qom = 1 WHERE id = ?
            `, [bestFemale.id]);
        }
        
    } catch (error) {
        logger.error('Error updating leaderboard:', error);
    }
}

/**
 * Récupérer le leaderboard d'un segment
 */
async function getSegmentLeaderboard(segmentId, limit = 50) {
    const efforts = await dbAll(`
        SELECT se.*,
               json_extract(u.profile_data, '$.name') as user_name,
               json_extract(u.profile_data, '$.sex') as user_sex,
               u.email as user_email,
               a.name as activity_name,
               a.start_date as activity_date
        FROM segment_efforts se
        LEFT JOIN users u ON se.user_id = u.id
        LEFT JOIN activities a ON se.activity_id = a.id
        WHERE se.segment_id = ?
        ORDER BY se.elapsed_time ASC
        LIMIT ?
    `, [segmentId, limit]);
    
    // Add rank
    return efforts.map((effort, index) => ({
        ...effort,
        rank: index + 1,
        is_kom: effort.is_kom === 1,
        is_qom: effort.is_qom === 1
    }));
}

/**
 * Récupérer les efforts d'un utilisateur sur un segment
 */
async function getUserSegmentEfforts(userId, segmentId) {
    return await dbAll(`
        SELECT se.*,
               a.name as activity_name,
               a.start_date as activity_date
        FROM segment_efforts se
        LEFT JOIN activities a ON se.activity_id = a.id
        WHERE se.segment_id = ? AND se.user_id = ?
        ORDER BY se.elapsed_time ASC
    `, [segmentId, userId]);
}

/**
 * Récupérer les stats d'un segment
 */
async function getSegmentStats(segmentId) {
    const totalEfforts = await dbGet(`
        SELECT COUNT(*) as count FROM segment_efforts WHERE segment_id = ?
    `, [segmentId]);
    
    const uniqueAthletes = await dbGet(`
        SELECT COUNT(DISTINCT user_id) as count FROM segment_efforts WHERE segment_id = ?
    `, [segmentId]);
    
    const kom = await dbGet(`
        SELECT se.*, json_extract(u.profile_data, '$.name') as user_name
        FROM segment_efforts se
        LEFT JOIN users u ON se.user_id = u.id
        WHERE se.segment_id = ? AND se.is_kom = 1
    `, [segmentId]);
    
    const qom = await dbGet(`
        SELECT se.*, json_extract(u.profile_data, '$.name') as user_name
        FROM segment_efforts se
        LEFT JOIN users u ON se.user_id = u.id
        WHERE se.segment_id = ? AND se.is_qom = 1
    `, [segmentId]);
    
    return {
        total_efforts: totalEfforts?.count || 0,
        unique_athletes: uniqueAthletes?.count || 0,
        kom: kom ? { ...kom, user_name: kom.user_name || 'Anonymous' } : null,
        qom: qom ? { ...qom, user_name: qom.user_name || 'Anonymous' } : null
    };
}

/**
 * Supprimer un segment
 */
async function deleteSegment(userId, segmentId) {
    try {
        // Vérifier que l'utilisateur est le créateur
        const segment = await dbGet('SELECT * FROM segments WHERE id = ?', [segmentId]);
        if (!segment) {
            return { success: false, error: 'Segment not found' };
        }
        if (segment.created_by !== userId) {
            return { success: false, error: 'Not authorized' };
        }
        
        await dbRun('DELETE FROM segment_efforts WHERE segment_id = ?', [segmentId]);
        await dbRun('DELETE FROM segments WHERE id = ?', [segmentId]);
        
        return { success: true };
    } catch (error) {
        logger.error('Error deleting segment:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    createSegment,
    getSegment,
    getNearbySegments,
    getPublicSegments,
    createSegmentEffort,
    getSegmentLeaderboard,
    getUserSegmentEfforts,
    getSegmentStats,
    deleteSegment
};
