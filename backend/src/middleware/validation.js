/**
 * ============================================================
 * VALIDATION MIDDLEWARE
 * ============================================================
 * Middleware for validating request bodies, query params, and URL params
 * using Zod schemas for type-safe validation.
 */

'use strict';

const { logger } = require('../utils/logger');
const {
    LoginSchema,
    RegisterSchema,
    RefreshTokenSchema,
    ChangePasswordSchema,
    ForgotPasswordRequestSchema,
    ForgotPasswordConfirmSchema,
    UserProfileSchema,
    ActivitySchema,
    ActivityCreateSchema,
    ActivityFilterSchema,
    TrainingPlanSchema,
    FriendRequestSchema,
    GroupSchema,
    ChallengeSchema,
    SyncCredentialsSchema,
    PaginationSchema,
    validateSchema
} = require('../utils/schemas');

/**
 * Create validation middleware for request body
 * @param {Object} schema - Zod schema to validate against
 * @param {Object} options - Validation options
 * @returns {Function} Express middleware
 */
function validateBody(schema, options = {}) {
    const { logError = true } = options;
    
    return async (req, res, next) => {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ 
                error: 'Request body is required' 
            });
        }
        
        try {
            const result = await validateSchema(schema, req.body);
            
            if (!result.success) {
                if (logError) {
                    logger.warn('[Validation] Body validation failed:', {
                        path: req.path,
                        error: result.error
                    });
                }
                return res.status(400).json({ 
                    error: result.error || 'Invalid request body' 
                });
            }
            
            // Attach validated data to request
            req.validatedBody = result.data;
            next();
        } catch (err) {
            if (logError) {
                logger.error('[Validation] Body validation error:', err.message);
            }
            return res.status(400).json({ 
                error: 'Invalid request body' 
            });
        }
    };
}

/**
 * Create validation middleware for query parameters
 * @param {Object} schema - Zod schema to validate against
 * @param {Object} options - Validation options
 * @returns {Function} Express middleware
 */
function validateQuery(schema, options = {}) {
    const { logError = true } = options;
    
    return async (req, res, next) => {
        if (!req.query || Object.keys(req.query).length === 0) {
            return next(); // Query params are optional
        }
        
        try {
            // Parse numeric strings to numbers
            const parsedQuery = {};
            for (const [key, value] of Object.entries(req.query)) {
                if (!isNaN(value) && value.trim() !== '') {
                    parsedQuery[key] = Number(value);
                } else if (value === 'true' || value === 'false') {
                    parsedQuery[key] = value === 'true';
                } else {
                    parsedQuery[key] = value;
                }
            }
            
            const result = await validateSchema(schema, parsedQuery);
            
            if (!result.success) {
                if (logError) {
                    logger.warn('[Validation] Query validation failed:', {
                        path: req.path,
                        error: result.error
                    });
                }
                return res.status(400).json({ 
                    error: result.error || 'Invalid query parameters' 
                });
            }
            
            // Attach validated data to request
            req.validatedQuery = result.data;
            next();
        } catch (err) {
            if (logError) {
                logger.error('[Validation] Query validation error:', err.message);
            }
            return res.status(400).json({ 
                error: 'Invalid query parameters' 
            });
        }
    };
}

/**
 * Create validation middleware for URL parameters
 * @param {Object} schema - Zod schema to validate against
 * @param {Object} options - Validation options
 * @returns {Function} Express middleware
 */
function validateParams(schema, options = {}) {
    const { logError = true } = options;
    
    return async (req, res, next) => {
        if (!req.params || Object.keys(req.params).length === 0) {
            return next();
        }
        
        try {
            const result = await validateSchema(schema, req.params);
            
            if (!result.success) {
                if (logError) {
                    logger.warn('[Validation] Params validation failed:', {
                        path: req.path,
                        error: result.error
                    });
                }
                return res.status(400).json({ 
                    error: result.error || 'Invalid URL parameters' 
                });
            }
            
            // Attach validated data to request
            req.validatedParams = result.data;
            next();
        } catch (err) {
            if (logError) {
                logger.error('[Validation] Params validation error:', err.message);
            }
            return res.status(400).json({ 
                error: 'Invalid URL parameters' 
            });
        }
    };
}

/**
 * Pre-defined validation middlewares for common routes
 */

const validateLogin = validateBody(LoginSchema);
const validateRegister = validateBody(RegisterSchema);
const validateRefreshToken = validateBody(RefreshTokenSchema);
const validateChangePassword = validateBody(ChangePasswordSchema);
const validateForgotPasswordRequest = validateBody(ForgotPasswordRequestSchema);
const validateForgotPasswordConfirm = validateBody(ForgotPasswordConfirmSchema);
const validateUserProfile = validateBody(UserProfileSchema);
const validateActivity = validateBody(ActivitySchema);
const validateActivityCreate = validateBody(ActivityCreateSchema);
const validateActivityFilter = validateQuery(ActivityFilterSchema);
const validateTrainingPlan = validateBody(TrainingPlanSchema);
const validateFriendRequest = validateBody(FriendRequestSchema);
const validateGroup = validateBody(GroupSchema);
const validateChallenge = validateBody(ChallengeSchema);
const validateSyncCredentials = validateBody(SyncCredentialsSchema);
const validatePagination = validateQuery(PaginationSchema);

/**
 * Enhanced sanitizeInputs middleware using Zod
 * Replaces the basic sanitization with schema-based validation
 */
function enhancedSanitizeInputs(req, res, next) {
    // For now, keep the basic sanitization from security.js
    // This can be extended with schema-based validation
    next();
}

module.exports = {
    // Generic validators
    validateBody,
    validateQuery,
    validateParams,
    
    // Pre-defined validators
    validateLogin,
    validateRegister,
    validateRefreshToken,
    validateChangePassword,
    validateForgotPasswordRequest,
    validateForgotPasswordConfirm,
    validateUserProfile,
    validateActivity,
    validateActivityCreate,
    validateActivityFilter,
    validateTrainingPlan,
    validateFriendRequest,
    validateGroup,
    validateChallenge,
    validateSyncCredentials,
    validatePagination,
    
    // Enhanced sanitization
    enhancedSanitizeInputs,
    
    // Re-export schemas for convenience
    schemas: require('../utils/schemas')
};
