/**
 * ============================================================
 * MAIN DATABASE - Shared Database Management
 * ============================================================
 * Functions for managing the main database (users, tokens, migrations).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

let SQL;
let mainDb;
let initialized = false;
let DATA_DIR;
let MAIN_DB_PATH;

function setSql(sqlModule) {
    SQL = sqlModule;
}

function setDataDir(dir) {
    DATA_DIR = dir;
    MAIN_DB_PATH = path.join(DATA_DIR, 'main.db');
    
    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        logger.info(`Created data directory: ${DATA_DIR}`);
    }
}

// Initialize sql.js (call once)
function initSQL() {
    const initSqlJs = require('sql.js');
    return initSqlJs();
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
                    password_hash TEXT NOT NULL,
                    name TEXT DEFAULT '',
                    profile_data TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_login DATETIME,
                    email_verified INTEGER DEFAULT 0,
                    consent_given INTEGER DEFAULT 0,
                    consent_date DATETIME,
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
        const { runMigrations } = require('./migrations');
        runMigrations(mainDb);

        // Refresh tokens table (for jwt_tokens.js)
        const { ensureRefreshTokensTable } = require('../utils/jwt');
        ensureRefreshTokensTable(mainDb);

        saveMainDb();
    } catch (err) {
        throw new Error('Failed to initialize main database: ' + err.message);
    }
}

// Save main database to disk
function saveMainDb() {
    try {
        if (!mainDb) return;
        const data = mainDb.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(MAIN_DB_PATH, buffer);
    } catch (err) {
        logger.error('Failed to save main database:', err.message);
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

// Get migration status
async function getMigrationStatus() {
    return dbAllMain('SELECT version, applied_at, description FROM schema_migrations ORDER BY version ASC', []);
}

// Get main database instance (for testing/debugging)
function getMainDb() {
    return mainDb;
}

// Check if database is initialized
function isInitialized() {
    return initialized;
}

module.exports = {
    setSql,
    setDataDir,
    initSQL,
    initMainDb,
    saveMainDb,
    dbGetMain,
    dbRunMain,
    dbAllMain,
    getMigrationStatus,
    getMainDb,
    isInitialized,
};
