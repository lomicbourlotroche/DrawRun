/**
 * ============================================================
 * SECURITY MIDDLEWARE
 * ============================================================
 * Centralizes all security measures for the DrawRun API.
 * 
 * This file now uses a modular structure:
 * - security/helmet.js   - Helmet configuration + CSP
 * - security/rateLimit.js - Rate limiting configuration
 * - security/headers.js   - Security headers middleware
 * - security/cors.js      - CORS validation
 * - security/index.js    - Main exports
 * 
 * For backward compatibility, all original exports are maintained.
 */

'use strict';

// Re-export everything from the modular structure
module.exports = require('./security/index');
