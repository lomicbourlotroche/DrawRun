'use strict';

/**
 * Custom application error with HTTP status code.
 * Throw this from route handlers to return a specific status + message.
 */
class AppError extends Error {
    /**
     * @param {string} message  - Human-readable error message
     * @param {number} [status=400] - HTTP status code
     */
    constructor(message, status = 400) {
        super(message);
        this.name = 'AppError';
        this.status = status;
    }
}

/**
 * Wraps an async Express route handler so that rejected promises
 * are forwarded to the error middleware instead of crashing the process.
 *
 * Usage:
 *   router.get('/path', asyncHandler(async (req, res) => { ... }));
 *
 * Instead of:
 *   router.get('/path', async (req, res) => {
 *     try { ... } catch (err) { next(err); }
 *   });
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * Centralized Express error-handling middleware.
 * Attach as the LAST middleware via app.use(errorHandler).
 *
 * Sends consistent JSON error responses:
 *   { error: 'message' }
 *
 * In non-production, includes the error message for debugging.
 * In production, returns a generic 'Internal server error' for 500s.
 */
function errorHandler(err, req, res, _next) {
    const { logger } = require('./logger');

    const status = err.status || err.statusCode || 500;
    const isServerError = status >= 500;

    if (isServerError) {
        logger.error(`[ErrorHandler] ${err.message}`, {
            path: req.path,
            method: req.method,
            userId: req.user?.id,
            error: err.stack,
        });
    } else {
        logger.warn(`[ErrorHandler] ${err.message}`, {
            path: req.path,
            method: req.method,
            userId: req.user?.id,
            status,
        });
    }

    const isProd = process.env.NODE_ENV === 'production';
    const message = isServerError
        ? (isProd ? 'Internal server error' : err.message)
        : err.message;

    res.status(status).json({ error: message });
}

module.exports = { AppError, asyncHandler, errorHandler };
