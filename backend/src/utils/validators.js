'use strict';

/* eslint-disable security/detect-object-injection */

// ============================================================================
// PRIMITIVE VALIDATORS
// ============================================================================

function isValidEmail(email) {
    if (typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

function isStrongPassword(password) {
    if (typeof password !== 'string') return false;
    if (password.length < 8) return false;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    return hasLetter && hasNumber;
}

function validatePositiveNumber(value, min, max) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= min && num <= max;
}

// ============================================================================
// REQUEST BODY VALIDATORS
// Returns { valid: boolean, errors: string[] }
// ============================================================================

/**
 * Validate login / register request body.
 */
function validateAuthBody(body) {
    const errors = [];
    if (!body || typeof body !== 'object') return { valid: false, errors: ['Request body is required'] };

    if (!body.email || typeof body.email !== 'string') {
        errors.push('email is required');
    } else if (!isValidEmail(body.email)) {
        errors.push('email is invalid');
    }

    if (!body.password || typeof body.password !== 'string') {
        errors.push('password is required');
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Validate profile update body.
 */
function validateProfileBody(body) {
    const errors = [];
    if (!body || typeof body !== 'object') return { valid: false, errors: ['Request body is required'] };

    if (body.fcm !== undefined && body.fcm !== '' && !validatePositiveNumber(body.fcm, 100, 250)) {
        errors.push('fcm must be a number between 100 and 250');
    }
    if (body.vma !== undefined && body.vma !== '' && !validatePositiveNumber(body.vma, 5, 30)) {
        errors.push('vma must be a number between 5 and 30 km/h');
    }
    if (body.weight !== undefined && body.weight !== '' && !validatePositiveNumber(body.weight, 20, 300)) {
        errors.push('weight must be a number between 20 and 300 kg');
    }
    if (body.age !== undefined && body.age !== '' && !validatePositiveNumber(body.age, 10, 120)) {
        errors.push('age must be a number between 10 and 120');
    }
    if (body.sex !== undefined && !['M', 'F', 'O'].includes(body.sex)) {
        errors.push('sex must be M, F, or O');
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Validate manual activity creation body.
 */
function validateActivityBody(body) {
    const errors = [];
    if (!body || typeof body !== 'object') return { valid: false, errors: ['Request body is required'] };

    const ALLOWED_TYPES = [
        'run', 'trail_run', 'race_walk', 'walk', 'hike',
        'bike', 'mountain_bike', 'gravel_bike', 'indoor_cycling', 'virtual_ride',
        'swim', 'open_water_swim',
        'triathlon', 'duathlon', 'aquathlon',
        'crossfit', 'weight_training', 'strength_training', 'cardio_training', 'hiit', 'circuit_training', 'pilates', 'yoga',
        'rowing', 'kayak', 'canoe', 'stand_up_paddle',
        'ski_alpine', 'ski_touring', 'ski_cross_country', 'snowboard', 'roller_ski',
        'tennis', 'badminton', 'squash',
        'basketball', 'football', 'soccer', 'rugby', 'volleyball', 'handball', 'golf',
        'climbing', 'via_ferrata', 'mountaineering', 'land_sailing',
        'other',
        'Run', 'Ride', 'Swim', 'Walk', 'Hike', 'VirtualRide', 'VirtualRun', 'Other',
    ];
    if (!body.type || !ALLOWED_TYPES.includes(body.type)) {
        errors.push(`type must be one of: ${ALLOWED_TYPES.slice(0, 10).join(', ')}... (${ALLOWED_TYPES.length} types accepted)`);
    }
    if (!body.start_date || isNaN(Date.parse(body.start_date))) {
        errors.push('start_date must be a valid ISO date string');
    }
    if (body.distance !== undefined && !validatePositiveNumber(body.distance, 0, 1000000)) {
        errors.push('distance must be a positive number (meters)');
    }
    if (body.moving_time !== undefined && !validatePositiveNumber(body.moving_time, 0, 86400)) {
        errors.push('moving_time must be between 0 and 86400 seconds');
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Validate training plan creation body.
 */
function validatePlanBody(body) {
    const errors = [];
    if (!body || typeof body !== 'object') return { valid: false, errors: ['Request body is required'] };

    const ALLOWED_GOALS = ['health', 'weight_loss', '5k', '10k', 'half', 'marathon', 'custom', 'improvement'];
    if (body.goals && !ALLOWED_GOALS.includes(body.goals)) {
        errors.push(`goals must be one of: ${ALLOWED_GOALS.join(', ')}`);
    }
    if (body.weeks !== undefined && !validatePositiveNumber(body.weeks, 1, 52)) {
        errors.push('weeks must be between 1 and 52');
    }
    if (body.sessionsPerWeek !== undefined && !validatePositiveNumber(body.sessionsPerWeek, 1, 14)) {
        errors.push('sessionsPerWeek must be between 1 and 14');
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Express middleware factory — validates req.body with the given validator function.
 * Responds 400 with { error, details } if validation fails.
 */
function validateBody(validatorFn) {
    return (req, res, next) => {
        const { valid, errors } = validatorFn(req.body);
        if (!valid) {
            return res.status(400).json({ error: 'Validation failed', details: errors });
        }
        next();
    };
}

// ============================================================================
// LEGACY HELPERS (used in index.js)
// ============================================================================

function validatePagination(page, perPage) {
    const p = parseInt(page) || 1;
    const pp = Math.min(parseInt(perPage) || 20, 100); // cap at 100
    return { page: Math.max(1, p), perPage: Math.max(1, pp) };
}

function sanitizeString(str, maxLen = 10000) {
    if (typeof str !== 'string') return '';
    return str.trim().slice(0, maxLen);
}

function requireBody(...fields) {
    return (req, res, next) => {
        if (!req || !req.body) {
            return res.status(400).json({ error: 'Request body is required' });
        }
        const missing = fields.filter(f => req.body[f] === undefined || req.body[f] === null || req.body[f] === '');
        if (missing.length > 0) {
            return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
        }
        next();
    };
}

function validateEmailField(req, res, next) {
    if (!req || !req.body) {
        return res.status(400).json({ error: 'Request body is required' });
    }
    if (!isValidEmail(req.body.email)) {
        return res.status(400).json({ error: 'Invalid email address' });
    }
    next();
}

function validatePasswordField(req, res, next) {
    if (!req || !req.body) {
        return res.status(400).json({ error: 'Request body is required' });
    }
    if (!isStrongPassword(req.body.password)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters with letters and numbers' });
    }
    next();
}

module.exports = {
    // Primitives
    isValidEmail,
    isStrongPassword,
    validatePositiveNumber,

    // Schema validators
    validateAuthBody,
    validateProfileBody,
    validateActivityBody,
    validatePlanBody,

    // Middleware factory
    validateBody,

    // Legacy helpers
    validatePagination,
    sanitizeString,
    requireBody,
    validateEmailField,
    validatePasswordField,
};
