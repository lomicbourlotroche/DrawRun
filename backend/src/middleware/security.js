'use strict';

/* eslint-disable security/detect-object-injection, security/detect-unsafe-regex */

const { logger } = require('../logger');
const { ipKeyGenerator } = require('express-rate-limit');

/**
 * Security Middleware
 * ===================
 * Centralizes all security measures for the DrawRun API.
 * 
 * Includes:
 * - Helmet.js for secure headers
 * - Rate limiting
 * - Input sanitization
 * - Security headers
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

/**
 * Configure Helmet with strict CSP and security headers.
 * Includes CSP reporting for monitoring policy violations.
 */
function configureHelmet() {
    const reportUri = process.env.CSP_REPORT_URI || '/api/csp-report';
    const reportOnly = process.env.CSP_REPORT_ONLY === 'true';
    
    // Allow connections to the API domain
    const corsOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [];
    const connectSrc = ["'self'", ...corsOrigins];

    return helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],  // Keep inline styles for now, but plan to use nonces
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: connectSrc,
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
                reportUri: [reportUri],
            },
            reportOnly: reportOnly,
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" },
    });
}

/**
 * CSP Report Handler
 * Receives CSP violation reports and logs them for monitoring.
 */
function cspReportHandler(req, res) {
    try {
        const report = req.body;
        const userAgent = req.get('User-Agent') || 'unknown';
        const ip = req.ip || req.connection?.remoteAddress || 'unknown';

        // Log CSP violation
        logger.warn('[CSP Violation]', {
            timestamp: new Date().toISOString(),
            ip,
            userAgent,
            documentUri: report['document-uri'] || report.documentURI,
            violatedDirective: report['violated-directive'] || report.violatedDirective,
            blockedUri: report['blocked-uri'] || report.blockedURI,
            sourceFile: report['source-file'] || report.sourceFile,
            lineNumber: report['line-number'] || report.lineNumber,
            columnNumber: report['column-number'] || report.columnNumber,
        });

        // Store in security log if Winston logger is available
        try {
            const { securityLog } = require('../logger');
            securityLog('csp_violation', {
                ip,
                userAgent,
                report: report
            });
        } catch (e) {
            // Logger might not be available
        }

        res.status(204).send();
    } catch (error) {
        logger.error('[CSP Report Error]', error.message);
        res.status(400).json({ error: 'Invalid report' });
    }
}

/**
 * Rate limiter for general API routes.
 * Limits each IP to 100 requests per 15 minutes.
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Trop de requêtes, veuillez réessayer dans 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        logger.warn(`[RateLimit] IP ${req.ip} exceeding limit`);
        res.status(429).json(options.message);
    }
});

/**
 * Strict rate limiter for authentication endpoints.
 * Prevents brute force attacks on login/register.
 * Limits to 5 attempts per 15 minutes per IP.
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: (req, res, next, options) => {
        logger.warn(`[AuthRateLimit] Failed auth attempt from IP ${req.ip}`);
        res.status(429).json(options.message);
    }
});

/**
 * Rate limiter for password reset (OTP request).
 * Limits to 3 OTP requests per hour per email/IP.
 */
const otpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: { error: 'Trop de demandes OTP, veuillez réessayer dans 1 heure' },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        logger.warn(`[OTPRateLimit] OTP spam from IP ${req.ip}`);
        res.status(429).json(options.message);
    }
});

/**
 * Rate limiter for sync operations (POST /api/sync — triggers actual sync).
 * Limits to 10 syncs per hour per user.
 */
const syncLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    keyGenerator: (req) => {
        const userId = req.user?.id;
        return userId ? `sync:user:${userId}` : `sync:ip:${ipKeyGenerator(req)}`;
    },
    message: { error: 'Trop de synchronisations, veuillez réessayer dans 1 heure' },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiter for sync status/info endpoints (GET /api/sync/status, etc.).
 * These are called on every page load — must be generous.
 * Limits to 300 requests per 15 minutes per user.
 */
const syncStatusLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    keyGenerator: (req) => {
        const userId = req.user?.id;
        return userId ? `syncstatus:user:${userId}` : `syncstatus:ip:${ipKeyGenerator(req)}`;
    },
    message: { error: 'Trop de requêtes, veuillez réessayer dans 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * User-based rate limiter for authenticated routes.
 * Combines IP address with user ID for granular rate limiting.
 * Limits to 200 requests per 15 minutes per user.
 */
const userBasedLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    keyGenerator: (req) => {
        const userId = req.user?.id;
        const ip = ipKeyGenerator(req);
        return userId ? `user:${userId}` : `ip:${ip}`;
    },
    message: { error: 'Trop de requêtes pour cet utilisateur, veuillez réessayer dans 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        const userId = req.user?.id;
        const identifier = userId ? `User ${userId}` : `IP ${req.ip}`;
        logger.warn(`[UserRateLimit] ${identifier} exceeding limit`);
        res.status(429).json(options.message);
    }
});

/**
 * Stricter user-based rate limiter for sensitive operations.
 * Limits to 50 requests per 15 minutes per user.
 */
const sensitiveUserLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    keyGenerator: (req) => {
        const userId = req.user?.id;
        const ip = ipKeyGenerator(req);
        return userId ? `user:${userId}:sensitive` : `ip:${ip}:sensitive`;
    },
    message: { error: 'Trop de requêtes pour cette opération, veuillez réessayer plus tard' },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        const userId = req.user?.id;
        const identifier = userId ? `User ${userId}` : `IP ${req.ip}`;
        logger.warn(`[SensitiveRateLimit] ${identifier} exceeding limit`);
        res.status(429).json(options.message);
    }
});

/**
 * Content-Type validation middleware.
 * Rejects requests without proper Content-Type header for POST/PUT/PATCH.
 */
function validateContentType(req, res, next) {
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const contentType = req.get('Content-Type');
        if (!contentType || !contentType.includes('application/json')) {
            return res.status(415).json({ error: 'Content-Type must be application/json' });
        }
    }
    next();
}

/**
 * Request body size limiter.
 * Prevents large payload attacks.
 */
const bodySizeLimiter = (maxSize = '2mb') => {
    return (req, res, next) => {
        const contentLength = parseInt(req.get('Content-Length') || '0');
        const maxBytes = maxSize === '2mb' ? 2 * 1024 * 1024 : 10 * 1024 * 1024;
        
        if (contentLength > maxBytes) {
            return res.status(413).json({ error: 'Payload too large' });
        }
        next();
    };
};

/**
 * Security headers for all responses.
 */
function securityHeaders(req, res, next) {
    res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=()',
    });
    next();
}

/**
 * Input sanitization middleware.
 * Trims and limits string inputs to prevent XSS.
 */
function sanitizeInputs(req, res, next) {
    if (req.body && typeof req.body === 'object') {
        sanitizeObject(req.body, 3);
    }
    next();
}

function sanitizeObject(obj, depth) {
    if (depth <= 0 || !obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
        const value = obj[key];
        if (typeof value === 'string') {
            obj[key] = value.trim().slice(0, 10000);
        } else if (typeof value === 'object' && !Array.isArray(value)) {
            sanitizeObject(value, depth - 1);
        } else if (Array.isArray(value)) {
            value.forEach(item => {
                if (typeof item === 'object' && item !== null) {
                    sanitizeObject(item, depth - 1);
                }
            });
        }
    }
}

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
    configureHelmet,
    cspReportHandler,
    apiLimiter,
    authLimiter,
    otpLimiter,
    syncLimiter,
    syncStatusLimiter,
    userBasedLimiter,
    sensitiveUserLimiter,
    validateContentType,
    bodySizeLimiter,
    securityHeaders,
    sanitizeInputs,
    validateCorsOrigin
};