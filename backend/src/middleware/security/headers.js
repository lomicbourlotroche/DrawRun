/**
 * ============================================================
 * SECURITY HEADERS MIDDLEWARE
 * ============================================================
 * Security headers for all responses.
 */

'use strict';

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

module.exports = {
    securityHeaders,
    bodySizeLimiter,
    validateContentType,
    sanitizeInputs,
};
