/**
 * ============================================================
 * RATE LIMITING CONFIGURATION
 * ============================================================
 * Rate limiting configuration for various endpoint types.
 */

'use strict';

const rateLimit = require('express-rate-limit');
const { logger } = require('../../utils/logger');

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
 * Limits to 30 syncs per hour per user/IP.
 */
const syncLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 30,
    keyGenerator: (req) => `${req.ip || 'unknown'}_${req.user?.id || 'anon'}`,
    validate: { keyGeneratorIpFallback: false },
    message: { error: 'Trop de synchronisations, veuillez réessayer dans 1 heure' },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiter for sync status/info endpoints (GET /api/sync/status, etc.)
 * and job polling (GET /api/sync/job/:id).
 * Polling at 5s for 5 min = 60 req. Set to 1000 with large margin.
 */
const syncStatusLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    keyGenerator: (req) => req.ip || req.connection?.remoteAddress || 'unknown',
    validate: { keyGeneratorIpFallback: false },
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
    keyGenerator: (req) => `${req.ip || 'unknown'}_${req.user?.id || 'anon'}`,
    validate: { keyGeneratorIpFallback: false },
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
    keyGenerator: (req) => `${req.ip || 'unknown'}_${req.user?.id || 'anon'}`,
    validate: { keyGeneratorIpFallback: false },
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

module.exports = {
    apiLimiter,
    authLimiter,
    otpLimiter,
    syncLimiter,
    syncStatusLimiter,
    userBasedLimiter,
    sensitiveUserLimiter,
};
