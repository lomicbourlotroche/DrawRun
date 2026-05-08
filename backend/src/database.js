/* eslint-disable security/detect-non-literal-fs-filename, no-empty, no-process-exit, no-useless-catch, unused-imports/no-unused-vars */
/**
 * ============================================================
 * DRAWRUN DATABASE v4.0 - Per-User Database Architecture
 * ============================================================
 * 
 * NOUVELLE ARCHITECTURE :
 * - main.db : contient uniquement la table users (authentification)
 * - user_{email}.db : chaque utilisateur a sa propre DB
 * - Stockage : /data (dans le dossier racine DrawRun-New)
 * 
 * Patterns:
 * - Isolation complète des données par utilisateur
 * - Email utilisé dans le nom du fichier (sanitized)
 * - Cache des connexions pour performance
 * 
 * @module database
 */

'use strict';

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const { logger } = require('./logger');

// Data directory - dans le dossier DrawRun-Data sous DrawRun-New
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../DrawRun-Data');
const MAIN_DB_PATH = path.join(DATA_DIR, 'main.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    logger.info(`Created data directory: ${DATA_DIR}`);
}

// SQL constructor (initialized asynchronously)
let SQL;
let mainDb;
let initialized = false;
let initPromise;

// LRU Cache for user database connections
const LRU_MAX_SIZE = 100;
const userDbCache = new Map();

/**
 * Get a db from the LRU cache, moving it to the MRU position on hit.
 * @param {string} dbPath
 * @returns {object|undefined} The cached Database instance, or undefined if absent.
 */
function lruGet(dbPath) {
    if (!userDbCache.has(dbPath)) return undefined;
    const db = userDbCache.get(dbPath);
    // Delete and re-insert to move to MRU position (Map preserves insertion order)
    userDbCache.delete(dbPath);
    userDbCache.set(dbPath, db);
    return db;
}

/**
 * Insert a db into the LRU cache. Evicts the LRU entry first if at capacity.
 * @param {string} dbPath
 * @param {object} db
 */
function lruSet(dbPath, db) {
    if (userDbCache.size >= LRU_MAX_SIZE) {
        lruEvictLRU();
    }
    userDbCache.set(dbPath, db);
}

/**
 * Evict the least recently used entry from the cache.
 * Persists the evicted DB to disk and closes it.
 */
function lruEvictLRU() {
    // The first key in the Map is the LRU entry (oldest insertion)
    const lruPath = userDbCache.keys().next().value;
    if (lruPath === undefined) return;
    const lruDb = userDbCache.get(lruPath);

    try {
        saveUserDb(lruPath, lruDb);
    } catch (err) {
        logger.error('[LRU] Failed to persist DB on eviction', { path: lruPath, error: err.message });
    }

    if (lruDb && typeof lruDb.close === 'function') {
        lruDb.close();
    }

    userDbCache.delete(lruPath);
}

/**
 * Return current cache statistics.
 * @returns {{ size: number, maxSize: number }}
 */
function getCacheStats() {
    return { size: userDbCache.size, maxSize: LRU_MAX_SIZE };
}

// ============================================================================
// SCHEMA MIGRATIONS
// ============================================================================

