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
