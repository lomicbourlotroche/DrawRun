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

// ============================================================================
// EXPLORE VALIDATORS
// ============================================================================

/**
 * Validate coordinate values (latitude and longitude).
 */
function validateCoordinate(value, fieldName) {
    const num = parseFloat(value);
    if (isNaN(num)) return { valid: false, error: `${fieldName} must be a valid number` };
    if (fieldName.toLowerCase().includes('lat')) {
        if (num < -90 || num > 90) return { valid: false, error: `${fieldName} must be between -90 and 90` };
    } else {
        if (num < -180 || num > 180) return { valid: false, error: `${fieldName} must be between -180 and 180` };
    }
    return { valid: true };
}

/**
 * Validate segment creation body.
 */
function validateSegmentBody(body) {
    const errors = [];
    if (!body || typeof body !== 'object') return { valid: false, errors: ['Request body is required'] };

    // Required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
        errors.push('name is required and must be a non-empty string');
    }
    if (body.name && body.name.length > 200) {
        errors.push('name must be 200 characters or less');
    }

    // Validate coordinates
    const coordErrors = [];
    const requiredCoords = [
        { field: 'start_lat', name: 'start_lat' },
        { field: 'start_lng', name: 'start_lng' },
        { field: 'end_lat', name: 'end_lat' },
        { field: 'end_lng', name: 'end_lng' },
    ];
    for (const { field, name } of requiredCoords) {
        if (body[field] === undefined || body[field] === null) {
            errors.push(`${field} is required`);
        } else {
            const result = validateCoordinate(body[field], name);
            if (!result.valid) coordErrors.push(result.error);
        }
    }
    errors.push(...coordErrors);

    // Validate distance (required)
    if (body.distance === undefined || body.distance === null) {
        errors.push('distance is required');
    } else if (!validatePositiveNumber(body.distance, 1, 1000000)) {
        errors.push('distance must be a positive number between 1 and 1,000,000 meters');
    }

    // Optional but validated fields
    if (body.elevation_gain !== undefined && !validatePositiveNumber(body.elevation_gain, 0, 10000)) {
        errors.push('elevation_gain must be between 0 and 10,000 meters');
    }
    if (body.elevation_loss !== undefined && !validatePositiveNumber(body.elevation_loss, 0, 10000)) {
        errors.push('elevation_loss must be between 0 and 10,000 meters');
    }
    if (body.avg_grade !== undefined && (typeof body.avg_grade !== 'number' || body.avg_grade < -50 || body.avg_grade > 50)) {
        errors.push('avg_grade must be a number between -50 and 50');
    }
    if (body.max_grade !== undefined && (typeof body.max_grade !== 'number' || body.max_grade < -100 || body.max_grade > 100)) {
        errors.push('max_grade must be a number between -100 and 100');
    }

    // Validate activity_type
    const ALLOWED_TYPES = ['Run', 'Bike', 'Swim', 'Hike', 'Walk', 'Trail Run', 'Mountain Bike'];
    if (body.activity_type !== undefined && !ALLOWED_TYPES.includes(body.activity_type)) {
        errors.push(`activity_type must be one of: ${ALLOWED_TYPES.join(', ')}`);
    }

    // Validate polyline (if provided, should be a string)
    if (body.polyline !== undefined && typeof body.polyline !== 'string') {
        errors.push('polyline must be a string');
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Validate route creation body.
 */
function validateRouteBody(body) {
    const errors = [];
    if (!body || typeof body !== 'object') return { valid: false, errors: ['Request body is required'] };

    // Required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
        errors.push('name is required and must be a non-empty string');
    }
    if (body.name && body.name.length > 200) {
        errors.push('name must be 200 characters or less');
    }

    // Validate distance (required)
    if (body.distance === undefined || body.distance === null) {
        errors.push('distance is required');
    } else if (!validatePositiveNumber(body.distance, 1, 1000000)) {
        errors.push('distance must be a positive number between 1 and 1,000,000 meters');
    }

    // Validate elevation
    if (body.elevation_gain !== undefined && !validatePositiveNumber(body.elevation_gain, 0, 10000)) {
        errors.push('elevation_gain must be between 0 and 10,000 meters');
    }
    if (body.elevation_loss !== undefined && !validatePositiveNumber(body.elevation_loss, 0, 10000)) {
        errors.push('elevation_loss must be between 0 and 10,000 meters');
    }

    // Validate estimated_duration
    if (body.estimated_duration !== undefined && !validatePositiveNumber(body.estimated_duration, 0, 86400)) {
        errors.push('estimated_duration must be between 0 and 86,400 seconds (24 hours)');
    }

    // Validate activity_type
    const ALLOWED_TYPES = ['Run', 'Bike', 'Swim', 'Hike', 'Walk', 'Trail Run', 'Mountain Bike'];
    if (body.activity_type !== undefined && !ALLOWED_TYPES.includes(body.activity_type)) {
        errors.push(`activity_type must be one of: ${ALLOWED_TYPES.join(', ')}`);
    }

    // Validate difficulty
    const ALLOWED_DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'];
    if (body.difficulty !== undefined && !ALLOWED_DIFFICULTIES.includes(body.difficulty)) {
        errors.push(`difficulty must be one of: ${ALLOWED_DIFFICULTIES.join(', ')}`);
    }

    // Validate tags (must be array if provided)
    if (body.tags !== undefined && !Array.isArray(body.tags)) {
        errors.push('tags must be an array');
    }

    // Validate is_public
    if (body.is_public !== undefined && typeof body.is_public !== 'boolean') {
        errors.push('is_public must be a boolean');
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Validate segment effort creation body.
 */
function validateSegmentEffortBody(body) {
    const errors = [];
    if (!body || typeof body !== 'object') return { valid: false, errors: ['Request body is required'] };

    // Required fields
    if (body.elapsed_time === undefined || body.elapsed_time === null) {
        errors.push('elapsed_time is required');
    } else if (!validatePositiveNumber(body.elapsed_time, 1, 86400)) {
        errors.push('elapsed_time must be between 1 and 86,400 seconds');
    }

    if (body.start_date === undefined || body.start_date === null) {
        errors.push('start_date is required');
    } else if (typeof body.start_date !== 'string' || isNaN(Date.parse(body.start_date))) {
        errors.push('start_date must be a valid ISO date string');
    }

    // Optional fields validation
    if (body.moving_time !== undefined && !validatePositiveNumber(body.moving_time, 0, 86400)) {
        errors.push('moving_time must be between 0 and 86,400 seconds');
    }

    if (body.avg_watts !== undefined && (typeof body.avg_watts !== 'number' || body.avg_watts < 0 || body.avg_watts > 2000)) {
        errors.push('avg_watts must be between 0 and 2,000 watts');
    }

    if (body.max_watts !== undefined && (typeof body.max_watts !== 'number' || body.max_watts < 0 || body.max_watts > 5000)) {
        errors.push('max_watts must be between 0 and 5,000 watts');
    }

    if (body.avg_heartrate !== undefined && (typeof body.avg_heartrate !== 'number' || body.avg_heartrate < 30 || body.avg_heartrate > 300)) {
        errors.push('avg_heartrate must be between 30 and 300 bpm');
    }

    if (body.max_heartrate !== undefined && (typeof body.max_heartrate !== 'number' || body.max_heartrate < 30 || body.max_heartrate > 300)) {
        errors.push('max_heartrate must be between 30 and 300 bpm');
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Validate location query parameters (lat, lng, radius).
 */
function validateLocationParams(query) {
    const errors = [];

    if (query.lat !== undefined) {
        const result = validateCoordinate(query.lat, 'lat');
        if (!result.valid) errors.push(result.error);
    }

    if (query.lng !== undefined) {
        const result = validateCoordinate(query.lng, 'lng');
        if (!result.valid) errors.push(result.error);
    }

    if (query.radius !== undefined) {
        if (!validatePositiveNumber(query.radius, 100, 100000)) {
            errors.push('radius must be between 100 and 100,000 meters');
        }
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Validate route generation body (for OSRM-based route generation).
 */
function validateRouteGenerationBody(body) {
    const errors = [];
    if (!body || typeof body !== 'object') return { valid: false, errors: ['Request body is required'] };

    // Validate waypoints (required, at least 2)
    if (!body.waypoints || !Array.isArray(body.waypoints)) {
        errors.push('waypoints must be an array');
    } else if (body.waypoints.length < 2) {
        errors.push('At least 2 waypoints are required');
    } else {
        for (let i = 0; i < body.waypoints.length; i++) {
            const wp = body.waypoints[i];
            if (!wp || typeof wp !== 'object') {
                errors.push(`waypoints[${i}] must be an object with lat and lng`);
            } else {
                if (typeof wp.lat !== 'number' || wp.lat < -90 || wp.lat > 90) {
                    errors.push(`waypoints[${i}].lat must be a number between -90 and 90`);
                }
                if (typeof wp.lng !== 'number' || wp.lng < -180 || wp.lng > 180) {
                    errors.push(`waypoints[${i}].lng must be a number between -180 and 180`);
                }
            }
        }
    }

    // Validate activity_type
    const ALLOWED_TYPES = ['Run', 'Bike', 'Swim', 'Hike', 'Walk', 'Trail Run', 'Mountain Bike', 'Trail', 'Ride'];
    if (body.activity_type !== undefined && !ALLOWED_TYPES.includes(body.activity_type)) {
        errors.push(`activity_type must be one of: ${ALLOWED_TYPES.join(', ')}`);
    }

    // Validate name (optional, but if provided must be string)
    if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim() === '')) {
        errors.push('name must be a non-empty string');
    }
    if (body.name && body.name.length > 200) {
        errors.push('name must be 200 characters or less');
    }

    // Validate difficulty
    const ALLOWED_DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'];
    if (body.difficulty !== undefined && !ALLOWED_DIFFICULTIES.includes(body.difficulty)) {
        errors.push(`difficulty must be one of: ${ALLOWED_DIFFICULTIES.join(', ')}`);
    }

    // Validate is_public
    if (body.is_public !== undefined && typeof body.is_public !== 'boolean') {
        errors.push('is_public must be a boolean');
    }

    // Validate tags
    if (body.tags !== undefined && !Array.isArray(body.tags)) {
        errors.push('tags must be an array');
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Validate rating value (1-5).
 */
function validateRating(rating) {
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        return { valid: false, error: 'rating must be a number between 1 and 5' };
    }
    return { valid: true };
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

    // Explore validators
    validateSegmentBody,
    validateRouteBody,
    validateRouteGenerationBody,
    validateSegmentEffortBody,
    validateLocationParams,
    validateRating,
    validateCoordinate,

    // Middleware factory
    validateBody,

    // Legacy helpers
    validatePagination,
    sanitizeString,
    requireBody,
    validateEmailField,
    validatePasswordField,
};
