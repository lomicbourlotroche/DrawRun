const { dbRunMain, dbAllMain } = require('../../database');
const dbRun = (q, p) => dbRunMain(q, p);
const dbAll = (q, p) => dbAllMain(q, p);

async function updateSharedStats(userId, statType, statValue, statUnit, period = 'week', anonymous = true) {
    await dbRun(`
        INSERT OR REPLACE INTO shared_stats (user_id, stat_type, stat_value, stat_unit, period, shared_anonymously)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [userId, statType, statValue, statUnit, period, anonymous ? 1 : 0]);

    return { success: true };
}

async function getLeaderboard(groupId, category = 'distance', period = 'week') {
    let query = `
        SELECT 
            CASE WHEN ss.shared_anonymously = 1 THEN 'Anonymous' ELSE json_extract(u.profile_data, '$.name') END as name,
            ss.stat_value as value,
            ss.stat_unit as unit
        FROM shared_stats ss
        LEFT JOIN users u ON ss.user_id = u.id
        WHERE ss.stat_type = ? AND ss.period = ?
    `;

    if (groupId) {
        query = `
            SELECT 
                CASE WHEN ss.shared_anonymously = 1 THEN 'Anonymous' ELSE json_extract(u.profile_data, '$.name') END as name,
                ss.stat_value as value,
                ss.stat_unit as unit
            FROM shared_stats ss
            LEFT JOIN users u ON ss.user_id = u.id
            JOIN group_members gm ON gm.user_id = ss.user_id
            WHERE gm.group_id = ? AND ss.stat_type = ? AND ss.period = ?
        `;
    }

    const leaderboard = await dbAll(query + ' ORDER BY ss.stat_value DESC LIMIT 100', 
        groupId ? [groupId, category, period] : [category, period]);

    return leaderboard.map((entry, index) => ({
        ...entry,
        rank: index + 1
    }));
}

module.exports = {
    updateSharedStats,
    getLeaderboard
};
