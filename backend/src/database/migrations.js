'use strict';

const MIGRATIONS = [
    {
        version: '001_add_otp_lockout_columns',
        description: 'Add OTP lockout columns to users table',
        up: (db) => {
            try { db.run('ALTER TABLE users ADD COLUMN otp_attempts INTEGER DEFAULT 0'); } catch (_) { /* Column may not exist */ }
            try { db.run('ALTER TABLE users ADD COLUMN otp_locked_until DATETIME'); } catch (_) { /* Column may not exist */ }
        },
    },
    {
        version: '004_remove_other_providers',
        description: 'Remove Strava, Suunto, Decathlon columns from users table',
        up: (db) => {
            // Strava columns
            try { db.run('ALTER TABLE users DROP COLUMN strava_client_id'); } catch (_) { /* Column may not exist */ }
            try { db.run('ALTER TABLE users DROP COLUMN strava_client_secret'); } catch (_) { /* Column may not exist */ }
            try { db.run('ALTER TABLE users DROP COLUMN strava_access_token'); } catch (_) { /* Column may not exist */ }
            try { db.run('ALTER TABLE users DROP COLUMN strava_refresh_token'); } catch (_) { /* Column may not exist */ }
            try { db.run('ALTER TABLE users DROP COLUMN strava_expires_at'); } catch (_) { /* Column may not exist */ }
            try { db.run('ALTER TABLE users DROP COLUMN strava_athlete_id'); } catch (_) { /* Column may not exist */ }
            try { db.run('ALTER TABLE users DROP COLUMN strava_enabled'); } catch (_) { /* Column may not exist */ }
            // Suunto columns
            try { db.run('ALTER TABLE users DROP COLUMN suunto_username'); } catch (_) { /* Column may not exist */ }
            try { db.run('ALTER TABLE users DROP COLUMN suunto_password'); } catch (_) { /* Column may not exist */ }
            try { db.run('ALTER TABLE users DROP COLUMN suunto_enabled'); } catch (_) { /* Column may not exist */ }
            // Decathlon columns
            try { db.run('ALTER TABLE users DROP COLUMN decathlon_access_token'); } catch (_) { /* Column may not exist */ }
            try { db.run('ALTER TABLE users DROP COLUMN decathlon_refresh_token'); } catch (_) { /* Column may not exist */ }
            try { db.run('ALTER TABLE users DROP COLUMN decathlon_expires_at'); } catch (_) { /* Column may not exist */ }
            try { db.run('ALTER TABLE users DROP COLUMN decathlon_enabled'); } catch (_) { /* Column may not exist */ }
        },
    },
    {
        version: '024_add_group_id_to_challenges',
        description: 'Add group_id column to challenges table',
        up: (db) => {
            try { db.run('ALTER TABLE challenges ADD COLUMN group_id INTEGER REFERENCES training_groups(id)'); } catch (_) { /* Column may not exist */ }
        },
    },
    {
        version: '025_add_sync_queue_table',
        description: 'Add sync_queue table for retry mechanism',
        up: (db) => {
            db.run(`
                CREATE TABLE IF NOT EXISTS sync_queue (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    service TEXT NOT NULL,
                    status TEXT DEFAULT 'pending',
                    priority INTEGER DEFAULT 0,
                    attempts INTEGER DEFAULT 0,
                    max_attempts INTEGER DEFAULT 5,
                    last_error TEXT,
                    next_retry_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    started_at DATETIME,
                    completed_at DATETIME
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status)');
            db.run('CREATE INDEX IF NOT EXISTS idx_sync_queue_user ON sync_queue(user_id)');
        },
    },
    {
        version: '026_add_explore_tables',
        description: 'Add explore domain tables (segments, routes, heatmap)',
        up: (db) => {
            db.run(`
                CREATE TABLE IF NOT EXISTS segments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT DEFAULT '',
                    created_by INTEGER NOT NULL REFERENCES users(id),
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
                    activity_type TEXT DEFAULT 'Run',
                    is_public INTEGER DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_segments_created_by ON segments(created_by)');
            db.run('CREATE INDEX IF NOT EXISTS idx_segments_start_lat ON segments(start_lat)');
            db.run('CREATE INDEX IF NOT EXISTS idx_segments_start_lng ON segments(start_lng)');
            db.run('CREATE INDEX IF NOT EXISTS idx_segments_activity_type ON segments(activity_type)');
            db.run('CREATE INDEX IF NOT EXISTS idx_segments_is_public ON segments(is_public)');

            db.run(`
                CREATE TABLE IF NOT EXISTS segment_efforts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    segment_id INTEGER NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    activity_id INTEGER,
                    elapsed_time INTEGER NOT NULL,
                    moving_time INTEGER,
                    start_date DATETIME,
                    avg_watts REAL,
                    max_watts REAL,
                    avg_heartrate REAL,
                    max_heartrate REAL,
                    avg_speed REAL,
                    max_speed REAL,
                    is_kom INTEGER DEFAULT 0,
                    is_qom INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_segment_efforts_segment ON segment_efforts(segment_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_segment_efforts_user ON segment_efforts(user_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_segment_efforts_activity ON segment_efforts(activity_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_segment_efforts_elapsed ON segment_efforts(elapsed_time)');

            db.run(`
                CREATE TABLE IF NOT EXISTS routes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT DEFAULT '',
                    created_by INTEGER NOT NULL REFERENCES users(id),
                    distance REAL NOT NULL,
                    elevation_gain REAL DEFAULT 0,
                    elevation_loss REAL DEFAULT 0,
                    polyline TEXT,
                    activity_type TEXT DEFAULT 'Run',
                    estimated_duration INTEGER,
                    difficulty TEXT,
                    tags TEXT DEFAULT '[]',
                    usage_count INTEGER DEFAULT 0,
                    avg_rating REAL DEFAULT 0,
                    rating_count INTEGER DEFAULT 0,
                    is_public INTEGER DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_routes_created_by ON routes(created_by)');
            db.run('CREATE INDEX IF NOT EXISTS idx_routes_activity_type ON routes(activity_type)');
            db.run('CREATE INDEX IF NOT EXISTS idx_routes_difficulty ON routes(difficulty)');
            db.run('CREATE INDEX IF NOT EXISTS idx_routes_is_public ON routes(is_public)');
            db.run('CREATE INDEX IF NOT EXISTS idx_routes_avg_rating ON routes(avg_rating)');

            db.run(`
                CREATE TABLE IF NOT EXISTS route_favorites (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    route_id INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(route_id, user_id)
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_route_favorites_user ON route_favorites(user_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_route_favorites_route ON route_favorites(route_id)');

            db.run(`
                CREATE TABLE IF NOT EXISTS route_ratings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    route_id INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(route_id, user_id)
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_route_ratings_user ON route_ratings(user_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_route_ratings_route ON route_ratings(route_id)');

            db.run(`
                CREATE TABLE IF NOT EXISTS heatmap_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    lat REAL NOT NULL,
                    lng REAL NOT NULL,
                    intensity INTEGER DEFAULT 1,
                    activity_type TEXT DEFAULT 'Run',
                    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(lat, lng, activity_type)
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_heatmap_lat ON heatmap_data(lat)');
            db.run('CREATE INDEX IF NOT EXISTS idx_heatmap_lng ON heatmap_data(lng)');
            db.run('CREATE INDEX IF NOT EXISTS idx_heatmap_activity_type ON heatmap_data(activity_type)');
            db.run('CREATE INDEX IF NOT EXISTS idx_heatmap_intensity ON heatmap_data(intensity)');
        },
    },
    {
        version: '027_add_social_tables',
        description: 'Add all social domain tables (likes, draws, comments, reactions, photos, conversations, messaging, challenges, events, badges, XP, partner suggestions, shared stats)',
        up: (db) => {
            // Activity engagement tables
            db.run(`
                CREATE TABLE IF NOT EXISTS activity_likes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    activity_id INTEGER NOT NULL,
                    activity_owner_id INTEGER NOT NULL,
                    from_user_id INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(activity_id, activity_owner_id, from_user_id)
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_activity_likes_activity ON activity_likes(activity_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_activity_likes_owner ON activity_likes(activity_owner_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_activity_likes_from ON activity_likes(from_user_id)');

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
            db.run('CREATE INDEX IF NOT EXISTS idx_activity_draws_activity ON activity_draws(activity_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_activity_draws_from ON activity_draws(from_user_id)');

            db.run(`
                CREATE TABLE IF NOT EXISTS activity_comments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    activity_id INTEGER NOT NULL,
                    activity_owner_id INTEGER,
                    user_id INTEGER NOT NULL,
                    content TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_activity_comments_activity ON activity_comments(activity_id)');

            db.run(`
                CREATE TABLE IF NOT EXISTS activity_reactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    activity_id INTEGER NOT NULL,
                    activity_owner_id INTEGER,
                    user_id INTEGER NOT NULL,
                    reaction_type TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(activity_id, user_id, reaction_type)
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_activity_reactions_activity ON activity_reactions(activity_id)');

            db.run(`
                CREATE TABLE IF NOT EXISTS activity_photos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    activity_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    url TEXT NOT NULL,
                    caption TEXT,
                    lat REAL,
                    lng REAL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_activity_photos_activity ON activity_photos(activity_id)');

            // Conversations & Messaging
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
            db.run('CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type)');

            db.run(`
                CREATE TABLE IF NOT EXISTS conversation_participants (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    conversation_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(conversation_id, user_id)
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_conv_participants_conv ON conversation_participants(conversation_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_conv_participants_user ON conversation_participants(user_id)');

            db.run(`
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    conversation_id INTEGER NOT NULL,
                    sender_id INTEGER NOT NULL,
                    content TEXT NOT NULL,
                    message_type TEXT DEFAULT 'text',
                    attachment_url TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)');

            // Events
            db.run(`
                CREATE TABLE IF NOT EXISTS events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    group_id INTEGER,
                    title TEXT NOT NULL,
                    description TEXT,
                    location TEXT,
                    event_date DATETIME NOT NULL,
                    end_date DATETIME,
                    created_by INTEGER NOT NULL,
                    is_online INTEGER DEFAULT 0,
                    max_attendees INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_events_group ON events(group_id)');

            db.run(`
                CREATE TABLE IF NOT EXISTS event_attendees (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    event_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    status TEXT DEFAULT 'going',
                    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(event_id, user_id)
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_event_attendees_event ON event_attendees(event_id)');

            // Challenges (table may already partially exist from migration 024)
            db.run(`
                CREATE TABLE IF NOT EXISTS challenges (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT DEFAULT '',
                    type TEXT DEFAULT 'distance',
                    target_value REAL,
                    target_unit TEXT DEFAULT 'km',
                    duration_days INTEGER DEFAULT 30,
                    created_by INTEGER,
                    is_public INTEGER DEFAULT 1,
                    max_participants INTEGER,
                    challenge_mode TEXT DEFAULT 'quota',
                    milestones TEXT,
                    weekly_target REAL,
                    weekly_increase_pct INTEGER DEFAULT 10,
                    streak_days INTEGER,
                    frequency_per_week INTEGER,
                    sport_type TEXT DEFAULT 'any',
                    badge_icon TEXT DEFAULT '🏆',
                    group_id INTEGER,
                    is_team INTEGER DEFAULT 0,
                    start_date DATETIME,
                    end_date DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_challenges_public ON challenges(is_public)');
            db.run('CREATE INDEX IF NOT EXISTS idx_challenges_group ON challenges(group_id)');

            db.run(`
                CREATE TABLE IF NOT EXISTS user_challenges (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    challenge_id INTEGER NOT NULL,
                    start_date DATETIME,
                    end_date DATETIME,
                    progress REAL DEFAULT 0,
                    status TEXT DEFAULT 'active',
                    team_id INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, challenge_id)
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_user_challenges_user ON user_challenges(user_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_user_challenges_challenge ON user_challenges(challenge_id)');

            db.run(`
                CREATE TABLE IF NOT EXISTS challenge_teams (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    challenge_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    created_by INTEGER,
                    max_members INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_challenge_teams_challenge ON challenge_teams(challenge_id)');

            db.run(`
                CREATE TABLE IF NOT EXISTS challenge_team_members (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    team_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(team_id, user_id)
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_ctm_team ON challenge_team_members(team_id)');

            // Badges & XP
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
            db.run('CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id)');

            db.run(`
                CREATE TABLE IF NOT EXISTS user_xp (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL UNIQUE,
                    total_xp INTEGER DEFAULT 0,
                    level INTEGER DEFAULT 1,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Partner suggestions
            db.run(`
                CREATE TABLE IF NOT EXISTS partner_suggestions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    suggested_user_id INTEGER NOT NULL,
                    match_score INTEGER,
                    reason TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, suggested_user_id)
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_partner_suggestions_user ON partner_suggestions(user_id)');

            // Shared stats for leaderboard
            db.run(`
                CREATE TABLE IF NOT EXISTS shared_stats (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    stat_type TEXT NOT NULL,
                    stat_value REAL NOT NULL,
                    stat_unit TEXT,
                    period TEXT DEFAULT 'week',
                    shared_anonymously INTEGER DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, stat_type, period)
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_shared_stats_type_period ON shared_stats(stat_type, period)');

            // Extended user profiles for partner matching
            db.run(`
                CREATE TABLE IF NOT EXISTS user_profiles_extended (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL UNIQUE,
                    level TEXT,
                    favorite_sports TEXT,
                    location TEXT,
                    training_frequency TEXT,
                    bio TEXT,
                    goals TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
        },
    },
    {
        version: '028_add_user_credentials_table',
        description: 'Add user_credentials table for third-party provider credentials',
        up: (db) => {
            db.run(`
                CREATE TABLE IF NOT EXISTS user_credentials (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    provider TEXT NOT NULL,
                    username TEXT,
                    password TEXT,
                    access_token TEXT,
                    refresh_token TEXT,
                    expires_at INTEGER,
                    athlete_id INTEGER,
                    user_id_provider TEXT,
                    enabled INTEGER DEFAULT 1,
                    last_sync DATETIME,
                    sync_error TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, provider)
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_user_credentials_user ON user_credentials(user_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_user_credentials_provider ON user_credentials(provider)');
        },
    },
    {
        version: '029_fix_explore_cascade_delete',
        description: 'Add ON DELETE CASCADE to segments and routes foreign keys for proper cleanup',
        up: (db) => {
            // First, create temporary tables to preserve data
            try {
                db.run(`
                    CREATE TABLE IF NOT EXISTS segments_backup_029 (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        description TEXT DEFAULT '',
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
                        activity_type TEXT DEFAULT 'Run',
                        is_public INTEGER DEFAULT 1,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                db.run('INSERT INTO segments_backup_029 SELECT * FROM segments');
                db.run('DROP TABLE segments');
                db.run(`
                    CREATE TABLE segments (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        description TEXT DEFAULT '',
                        created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
                        activity_type TEXT DEFAULT 'Run',
                        is_public INTEGER DEFAULT 1,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                db.run('INSERT INTO segments SELECT * FROM segments_backup_029');
                db.run('DROP TABLE segments_backup_029');
            } catch (e) {
                try { db.run('DROP TABLE IF EXISTS segments_backup_029'); } catch (_) {}
            }

            // Same for routes table
            try {
                db.run(`
                    CREATE TABLE IF NOT EXISTS routes_backup_029 (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        description TEXT DEFAULT '',
                        created_by INTEGER NOT NULL,
                        distance REAL NOT NULL,
                        elevation_gain REAL DEFAULT 0,
                        elevation_loss REAL DEFAULT 0,
                        polyline TEXT,
                        activity_type TEXT DEFAULT 'Run',
                        estimated_duration INTEGER,
                        difficulty TEXT,
                        tags TEXT DEFAULT '[]',
                        usage_count INTEGER DEFAULT 0,
                        avg_rating REAL DEFAULT 0,
                        rating_count INTEGER DEFAULT 0,
                        is_public INTEGER DEFAULT 1,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                db.run('INSERT INTO routes_backup_029 SELECT * FROM routes');
                db.run('DROP TABLE routes');
                db.run(`
                    CREATE TABLE routes (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        description TEXT DEFAULT '',
                        created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        distance REAL NOT NULL,
                        elevation_gain REAL DEFAULT 0,
                        elevation_loss REAL DEFAULT 0,
                        polyline TEXT,
                        activity_type TEXT DEFAULT 'Run',
                        estimated_duration INTEGER,
                        difficulty TEXT,
                        tags TEXT DEFAULT '[]',
                        usage_count INTEGER DEFAULT 0,
                        avg_rating REAL DEFAULT 0,
                        rating_count INTEGER DEFAULT 0,
                        is_public INTEGER DEFAULT 1,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                db.run('INSERT INTO routes SELECT * FROM routes_backup_029');
                db.run('DROP TABLE routes_backup_029');
            } catch (e) {
                try { db.run('DROP TABLE IF EXISTS routes_backup_029'); } catch (_) {}
            }
        },
    },
    {
        version: '030_add_activity_shares_table',
        description: 'Add activity_shares table for tracking share events',
        up: (db) => {
            db.run(`
                CREATE TABLE IF NOT EXISTS activity_shares (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    activity_id INTEGER NOT NULL,
                    share_type TEXT NOT NULL,
                    platform TEXT,
                    metadata TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    ip_address TEXT,
                    user_agent TEXT
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_activity_shares_user ON activity_shares(user_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_activity_shares_activity ON activity_shares(activity_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_activity_shares_type ON activity_shares(share_type)');
            db.run('CREATE INDEX IF NOT EXISTS idx_activity_shares_created ON activity_shares(created_at)');
            db.run('CREATE INDEX IF NOT EXISTS idx_activity_shares_user_activity ON activity_shares(user_id, activity_id)');
        },
    },
    {
        version: '031_add_default_shared_fields_to_users',
        description: 'Add default_shared_fields column to users table for share settings',
        up: (db) => {
            try { 
                db.run('ALTER TABLE users ADD COLUMN default_shared_fields TEXT DEFAULT \'["distance","time","pace","elevation","map"]\''); 
            } catch (_) { /* Column may already exist */ }
        },
    },
];

async function runMigrations(db) {
    db.run(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            version     TEXT    NOT NULL UNIQUE,
            applied_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
            description TEXT
        )
    `);

    const sorted = [...MIGRATIONS].sort((a, b) => a.version.localeCompare(b.version));

    for (const migration of sorted) {
        const stmt = db.prepare('SELECT version FROM schema_migrations WHERE version = ?');
        stmt.bind([migration.version]);
        const hasRow = stmt.step();
        const existing = hasRow ? stmt.getAsObject() : {};
        stmt.free();

        if (Object.keys(existing).length > 0) continue;

        try {
            migration.up(db);
        } catch (err) {
            const { logger } = require('../utils/logger');
            logger.error('[Migration] Failed to apply migration', { version: migration.version, error: err.message });
            throw new Error('Migration failed');
        }

        db.run(
            'INSERT INTO schema_migrations (version, description) VALUES (?, ?)',
            [migration.version, migration.description]
        );
    }
}

module.exports = { MIGRATIONS, runMigrations };
