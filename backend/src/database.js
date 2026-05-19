/**
 * ============================================================
 * DRAWRUN DATABASE v4.1 - Modular Architecture
 * ============================================================
 * 
 * This file now uses a modular structure:
 * - database/index.js    - Main entry point (backward compatible)
 * - database/mainDb.js   - Main database management
 * - database/userDb.js   - User database management  
 * - database/lruCache.js - LRU cache implementation
 * - database/migrations.js - Schema migrations
 * 
 * For backward compatibility, all original exports are maintained.
 * Use `require('./database')` as before, or import from sub-modules directly.
 */

'use strict';

// Re-export everything from the modular index
module.exports = require('./database/index');
