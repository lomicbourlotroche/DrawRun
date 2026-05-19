/**
 * ============================================================
 * ZOD SCHEMAS - Input Validation
 * ============================================================
 * Centralized validation schemas using Zod for type-safe input validation.
 * 
 * Usage:
 *   const { ActivitySchema } = require('./utils/schemas');
 *   const result = ActivitySchema.safeParse(input);
 *   if (!result.success) { throw new Error(result.error.message); }
 *   const validatedData = result.data;
 */

'use strict';

const { z } = require('zod');

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

const EmailSchema = z.string().email().max(255);
const PasswordSchema = z.string().min(8).max(128);
const NameSchema = z.string().min(1).max(100);
const DateSchema = z.string().datetime();
const UUIDSchema = z.string().uuid();

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

const LoginSchema = z.object({
    email: EmailSchema,
    password: PasswordSchema,
    totpCode: z.string().length(6).optional(),
});

const RegisterSchema = z.object({
    email: EmailSchema,
    password: PasswordSchema,
    name: NameSchema,
});

const RefreshTokenSchema = z.object({
    refreshToken: z.string().min(10),
});

const ChangePasswordSchema = z.object({
    currentPassword: PasswordSchema,
    newPassword: PasswordSchema,
});

const ForgotPasswordRequestSchema = z.object({
    email: EmailSchema,
});

const ForgotPasswordConfirmSchema = z.object({
    email: EmailSchema,
    otp: z.string().length(6),
    newPassword: PasswordSchema,
});

// ============================================================================
// USER SCHEMAS
// ============================================================================

const UserProfileSchema = z.object({
    name: NameSchema.optional(),
    bio: z.string().max(500).optional(),
    location: z.string().max(100).optional(),
    weight: z.number().positive().optional(),
    height: z.number().positive().optional(),
    age: z.number().int().positive().max(120).optional(),
    sex: z.enum(['M', 'F', 'Other']).optional(),
    goals: z.string().max(500).optional(),
    equipment: z.string().max(500).optional(),
    fav_sports: z.string().optional(),
    avatar_url: z.string().url().optional(),
    is_public: z.boolean().optional(),
});

// ============================================================================
// ACTIVITY SCHEMAS
// ============================================================================

const ActivityTypeSchema = z.enum([
    'Run', 'Bike', 'Swim', 'Walk', 'Hike', 
    'Rowing', 'Elliptical', 'Skiing', 'Skating',
    'Other', 'Strength Training', 'Yoga', 'Pilates'
]);

const ActivitySchema = z.object({
    source: z.string().min(1).max(50),
    source_id: z.string().max(255).optional(),
    name: z.string().min(1).max(255),
    type: ActivityTypeSchema,
    start_date: DateSchema,
    timezone: z.string().max(50).optional(),
    distance: z.number().nonnegative().optional(),
    moving_time: z.number().int().nonnegative().optional(),
    elapsed_time: z.number().int().nonnegative().optional(),
    average_speed: z.number().nonnegative().optional(),
    max_speed: z.number().nonnegative().optional(),
    average_heartrate: z.number().nonnegative().optional(),
    max_heartrate: z.number().nonnegative().optional(),
    average_cadence: z.number().nonnegative().optional(),
    average_power: z.number().nonnegative().optional(),
    calories: z.number().int().nonnegative().optional(),
    elev_high: z.number().optional(),
    elev_low: z.number().optional(),
    total_elevation_gain: z.number().nonnegative().optional(),
    map_polyline: z.string().optional(),
    map_summary_polyline: z.string().optional(),
    intensity_factor: z.number().optional(),
    tss: z.number().optional(),
    trimp: z.number().optional(),
    normalized_power: z.number().optional(),
    variability_index: z.number().optional(),
    normalized_speed: z.number().optional(),
    running_index: z.number().optional(),
    hrv_rmssd: z.number().optional(),
    hrv_samples: z.number().int().optional(),
    device_name: z.string().max(100).optional(),
    description: z.string().max(1000).optional(),
    notes: z.string().max(5000).optional(),
    is_race: z.boolean().optional(),
    is_commute: z.boolean().optional(),
    is_manual: z.boolean().optional(),
    gear_id: z.number().int().positive().optional(),
    efficiency_factor: z.number().optional(),
});

const ActivityCreateSchema = ActivitySchema.extend({
    // Additional fields for manual activity creation
    upload_id: z.string().optional(),
    external_id: z.string().optional(),
});

// ============================================================================
// TRAINING SCHEMAS
// ============================================================================

