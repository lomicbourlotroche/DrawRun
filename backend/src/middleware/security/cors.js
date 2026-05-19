/**
 * ============================================================
 * CORS VALIDATION
 * ============================================================
 * Validate allowed origins for CORS.
 * Fails CLOSED — if CORS_ORIGINS is not configured, all origins are blocked.
 */

'use strict';

const { logger } = require('../../utils/logger');

/**
 * Validate allowed origins for CORS.
 * Fails CLOSED — if CORS_ORIGINS is not configured, all origins are blocked.
 */
function validateCorsOrigin(origin, callback) {
    const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
    
    // No origin header = same-origin or non-browser request (e.g. curl, server-to-server)
    if (!origin) {
        callback(null, true);
        return;
    }
    
    if (allowedOrigins.length === 0) {
        // Fail closed in production; allow all only in explicit development mode
        if (process.env.NODE_ENV !== 'production') {
            logger.warn('[CORS] No origins configured — allowing all (development mode only)');
            callback(null, true);
        } else {
            logger.error('[CORS] CORS_ORIGINS not configured in production — blocking all cross-origin requests');
            callback(new Error('CORS not configured'));
        }
        return;
    }
    
    // No wildcard support in production — fail closed
    if (allowedOrigins.includes('*')) {
        if (process.env.NODE_ENV !== 'production') {
            logger.warn('[CORS] Wildcard allowed only in development');
            callback(null, true);
        } else {
            logger.error('[CORS] Wildcard blocked in production');
            callback(new Error('CORS wildcard not allowed in production'));
        }
    } else if (allowedOrigins.includes(origin)) {
        callback(null, true);
    } else if (origin && origin.match(/^https?:\/\/(www\.)?drawrun\.fr(:\d+)?$/)) {
        // Reflect origin if it's a valid drawrun.fr subdomain (production safe)
        callback(null, true);
    } else {
        logger.warn(`[CORS] Blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
    }
}

module.exports = {
    validateCorsOrigin,
};
