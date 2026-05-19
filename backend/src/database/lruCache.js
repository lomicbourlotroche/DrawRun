/**
 * ============================================================
 * LRU CACHE - User Database Connection Cache
 * ============================================================
 * Least Recently Used cache for managing open database connections.
 * Automatically persists and closes evicted connections.
 */

'use strict';

const { logger } = require('../utils/logger');

// LRU Cache for user database connections
const LRU_MAX_SIZE = 100;
const userDbCache = new Map();

/**
 * Get a db from the LRU cache, moving it to the MRU position on hit.
 * @param {string} dbPath - Path to the database file
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
 * @param {string} dbPath - Path to the database file
 * @param {object} db - Database instance
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
        // This will be replaced by actual save function
        const { saveUserDb } = require('./userDb');
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

/**
 * Clear the entire cache.
 */
function clearCache() {
    for (const [dbPath, db] of userDbCache.entries()) {
        try {
            const { saveUserDb } = require('./userDb');
            saveUserDb(dbPath, db);
        } catch (err) {
            logger.error('[LRU] Failed to persist DB on clear', { path: dbPath, error: err.message });
        }
        if (db && typeof db.close === 'function') {
            db.close();
        }
    }
    userDbCache.clear();
}

/**
 * Get the cache instance (for testing/debugging only)
 * @returns {Map} The userDbCache Map
 */
function getCacheInstance() {
    return userDbCache;
}

module.exports = {
    LRU_MAX_SIZE,
    lruGet,
    lruSet,
    lruEvictLRU,
    getCacheStats,
    clearCache,
    getCacheInstance, // For testing only
};