const TrainingPlanSchema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
    target_type: z.enum(['distance', 'time', 'pace', 'vo2max', 'vdot', 'custom']),
    target_value: z.number().positive().optional(),
    target_unit: z.string().max(20).optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    weeks: z.number().int().positive().optional(),
    vdot: z.number().positive().optional(),
    sessions_per_week: z.number().int().positive().max(7).optional(),
    plan_type: z.enum(['custom', 'beginner_5k', 'intermediate_10k', 'advanced_half_marathon', 'marathon', 'ultra']),
    plan_data: z.record(z.any()).optional(),
    total_volume_km: z.number().nonnegative().optional(),
    total_time_hours: z.number().nonnegative().optional(),
    expected_tss_total: z.number().nonnegative().optional(),
    experience_level: z.enum(['beginner', 'intermediate', 'advanced', 'elite']),
    preferred_terrain: z.enum(['flat', 'hilly', 'mountain', 'mixed', 'track']),
});

// ============================================================================
// SOCIAL SCHEMAS
// ============================================================================

const FriendRequestSchema = z.object({
    friendEmail: EmailSchema,
});

const GroupSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    is_private: z.boolean().optional().default(true),
    invite_code: z.string().optional(),
});

const ChallengeSchema = z.object({
    title: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
    type: z.enum(['distance', 'duration', 'frequency', 'elevation', 'custom']),
    target_value: z.number().positive(),
    target_unit: z.string().max(20),
    duration_days: z.number().int().positive().max(365),
    max_participants: z.number().int().positive().optional(),
    is_public: z.boolean().optional().default(true),
    sport_type: z.enum(['any', 'run', 'bike', 'swim', 'walk', 'hike']),
    start_date: DateSchema.optional(),
    end_date: DateSchema.optional(),
});

// ============================================================================
// SYNC SCHEMAS
// ============================================================================

const SyncCredentialsSchema = z.object({
    provider: z.enum(['garmin', 'strava', 'suunto', 'decathlon', 'polar']),
    username: z.string().optional(),
    password: z.string().optional(),
    access_token: z.string().optional(),
    refresh_token: z.string().optional(),
    expires_at: z.number().int().optional(),
    enabled: z.boolean().optional().default(true),
});

// ============================================================================
// PAGINATION & FILTER SCHEMAS
// ============================================================================

const PaginationSchema = z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
    sortBy: z.string().max(50).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

const ActivityFilterSchema = PaginationSchema.extend({
    type: ActivityTypeSchema.optional(),
    start_date: DateSchema.optional(),
    end_date: DateSchema.optional(),
    min_distance: z.number().nonnegative().optional(),
    max_distance: z.number().nonnegative().optional(),
    search: z.string().max(100).optional(),
});

// ============================================================================
// VALIDATION UTILITY FUNCTIONS
// ============================================================================

/**
 * Validate input against a schema and return parsed data
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {unknown} input - Input data to validate
 * @returns {Promise<{ success: boolean, data?: any, error?: string }>}
 */
async function validateSchema(schema, input) {
    const result = schema.safeParse(input);
    
    if (!result.success) {
        const errors = result.error.errors.map(err => {
            const path = err.path.length > 0 ? err.path.join('.') : 'root';
            return `${path}: ${err.message}`;
        });
        
        return {
            success: false,
            error: `Validation failed: ${errors.join(', ')}`
        };
    }
    
    return {
        success: true,
        data: result.data
    };
}

/**
 * Validate and sanitize string input
 * @param {string} input - Input string
 * @param {Object} options - Validation options
 * @returns {string}
 */
function sanitizeAndValidateString(input, options = {}) {
    const {
        minLength = 0,
        maxLength = 10000,
        trim = true,
        allowEmpty = true
    } = options;
    
    if (input === undefined || input === null) {
        if (allowEmpty) return null;
        throw new Error('Input is required');
    }
    
    let result = String(input);
    
    if (trim) {
        result = result.trim();
    }
    
    if (result.length < minLength) {
        throw new Error(`Input must be at least ${minLength} characters`);
    }
    
    if (result.length > maxLength) {
        result = result.slice(0, maxLength);
    }
    
    return result;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Common schemas
    z,
    EmailSchema,
    PasswordSchema,
    NameSchema,
    DateSchema,
    UUIDSchema,
    
    // Auth schemas
    LoginSchema,
    RegisterSchema,
    RefreshTokenSchema,
    ChangePasswordSchema,
    ForgotPasswordRequestSchema,
    ForgotPasswordConfirmSchema,
    
    // User schemas
    UserProfileSchema,
    
    // Activity schemas
    ActivityTypeSchema,
    ActivitySchema,
    ActivityCreateSchema,
    ActivityFilterSchema,
    
    // Training schemas
    TrainingPlanSchema,
    
    // Social schemas
    FriendRequestSchema,
    GroupSchema,
    ChallengeSchema,
    
    // Sync schemas
    SyncCredentialsSchema,
    
    // Pagination
    PaginationSchema,
    
    // Validation utilities
    validateSchema,
    sanitizeAndValidateString,
};