const MIGRATIONS = [
    {
        version: '001_add_otp_lockout_columns',
        description: 'Add OTP lockout columns to users table',
        up: (db) => {
            try { db.run('ALTER TABLE users ADD COLUMN otp_attempts INTEGER DEFAULT 0'); } catch (_) {}
            try { db.run('ALTER TABLE users ADD COLUMN otp_locked_until DATETIME'); } catch (_) {}
        },
    },
    {
        version: '002_add_twofa_pending',
        description: 'Add twofa_pending column to users table',
        up: (db) => {
            try { db.run('ALTER TABLE users ADD COLUMN twofa_pending INTEGER DEFAULT 0'); } catch (_) {}
        },
    },
    {
        version: '003_add_activity_draws',
        description: 'Add activity_draws table for DrawRun draws system',
        up: (db) => {
            db.run(`
                CREATE TABLE IF NOT EXISTS activity_draws (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    activity_id INTEGER NOT NULL,
                    activity_owner_id INTEGER NOT NULL,
                    from_user_id INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(activity_id, from_user_id)
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_draws_activity ON activity_draws(activity_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_draws_user ON activity_draws(from_user_id)');
        },
    },
    {
        version: '004_add_segments_system',
        description: 'Add segments and segment_efforts tables',
        up: (db) => {
            db.run(`
                CREATE TABLE IF NOT EXISTS segments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    created_by INTEGER NOT NULL,
                    start_lat REAL NOT NULL,
                    start_lng REAL NOT NULL,
                    end_lat REAL NOT NULL,
                    end_lng REAL NOT NULL,
                    distance REAL NOT NULL,
                    elevation_gain REAL DEFAULT 0,
                    elevation_loss REAL DEFAULT 0,
                    avg_grade REAL,
                    max_grade REAL,
                    polyline TEXT,
                    is_public INTEGER DEFAULT 1,
                    activity_type TEXT DEFAULT 'Run',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            db.run(`
                CREATE TABLE IF NOT EXISTS segment_efforts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    segment_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    activity_id INTEGER NOT NULL,
                    elapsed_time INTEGER NOT NULL,
                    moving_time INTEGER,
                    start_date DATETIME NOT NULL,
                    avg_watts REAL,
                    max_watts REAL,
                    avg_heartrate REAL,
                    max_heartrate REAL,
                    avg_speed REAL,
                    max_speed REAL,
                    pr_rank INTEGER,
                    is_kom INTEGER DEFAULT 0,
                    is_qom INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(segment_id, user_id, activity_id)
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_segments_location ON segments(start_lat, start_lng)');
            db.run('CREATE INDEX IF NOT EXISTS idx_segments_type ON segments(activity_type)');
            db.run('CREATE INDEX IF NOT EXISTS idx_efforts_segment ON segment_efforts(segment_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_efforts_user ON segment_efforts(user_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_efforts_time ON segment_efforts(elapsed_time)');
        },
    },
    {
        version: '005_add_routes_system',
        description: 'Add routes and route_favorites tables',
        up: (db) => {
            db.run(`
                CREATE TABLE IF NOT EXISTS routes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    created_by INTEGER NOT NULL,
                    distance REAL NOT NULL,
                    elevation_gain REAL DEFAULT 0,
                    elevation_loss REAL DEFAULT 0,
                    polyline TEXT NOT NULL,
                    is_public INTEGER DEFAULT 1,
                    activity_type TEXT DEFAULT 'Run',
                    estimated_duration INTEGER,
                    difficulty TEXT,
                    tags TEXT,
                    usage_count INTEGER DEFAULT 0,
                    avg_rating REAL,
                    rating_count INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            db.run(`
                CREATE TABLE IF NOT EXISTS route_favorites (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    route_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(route_id, user_id)
                )
            `);
            db.run(`
                CREATE TABLE IF NOT EXISTS route_ratings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    route_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    rating INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(route_id, user_id)
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_routes_type ON routes(activity_type)');
            db.run('CREATE INDEX IF NOT EXISTS idx_routes_public ON routes(is_public)');
            db.run('CREATE INDEX IF NOT EXISTS idx_route_favs_user ON route_favorites(user_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_route_ratings ON route_ratings(route_id)');
        },
    },
    {
        version: '006_add_activity_comments',
        description: 'Add activity_comments table',
        up: (db) => {
            db.run(`
                CREATE TABLE IF NOT EXISTS activity_comments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    activity_id INTEGER NOT NULL,
                    activity_owner_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    content TEXT NOT NULL,
                    parent_id INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
             db.run('CREATE INDEX IF NOT EXISTS idx_comments_activity ON activity_comments(activity_id)');
             db.run('CREATE INDEX IF NOT EXISTS idx_comments_user ON activity_comments(user_id)');
             // Additional performance indexes
             try { db.run('CREATE INDEX IF NOT EXISTS idx_activities_source ON activities(source, source_id)'); } catch (_) {}
             try { db.run('CREATE INDEX IF NOT EXISTS idx_activities_start_date ON activities(start_date DESC)'); } catch (_) {}
             try { db.run('CREATE INDEX IF NOT EXISTS idx_metrics_type ON performance_metrics(metric_type, recorded_at DESC)'); } catch (_) {}
             try { db.run('CREATE INDEX IF NOT EXISTS idx_metrics_user ON performance_metrics(user_id, metric_type)'); } catch (_) {}
         },
     },
     {
         version: '009_add_social_feed',
        description: 'Add social feed tables',
        up: (db) => {
            db.run(`
                CREATE TABLE IF NOT EXISTS social_feed (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    activity_id INTEGER,
                    segment_id INTEGER,
                    route_id INTEGER,
                    achievement_id INTEGER,
                    content TEXT,
                    visibility TEXT DEFAULT 'friends',
                    likes_count INTEGER DEFAULT 0,
                    comments_count INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            db.run(`
                CREATE TABLE IF NOT EXISTS feed_likes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    feed_item_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(feed_item_id, user_id)
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_feed_user ON social_feed(user_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_feed_created ON social_feed(created_at DESC)');
        },
    },
    {
        version: '010_add_heatmap_data',
        description: 'Add heatmap data table for popular routes',
        up: (db) => {
            db.run(`
                CREATE TABLE IF NOT EXISTS heatmap_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    lat REAL NOT NULL,
                    lng REAL NOT NULL,
                    intensity INTEGER DEFAULT 1,
                    activity_type TEXT DEFAULT 'Run',
                    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_heatmap_location ON heatmap_data(lat, lng)');
            db.run('CREATE INDEX IF NOT EXISTS idx_heatmap_type ON heatmap_data(activity_type)');
        },
    },
    {
        version: '011_add_friends_and_likes',
        description: 'Add friends, activity_likes, activity_reactions, shared_stats tables',
        up: (db) => {
            db.run(`
                CREATE TABLE IF NOT EXISTS friends (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    friend_id INTEGER NOT NULL,
                    status TEXT DEFAULT 'pending',
                    accepted_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, friend_id)
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_friends_user ON friends(user_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_friends_friend ON friends(friend_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status)');

            db.run(`
                CREATE TABLE IF NOT EXISTS activity_likes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    activity_id INTEGER NOT NULL,
                    activity_owner_id INTEGER NOT NULL,
                    from_user_id INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(activity_id, from_user_id)
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_likes_activity ON activity_likes(activity_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_likes_user ON activity_likes(from_user_id)');

            db.run(`
                CREATE TABLE IF NOT EXISTS activity_reactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    activity_id INTEGER NOT NULL,
                    activity_owner_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    reaction_type TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(activity_id, user_id, reaction_type)
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_reactions_activity ON activity_reactions(activity_id)');

            db.run(`
                CREATE TABLE IF NOT EXISTS shared_stats (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    stat_type TEXT NOT NULL,
                    stat_value REAL,
                    stat_unit TEXT,
                    period TEXT DEFAULT 'week',
                    shared_anonymously INTEGER DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, stat_type, period)
                )
            `);
        },
    },
    {
        version: '012_add_groups',
        description: 'Add training_groups and group_members tables',
        up: (db) => {
            db.run(`
                CREATE TABLE IF NOT EXISTS training_groups (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    creator_id INTEGER NOT NULL,
                    is_private INTEGER DEFAULT 1,
                    invite_code TEXT UNIQUE,
                    member_count INTEGER DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            db.run(`
                CREATE TABLE IF NOT EXISTS group_members (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    group_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    role TEXT DEFAULT 'member',
                    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(group_id, user_id)
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id)');
        },
    },
    {
        version: '013_add_notifications',
        description: 'Add notifications table',
        up: (db) => {
            db.run(`
                CREATE TABLE IF NOT EXISTS notifications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    type TEXT NOT NULL,
                    title TEXT,
                    message TEXT NOT NULL,
                    data TEXT,
                    read_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_notif_read ON notifications(user_id, read_at)');
        },
    },
    {
        version: '014_add_conversations',
        description: 'Add conversations, conversation_participants, messages tables',
        up: (db) => {
            db.run(`
                CREATE TABLE IF NOT EXISTS conversations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    type TEXT DEFAULT 'private',
                    group_id INTEGER,
                    title TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            db.run(`
                CREATE TABLE IF NOT EXISTS conversation_participants (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    conversation_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(conversation_id, user_id)
                )
            `);
            db.run(`
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    conversation_id INTEGER NOT NULL,
                    sender_id INTEGER NOT NULL,
                    content TEXT NOT NULL,
                    message_type TEXT DEFAULT 'text',
                    attachment_url TEXT,
                    read_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_conv_participants ON conversation_participants(user_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at)');
        },
    },
    {
        version: '015_add_challenges',
        description: 'Add challenges, user_challenges, challenge_teams tables',
        up: (db) => {
            db.run(`
                CREATE TABLE IF NOT EXISTS challenges (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT,
                    type TEXT DEFAULT 'distance',
                    target_value REAL,
                    target_unit TEXT DEFAULT 'km',
                    duration_days INTEGER DEFAULT 30,
                    created_by INTEGER NOT NULL,
                    is_public INTEGER DEFAULT 1,
                    is_team INTEGER DEFAULT 0,
                    max_participants INTEGER,
                    end_date DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            db.run(`
                CREATE TABLE IF NOT EXISTS user_challenges (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    challenge_id INTEGER NOT NULL,
                    team_id INTEGER,
                    progress REAL DEFAULT 0,
                    status TEXT DEFAULT 'active',
                    start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    end_date DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, challenge_id)
                )
            `);
            db.run(`
                CREATE TABLE IF NOT EXISTS challenge_teams (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    challenge_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    created_by INTEGER NOT NULL,
                    max_members INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            db.run(`
                CREATE TABLE IF NOT EXISTS challenge_team_members (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    team_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(team_id, user_id)
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_challenges_public ON challenges(is_public)');
            db.run('CREATE INDEX IF NOT EXISTS idx_user_challenges_user ON user_challenges(user_id)');
        },
    },
    {
        version: '016_add_gamification',
        description: 'Add badges, user_badges, user_xp, events tables',
        up: (db) => {
            db.run(`
                CREATE TABLE IF NOT EXISTS badges (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    icon TEXT,
                    xp_reward INTEGER DEFAULT 0,
                    criteria TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            db.run(`
                CREATE TABLE IF NOT EXISTS user_badges (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    badge_id INTEGER NOT NULL,
                    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, badge_id)
                )
            `);
            db.run(`
                CREATE TABLE IF NOT EXISTS user_xp (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL UNIQUE,
                    total_xp INTEGER DEFAULT 0,
                    level INTEGER DEFAULT 1,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            db.run(`
                CREATE TABLE IF NOT EXISTS events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    group_id INTEGER,
                    title TEXT NOT NULL,
                    description TEXT,
                    event_date DATETIME,
                    location TEXT,
                    activity_type TEXT,
                    created_by INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            db.run(`
                CREATE TABLE IF NOT EXISTS event_participants (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    event_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    status TEXT DEFAULT 'going',
                    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(event_id, user_id)
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_user_xp_user ON user_xp(user_id)');
        },
    },
    {
        version: '017_push_subscriptions',
        description: 'Add push_subscriptions table for Web Push notifications',
        up: (db) => {
            db.run(`
                CREATE TABLE IF NOT EXISTS push_subscriptions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    endpoint TEXT NOT NULL UNIQUE,
                    p256dh TEXT NOT NULL,
                    auth TEXT NOT NULL,
                    user_agent TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id)');
        },
    },
    {
        version: '018_weather_cache',
        description: 'Add weather_cache table for activity weather data',
        up: (db) => {
            db.run(`
                CREATE TABLE IF NOT EXISTS weather_cache (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    activity_id INTEGER NOT NULL UNIQUE,
                    data TEXT NOT NULL,
                    fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_weather_activity ON weather_cache(activity_id)');
        },
    },
    {
        version: '019_add_race_plans',
        description: 'Add race_plans table for saved race planning strategies',
        up: (db) => {
            db.run(`
                CREATE TABLE IF NOT EXISTS race_plans (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    distance REAL NOT NULL,
                    target_pace REAL NOT NULL,
                    total_time INTEGER NOT NULL,
                    elevation_profile TEXT DEFAULT 'flat',
                    fatigue INTEGER DEFAULT 0,
                    splits TEXT NOT NULL,
                    nutrition_strategy TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_race_plans_user ON race_plans(user_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_race_plans_created ON race_plans(created_at DESC)');
        },
    },
    {
        version: '020_add_decathlon_columns',
        description: 'Add Decathlon OAuth columns to users table',
        up: (db) => {
            try { db.run('ALTER TABLE users ADD COLUMN decathlon_enabled INTEGER DEFAULT 0'); } catch (_) {}
            try { db.run('ALTER TABLE users ADD COLUMN decathlon_access_token TEXT'); } catch (_) {}
            try { db.run('ALTER TABLE users ADD COLUMN decathlon_refresh_token TEXT'); } catch (_) {}
            try { db.run('ALTER TABLE users ADD COLUMN decathlon_expires_at INTEGER'); } catch (_) {}
            try { db.run('ALTER TABLE users ADD COLUMN decathlon_user_id TEXT'); } catch (_) {}
        },
    },
    {
        version: '021_add_activity_share_settings',
        description: 'Add share_to_friends, share_to_groups, shared_data_fields columns to activities table',
        up: (db) => {
            // share_to_friends: 1 = visible dans le fil d'amis (défaut: 1)
            try { db.run('ALTER TABLE activities ADD COLUMN share_to_friends INTEGER DEFAULT 1'); } catch (_) {}
            // share_to_groups: JSON array d'IDs de groupes, null = aucun groupe, '[]' = tous les groupes
            try { db.run('ALTER TABLE activities ADD COLUMN share_to_groups TEXT DEFAULT NULL'); } catch (_) {}
            // shared_data_fields: JSON array des champs partagés (ex: ["distance","time","hr","map","power"])
            try { db.run("ALTER TABLE activities ADD COLUMN shared_data_fields TEXT DEFAULT '[\"distance\",\"time\",\"pace\",\"elevation\",\"map\"]'"); } catch (_) {}
        },
    },
];

async function runMigrations(db) {
    // Create schema_migrations table if not exists
    db.run(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            version     TEXT    NOT NULL UNIQUE,
            applied_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
            description TEXT
        )
    `);

    // Sort migrations ascending by version
    const sorted = [...MIGRATIONS].sort((a, b) => a.version.localeCompare(b.version));

    for (const migration of sorted) {
        // Check if already applied
        const stmt = db.prepare('SELECT version FROM schema_migrations WHERE version = ?');
        stmt.bind([migration.version]);
        const hasRow = stmt.step();
        const existing = hasRow ? stmt.getAsObject() : {};
        stmt.free();

        if (Object.keys(existing).length > 0) {
            // Already applied, skip
            continue;
        }

        // Apply migration
        try {
            migration.up(db);
        } catch (err) {
            logger.error('[Migration] Failed to apply migration', { version: migration.version, error: err.message });
            process.exit(1);
        }

        // Record as applied
        db.run(
            'INSERT INTO schema_migrations (version, description) VALUES (?, ?)',
            [migration.version, migration.description]
        );
    }
}

async function getMigrationStatus() {
    return dbAllMain('SELECT version, applied_at, description FROM schema_migrations ORDER BY version ASC', []);
}

// Initialize sql.js (call once)
function initSQL() {
    if (initPromise) return initPromise;
    
    initPromise = initSqlJs().then(sqlModule => {
        SQL = sqlModule;
        return SQL;
    });
    
    return initPromise;
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

// Save main database to disk
function saveMainDb() {
    try {
        if (!mainDb) return;
        const data = mainDb.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(MAIN_DB_PATH, buffer);
    } catch (err) {
        logger.error('❌ Failed to save main database:', err.message);
    }
}

// Save user database to disk
function saveUserDb(dbPath, userDb) {
    try {
        const data = userDb.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbPath, buffer);
    } catch (err) {
        logger.error('❌ Failed to save user database:', err.message);
    }
}

// Initialize main database (users table only)
async function initMainDb() {
    await initSQL();
    
    try {
        if (fs.existsSync(MAIN_DB_PATH)) {
            const buffer = fs.readFileSync(MAIN_DB_PATH);
            mainDb = new SQL.Database(new Uint8Array(buffer));
        } else {
            mainDb = new SQL.Database();
            
            // Create users table in main.db
            mainDb.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT,
                    name TEXT,
                    profile_data TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_login DATETIME,
                    email_verified INTEGER DEFAULT 0,
                    consent_given INTEGER DEFAULT 0,
                    consent_date DATETIME,
                    strava_enabled INTEGER DEFAULT 0,
                    strava_client_id TEXT,
                    strava_client_secret TEXT,
                    strava_access_token TEXT,
                    strava_refresh_token TEXT,
                    strava_expires_at INTEGER,
                    strava_athlete_id INTEGER,
                    garmin_enabled INTEGER DEFAULT 0,
                    garmin_username TEXT,
                    garmin_password TEXT,
                    suunto_enabled INTEGER DEFAULT 0,
                    suunto_username TEXT,
                    suunto_password TEXT,
                    decathlon_enabled INTEGER DEFAULT 0,
                    decathlon_access_token TEXT,
                    decathlon_refresh_token TEXT,
                    decathlon_expires_at INTEGER,
                    decathlon_user_id TEXT,
                    twofa_enabled INTEGER DEFAULT 0,
                    totp_secret TEXT,
                    twofa_pending INTEGER DEFAULT 0,
                    otp TEXT,
                    otp_expiry DATETIME,
                    otp_attempts INTEGER DEFAULT 0,
                    otp_locked_until DATETIME
                )
            `);
            
            saveMainDb();
        }
        
        initialized = true;
        logger.info('Connected to main database (main.db)');

        // Run schema migrations
        await runMigrations(mainDb);

        // Refresh tokens table (for jwt_tokens.js)
        const { ensureRefreshTokensTable } = require('./jwt_tokens');
        ensureRefreshTokensTable(mainDb);

        saveMainDb();
    } catch (err) {
        logger.error('❌ Failed to initialize main database:', err.message);
        process.exit(1);
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

function ensureUserSchemaCompatibility(userDb) {
    // Keep compatibility with both old and new metric query styles.
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
        } catch (_) {
            // Column already exists.
        }
    }

    // Ensure missing tables are created for existing user databases
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
        `CREATE TABLE IF NOT EXISTS friends (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            friend_id INTEGER NOT NULL,
            status TEXT DEFAULT 'pending',
            accepted_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, friend_id)
        )`,
        `CREATE TABLE IF NOT EXISTS training_groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            creator_id INTEGER NOT NULL,
            is_private INTEGER DEFAULT 1,
            invite_code TEXT UNIQUE,
            member_count INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS group_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            group_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            role TEXT DEFAULT 'member',
            joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(group_id, user_id)
        )`,
        `CREATE TABLE IF NOT EXISTS race_plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            distance REAL NOT NULL,
            target_pace REAL NOT NULL,
            total_time INTEGER NOT NULL,
            elevation_profile TEXT DEFAULT 'flat',
            fatigue INTEGER DEFAULT 0,
            splits TEXT NOT NULL,
            nutrition_strategy TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS gear (
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
        )`,
    ];

    for (const stmt of missingTables) {
        try {
            userDb.run(stmt);
        } catch (_) {
            // Table already exists
        }
    }

    // Add new columns to activities
    const activityUpdates = [
        'ALTER TABLE activities ADD COLUMN gear_id INTEGER',
        'ALTER TABLE activities ADD COLUMN efficiency_factor REAL',
    ];

    for (const statement of activityUpdates) {
        try {
            userDb.run(statement);
        } catch (_) {}
    }

    // Only run UPDATE when there are rows that actually need migration
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
    } catch (_) {
        // Table might not exist yet, safe to skip
    }

    try {
        userDb.run('DROP TRIGGER IF EXISTS trg_perf_metrics_defaults');
    } catch (_) {}
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
}

// Get or create user database by email
async function getUserDbByEmail(email) {
    const dbPath = getUserDbPath(email);
    
    // Check cache (also refreshes recency)
    const cached = lruGet(dbPath);
    if (cached !== undefined) {
        return cached;
    }
    
    await initSQL();
    
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

// Get user database by user ID (fetch email from main.db first)
async function getUserDb(userId) {
    if (!initialized) await initMainDb();
    
    try {
        const stmt = mainDb.prepare('SELECT email FROM users WHERE id = ?');
        stmt.bind([userId]);
        const hasRow = stmt.step();
        const result = hasRow ? stmt.getAsObject() : {};
        stmt.free();
        
        if (!result || !result.email) {
            throw new Error('User not found');
        }
        
        return await getUserDbByEmail(result.email);
    } catch (err) {
        throw err;
    }
}

// Helper functions for main database (promisified)
function dbGetMain(query, params = []) {
    return new Promise((resolve, reject) => {
        try {
            if (!initialized) {
                return reject(new Error('Database not initialized'));
            }
            const stmt = mainDb.prepare(query);
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

function dbRunMain(query, params = []) {
    return new Promise((resolve, reject) => {
        try {
            if (!initialized) {
                return reject(new Error('Database not initialized'));
            }
            mainDb.run(query, params);
            saveMainDb();
            
            // Get last insert ID (sql.js last_insert_rowid() can return 0, use MAX(id) fallback)
            const stmt = mainDb.prepare('SELECT last_insert_rowid() as id');
            stmt.step();
            const result = stmt.getAsObject();
            stmt.free();
            
            // If last_insert_rowid() returns 0 or undefined, fall back to MAX(id)
            let lastID = result.id;
            if (!lastID || lastID === 0) {
                const maxStmt = mainDb.prepare('SELECT MAX(id) as id FROM users');
                maxStmt.step();
                const maxResult = maxStmt.getAsObject();
                maxStmt.free();
                lastID = maxResult.id;
            }
            resolve({ lastID });
        } catch (err) {
            reject(err);
        }
    });
}

function dbAllMain(query, params = []) {
    return new Promise((resolve, reject) => {
        try {
            if (!initialized) {
                return reject(new Error('Database not initialized'));
            }
            const stmt = mainDb.prepare(query);
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

// Export functions
module.exports = {
    // Initialization
    initMainDb,
    initSQL,
    
    // Main database helpers
    dbGetMain,
    dbRunMain,
    dbAllMain,
    
    // User database functions
    getUserDb,
    getUserDbByEmail,
    getUserDbPath,
    sanitizeEmail,
    
    // User database helpers
    dbGetUser,
    dbRunUser,
    dbAllUser,
    
    // Save functions
    saveMainDb,
    saveUserDb,
    
    // State
    isInitialized: () => initialized,
    getMainDb: () => mainDb,
    
    // LRU cache helpers
    getCacheStats,
    lruGet,
    lruSet,
    lruEvictLRU,
    LRU_MAX_SIZE,
    
    // Migration system
    runMigrations,
    getMigrationStatus,
    MIGRATIONS,
    
    // Legacy compatibility (will be removed)
    db: () => mainDb,
    dbGet: dbGetMain,
    dbRun: dbRunMain,
    dbAll: dbAllMain,
    usersDb: () => mainDb,
    getUserDbLegacy: (userId) => mainDb
};
