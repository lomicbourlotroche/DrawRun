/**
 * ============================================================
 * DATABASE MODULE - Main Entry Point
 * ============================================================
 * Re-exports all database functions for backward compatibility.
 * 
 * This file maintains the original database.js API while internally
 * using the new modular structure (mainDb.js, userDb.js, lruCache.js).
 */

'use strict';

const fs = require('fs');
const path = require('path');

// Set up data directory
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../DrawRun-Data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize module state
let SQL;
let mainDb;
let initialized = false;
let initPromise;

// Import modular components
const mainDbModule = require('./mainDb');
const userDbModule = require('./userDb');
const lruCacheModule = require('./lruCache');
const { MIGRATIONS, runMigrations } = require('./migrations');

// Initialize SQL module
async function initSQL() {
    if (initPromise) return initPromise;
    
    const initSqlJs = require('sql.js');
    SQL = await initSqlJs();
    
    // Set SQL for sub-modules
    mainDbModule.setSql(SQL);
    userDbModule.setSql(SQL);
    
    return SQL;
}

// Initialize data directory for sub-modules
mainDbModule.setDataDir(DATA_DIR);
userDbModule.setDataDir(DATA_DIR);

// Re-export LRU cache functions
const {
    LRU_MAX_SIZE,
    lruGet,
    lruSet,
    lruEvictLRU,
    getCacheStats,
} = lruCacheModule;

// Re-export user DB functions
const {
    sanitizeEmail,
    getUserDbPath,
    saveUserDb,
    getUserDbByEmail,
    dbGetUser,
    dbRunUser,
    dbAllUser,
} = userDbModule;

// Re-export main DB functions
const {
    initMainDb: initMainDbOriginal,
    saveMainDb,
    dbGetMain,
    dbRunMain,
    dbAllMain,
    getMigrationStatus,
} = mainDbModule;

// Override initMainDb to set global state
async function initMainDb() {
    await initSQL();
    await initMainDbOriginal();
    mainDb = mainDbModule.getMainDb();
    initialized = mainDbModule.isInitialized();
    return mainDb;
}

// Maintain backward compatibility - get user DB by user ID
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

// Legacy exports for backward compatibility
function db() {
    return mainDb;
}

function dbGet(query, params = []) {
    return dbGetMain(query, params);
}

function dbRun(query, params = []) {
    return dbRunMain(query, params);
}

function dbAll(query, params = []) {
    return dbAllMain(query, params);
}

function usersDb() {
    return mainDb;
}

function getUserDbLegacy(userId) {
    return getUserDb(userId);
}

// Export everything
module.exports = {
    // Initialization
    initMainDb,
    initSQL,
    
    // Main database helpers
    dbGetMain,
    dbRunMain,
    dbAllMain,
    saveMainDb,
    
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
    db,
    dbGet,
    dbRun,
    dbAll,
    usersDb,
    getUserDbLegacy,
};
