/**
 * ============================================================
 * USER DATABASE - Per-User Database Management
 * ============================================================
 * Functions for managing individual user databases.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');
const { lruGet, lruSet, getCacheInstance } = require('./lruCache');

// Get SQL and DATA_DIR from main database module
let SQL;
let DATA_DIR;

function setSql(sqlModule) {
    SQL = sqlModule;
}

function setDataDir(dir) {
    DATA_DIR = dir;
}

// Sanitize email for filename
function sanitizeEmail(email) {
    return email
        .toLowerCase()
        .replace(/@/g, '_at_')
        .replace(/\./g, '_dot_')
        .replace(/[^a-z0-9_]/g, '_');
}

// Get user database path from email
function getUserDbPath(email) {
    const sanitized = sanitizeEmail(email);
    return path.join(DATA_DIR, `user_${sanitized}.db`);
}

// Save user database to disk
function saveUserDb(dbPath, userDb) {
    try {
        const data = userDb.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbPath, buffer);
    } catch (err) {
        logger.error('Failed to save user database:', err.message);
    }
}

// Initialize user database schema
function initUserSchema(userDb) {
    userDb.run(`
        CREATE TABLE IF NOT EXISTS user_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            fcm INTEGER,
            vma REAL,
            vdot REAL,
            weight REAL,
            height REAL,
            resting_hr INTEGER,
            max_hr INTEGER,
            age INTEGER,
            sex TEXT DEFAULT 'M',
            level TEXT DEFAULT 'beginner',
            goals TEXT,
            equipment TEXT,
            fav_sports TEXT,
            bio TEXT,
            location TEXT,
            avatar_url TEXT,
            is_public INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    userDb.run(`
        CREATE TABLE IF NOT EXISTS connected_services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            service TEXT NOT NULL,
            access_token TEXT,
            refresh_token TEXT,
            expires_at INTEGER,
            service_user_id TEXT,
            display_name TEXT,
            profile_url TEXT,
            avatar_url TEXT,
            connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_sync DATETIME,
            sync_status TEXT DEFAULT 'idle',
            last_error TEXT,
            UNIQUE(user_id, service)
        )
    `);

    userDb.run(`
        CREATE TABLE IF NOT EXISTS activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source TEXT NOT NULL,
            source_id TEXT,
            name TEXT,
            type TEXT,
            start_date DATETIME NOT NULL,
            timezone TEXT,
            distance REAL,
            moving_time INTEGER,
            elapsed_time INTEGER,
            average_speed REAL,
            max_speed REAL,
            average_heartrate REAL,
            max_heartrate REAL,
            average_cadence REAL,
            average_power REAL,
            calories INTEGER,
            elev_high REAL,
            elev_low REAL,
            total_elevation_gain REAL,
            map_polyline TEXT,
            map_summary_polyline TEXT,
            intensity_factor REAL,
            tss REAL,
            trimp REAL,
            normalized_power REAL,
            variability_index REAL,
            normalized_speed REAL,
            running_index REAL,
            hrv_rmssd REAL,
            hrv_samples INTEGER,
            raw_data_key TEXT,
            external_id TEXT,
            upload_id TEXT,
            device_name TEXT,
            description TEXT,
            notes TEXT,
            is_race INTEGER DEFAULT 0,
            is_commute INTEGER DEFAULT 0,
            is_manual INTEGER DEFAULT 0,
            gear_id INTEGER,
            efficiency_factor REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(source, source_id)
        )
    `);

    userDb.run(`
        CREATE TABLE IF NOT EXISTS activity_streams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            activity_id INTEGER NOT NULL,
            stream_type TEXT NOT NULL,
            data BLOB,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(activity_id, stream_type)
        )
    `);

    userDb.run(`
        CREATE TABLE IF NOT EXISTS activity_splits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            activity_id INTEGER NOT NULL,
            split_number INTEGER NOT NULL,
            distance REAL,
            elapsed_time INTEGER,
            moving_time INTEGER,
            average_speed REAL,
            average_heartrate REAL,
            max_heartrate REAL,
            elevation_difference REAL,
            pace_zone TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(activity_id, split_number)
        )
    `);

    userDb.run(`
        CREATE TABLE IF NOT EXISTS training_plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            target_type TEXT,
            target_value REAL,
            target_unit TEXT,
            start_date DATE,
            end_date DATE,
            estimated_finish_date DATE,
            weeks INTEGER,
            vdot REAL,
            current_week INTEGER DEFAULT 1,
            current_session INTEGER DEFAULT 0,
            sessions_per_week INTEGER DEFAULT 3,
            plan_type TEXT DEFAULT 'custom',
            plan_data TEXT,
            total_volume_km REAL,
            total_time_hours REAL,
            expected_tss_total REAL,
            experience_level TEXT,
            preferred_terrain TEXT,
            is_active INTEGER DEFAULT 0,
            is_completed INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    userDb.run(`
        CREATE TABLE IF NOT EXISTS training_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            plan_id INTEGER,
            user_id INTEGER NOT NULL,
            week_number INTEGER,
            day_number INTEGER,
            session_number INTEGER,
            type TEXT,
            title TEXT,
            description TEXT,
            target_distance REAL,
            target_time INTEGER,
            target_pace TEXT,
            target_hr_zones TEXT,
            target_cadence INTEGER,
            intensity TEXT,
            warmup_time INTEGER,
            main_time INTEGER,
            cooldown_time INTEGER,
            completed INTEGER DEFAULT 0,
            completion_date DATETIME,
            actual_distance REAL,
            actual_time INTEGER,
            actual_avg_hr REAL,
            actual_max_hr REAL,
            actual_pace TEXT,
            actual_cadence REAL,
            actual_rpe INTEGER,
            actual_notes TEXT,
            difficulty_rating INTEGER,
            pain_areas TEXT,
            weather TEXT,
            temperature REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    userDb.run(`
        CREATE TABLE IF NOT EXISTS performance_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            metric_date DATE NOT NULL,
            metric_type TEXT NOT NULL,
            metric_value REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, metric_date, metric_type)
        )
    `);

    userDb.run(`
        CREATE TABLE IF NOT EXISTS pmc_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date DATE NOT NULL,
            ctl REAL,
            atl REAL,
            tsb REAL,
            sb REAL,
            acute_load REAL,
            chronic_load REAL,
            acwr REAL,
            weekly_tss REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, date)
        )
    `);

    userDb.run(`
        CREATE TABLE IF NOT EXISTS daily_health (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date DATE NOT NULL,
            source TEXT,
            hrv_rmssd REAL,
            hrv_sdnn REAL,
            hrv_baseline REAL,
            hrv_recovery_score INTEGER,
            resting_hr REAL,
            resting_hr_source TEXT,
            max_hr REAL,
            sleep_duration_minutes INTEGER,
            sleep_deep_minutes INTEGER,
            sleep_light_minutes INTEGER,
            sleep_rem_minutes INTEGER,
            sleep_score INTEGER,
            sleep_quality TEXT,
            wake_ups INTEGER,
            bedtime TEXT,
            wake_time TEXT,
            steps INTEGER,
            active_minutes INTEGER,
            calories_burned INTEGER,
            weight REAL,
            body_fat REAL,
            bmi REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, date)
        )
    `);

    userDb.run(`
        CREATE TABLE IF NOT EXISTS user_preferences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            theme TEXT DEFAULT 'system',
            units TEXT DEFAULT 'metric',
            dashboard_widgets TEXT,
            notification_settings TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    userDb.run(`
        CREATE TABLE IF NOT EXISTS gear (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            brand TEXT,
            model TEXT,
            distance_km REAL DEFAULT 0,
            max_distance_km REAL,
            is_active INTEGER DEFAULT 1,
            is_default INTEGER DEFAULT 0,
            purchased_at DATE,
            retired_at DATE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

// Ensure user schema compatibility
function ensureUserSchemaCompatibility(userDb) {
    const alterStatements = [
        'ALTER TABLE performance_metrics ADD COLUMN recorded_at DATE',
        'ALTER TABLE performance_metrics ADD COLUMN metric_unit TEXT',
        'ALTER TABLE performance_metrics ADD COLUMN source TEXT',
        'ALTER TABLE performance_metrics ADD COLUMN date DATE',
        'ALTER TABLE performance_metrics ADD COLUMN value REAL',
    ];

    for (const statement of alterStatements) {
        try {
            userDb.run(statement);
        } catch (_) {}
    }

    const missingTables = [
        `CREATE TABLE IF NOT EXISTS user_preferences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            theme TEXT DEFAULT 'system',
            units TEXT DEFAULT 'metric',
            dashboard_widgets TEXT,
            notification_settings TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            message TEXT,
            data TEXT,
            read_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
    ];

    for (const stmt of missingTables) {
        try {
            userDb.run(stmt);
        } catch (_) {}
    }

    try { userDb.run('ALTER TABLE notifications ADD COLUMN title TEXT'); } catch (_) {}
    try { userDb.run('ALTER TABLE activities ADD COLUMN gear_id INTEGER'); } catch (_) {}
    try { userDb.run('ALTER TABLE activities ADD COLUMN efficiency_factor REAL'); } catch (_) {}

    try {
        const checkStmt = userDb.prepare(
            "SELECT COUNT(*) as cnt FROM performance_metrics WHERE (recorded_at IS NULL OR date IS NULL OR value IS NULL OR source IS NULL) AND metric_date IS NOT NULL"
        );
        const hasRows = checkStmt.step();
        const count = hasRows ? checkStmt.getAsObject().cnt : 0;
        checkStmt.free();

        if (count > 0) {
            userDb.run(`
                UPDATE performance_metrics
                SET recorded_at = COALESCE(recorded_at, metric_date),
                    date = COALESCE(date, metric_date),
                    value = COALESCE(value, metric_value),
                    source = COALESCE(source, 'calculated')
                WHERE recorded_at IS NULL OR date IS NULL OR value IS NULL OR source IS NULL
            `);
        }
    } catch (_) {}

    try {
        userDb.run('DROP TRIGGER IF EXISTS trg_perf_metrics_defaults');
    } catch (_) {}
    
    try {
        userDb.run(`
            CREATE TRIGGER trg_perf_metrics_defaults
            AFTER INSERT ON performance_metrics
            FOR EACH ROW
            BEGIN
                UPDATE performance_metrics
                SET metric_date = COALESCE(NEW.metric_date, NEW.recorded_at, NEW.date, DATE('now')),
                    recorded_at = COALESCE(NEW.recorded_at, NEW.metric_date, NEW.date, DATE('now')),
                    date = COALESCE(NEW.date, NEW.metric_date, NEW.recorded_at, DATE('now')),
                    value = COALESCE(NEW.value, NEW.metric_value),
                    source = COALESCE(NEW.source, 'calculated')
                WHERE id = NEW.id;
            END;
        `);
    } catch (_) {}
}

// Get or create user database by email
async function getUserDbByEmail(email) {
    const dbPath = getUserDbPath(email);

    // Check cache (also refreshes recency)
    const cached = lruGet(dbPath);
    if (cached !== undefined) {
        return cached;
    }

    let userDb;

    if (fs.existsSync(dbPath)) {
        const buffer = fs.readFileSync(dbPath);
        userDb = new SQL.Database(new Uint8Array(buffer));
    } else {
        userDb = new SQL.Database();
        initUserSchema(userDb);
        logger.info(`Created new user database: ${path.basename(dbPath)}`);
    }

    ensureUserSchemaCompatibility(userDb);
    saveUserDb(dbPath, userDb);

    // Cache the connection (LRU)
    lruSet(dbPath, userDb);

    return userDb;
}

// Helper functions for user databases (promisified)
function dbGetUser(userDb, query, params = []) {
    return new Promise((resolve, reject) => {
        try {
            const stmt = userDb.prepare(query);
            stmt.bind(params);
            const hasRow = stmt.step();
            const result = hasRow ? stmt.getAsObject() : {};
            stmt.free();
            resolve(hasRow ? result : null);
        } catch (err) {
            reject(err);
        }
    });
}

function dbRunUser(userDb, query, params = []) {
    return new Promise((resolve, reject) => {
        try {
            userDb.run(query, params);
            
            // Find the dbPath for this userDb instance
            const userDbCache = getCacheInstance();
            let foundPath = null;
            for (const [dbPath, cachedDb] of userDbCache.entries()) {
                if (cachedDb === userDb) {
                    foundPath = dbPath;
                    break;
                }
            }
            if (foundPath !== null) {
                lruGet(foundPath);
                saveUserDb(foundPath, userDb);
            }
            const result = userDb.exec("SELECT last_insert_rowid()");
            const lastID = result.length > 0 && result[0].values.length > 0 ? result[0].values[0][0] : null;
            resolve({ lastID });
        } catch (err) {
            reject(err);
        }
    });
}

function dbAllUser(userDb, query, params = []) {
    return new Promise((resolve, reject) => {
        try {
            const stmt = userDb.prepare(query);
            stmt.bind(params);
            const result = [];
            while (stmt.step()) {
                result.push(stmt.getAsObject());
            }
            stmt.free();
            resolve(result);
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = {
    setSql,
    setDataDir,
    sanitizeEmail,
    getUserDbPath,
    saveUserDb,
    initUserSchema,
    ensureUserSchemaCompatibility,
    getUserDbByEmail,
    dbGetUser,
    dbRunUser,
    dbAllUser,
};
