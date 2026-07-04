/* eslint-disable unused-imports/no-unused-vars */
'use strict';

/**
 * ============================================================
 * ZOD SCHEMAS TESTS
 * ============================================================
 * Tests for all validation schemas used across the application.
 * These schema-level tests validate input parsing independently
 * of the middleware layer.
 */

const {
    // Common
    EmailSchema,
    PasswordSchema,
    NameSchema,
    DateSchema,

    // Auth
    LoginSchema,
    RegisterSchema,
    RefreshTokenSchema,
    ChangePasswordSchema,
    ForgotPasswordRequestSchema,
    ForgotPasswordConfirmSchema,

    // User
    UserProfileSchema,

    // Activity
    ActivitySchema,
    ActivityCreateSchema,
    ActivityFilterSchema,

    // Training
    TrainingPlanSchema,

    // Social
    FriendRequestSchema,
    GroupSchema,
    ChallengeSchema,

    // Sync
    SyncCredentialsSchema,

    // Pagination
    PaginationSchema,

    // Utilities
    validateSchema,
    sanitizeAndValidateString,
} = require('../src/utils/schemas');

describe('EmailSchema', () => {
    test('should accept valid emails', () => {
        expect(EmailSchema.safeParse('user@example.com').success).toBe(true);
        expect(EmailSchema.safeParse('user.name+tag@domain.co.uk').success).toBe(true);
    });

    test('should reject invalid emails', () => {
        expect(EmailSchema.safeParse('not-email').success).toBe(false);
        expect(EmailSchema.safeParse('@domain.com').success).toBe(false);
        expect(EmailSchema.safeParse('user@').success).toBe(false);
        expect(EmailSchema.safeParse('').success).toBe(false);
    });
});

describe('PasswordSchema', () => {
    test('should accept passwords >= 8 chars', () => {
        expect(PasswordSchema.safeParse('password123').success).toBe(true);
        expect(PasswordSchema.safeParse('a'.repeat(8)).success).toBe(true);
        expect(PasswordSchema.safeParse('a'.repeat(128)).success).toBe(true);
    });

    test('should reject passwords < 8 chars', () => {
        expect(PasswordSchema.safeParse('short').success).toBe(false);
        expect(PasswordSchema.safeParse('a'.repeat(7)).success).toBe(false);
    });

    test('should reject passwords > 128 chars', () => {
        expect(PasswordSchema.safeParse('a'.repeat(129)).success).toBe(false);
    });
});

describe('LoginSchema', () => {
    test('should accept valid login data', () => {
        const result = LoginSchema.safeParse({
            email: 'user@example.com',
            password: 'password123',
        });
        expect(result.success).toBe(true);
    });

    test('should accept login with TOTP code', () => {
        const result = LoginSchema.safeParse({
            email: 'user@example.com',
            password: 'password123',
            totpCode: '123456',
        });
        expect(result.success).toBe(true);
    });

    test('should reject login with short totpCode', () => {
        const result = LoginSchema.safeParse({
            email: 'user@example.com',
            password: 'password123',
            totpCode: '12345',
        });
        expect(result.success).toBe(false);
    });

    test('should reject login with missing password', () => {
        const result = LoginSchema.safeParse({ email: 'user@example.com' });
        expect(result.success).toBe(false);
    });

    test('should reject login with missing email', () => {
        const result = LoginSchema.safeParse({ password: 'password123' });
        expect(result.success).toBe(false);
    });
});

describe('RegisterSchema', () => {
    test('should accept valid registration', () => {
        const result = RegisterSchema.safeParse({
            email: 'new@example.com',
            password: 'password123',
            name: 'New User',
        });
        expect(result.success).toBe(true);
    });

    test('should reject registration missing name', () => {
        const result = RegisterSchema.safeParse({
            email: 'new@example.com',
            password: 'password123',
        });
        expect(result.success).toBe(false);
    });
});

describe('RefreshTokenSchema', () => {
    test('should accept valid refresh token', () => {
        const result = RefreshTokenSchema.safeParse({
            refreshToken: 'a'.repeat(10),
        });
        expect(result.success).toBe(true);
    });

    test('should reject short refresh token', () => {
        const result = RefreshTokenSchema.safeParse({
            refreshToken: 'short',
        });
        expect(result.success).toBe(false);
    });
});

describe('ChangePasswordSchema', () => {
    test('should accept valid password change', () => {
        const result = ChangePasswordSchema.safeParse({
            currentPassword: 'oldpassword123',
            newPassword: 'newpassword123',
        });
        expect(result.success).toBe(true);
    });

    test('should reject weak new password', () => {
        const result = ChangePasswordSchema.safeParse({
            currentPassword: 'oldpassword123',
            newPassword: 'weak',
        });
        expect(result.success).toBe(false);
    });
});

describe('ForgotPasswordRequestSchema', () => {
    test('should accept valid email', () => {
        const result = ForgotPasswordRequestSchema.safeParse({
            email: 'user@example.com',
        });
        expect(result.success).toBe(true);
    });
});

describe('ForgotPasswordConfirmSchema', () => {
    test('should accept valid confirmation', () => {
        const result = ForgotPasswordConfirmSchema.safeParse({
            email: 'user@example.com',
            otp: '123456',
            newPassword: 'newpassword123',
        });
        expect(result.success).toBe(true);
    });

    test('should reject invalid OTP length', () => {
        const result = ForgotPasswordConfirmSchema.safeParse({
            email: 'user@example.com',
            otp: '12345',
            newPassword: 'newpassword123',
        });
        expect(result.success).toBe(false);
    });
});

describe('UserProfileSchema', () => {
    test('should accept valid full profile', () => {
        const result = UserProfileSchema.safeParse({
            name: 'John Doe',
            bio: 'Runner',
            age: 30,
            weight: 70,
            height: 175,
            sex: 'M',
        });
        expect(result.success).toBe(true);
    });

    test('should accept partial profile', () => {
        const result = UserProfileSchema.safeParse({ name: 'John' });
        expect(result.success).toBe(true);
    });

    test('should accept empty profile', () => {
        const result = UserProfileSchema.safeParse({});
        expect(result.success).toBe(true);
    });

    test('should reject invalid age', () => {
        const result = UserProfileSchema.safeParse({ age: 200 });
        expect(result.success).toBe(false);
    });

    test('should reject negative weight', () => {
        const result = UserProfileSchema.safeParse({ weight: -10 });
        expect(result.success).toBe(false);
    });
});

describe('ActivitySchema', () => {
    const validActivity = {
        source: 'manual',
        name: 'Morning Run',
        type: 'Run',
        start_date: '2026-01-15T10:00:00Z',
    };

    test('should accept valid minimal activity', () => {
        const result = ActivitySchema.safeParse(validActivity);
        expect(result.success).toBe(true);
    });

    test('should accept full activity with metrics', () => {
        const result = ActivitySchema.safeParse({
            ...validActivity,
            distance: 10000,
            moving_time: 2700,
            average_heartrate: 155,
            max_heartrate: 175,
            calories: 600,
            total_elevation_gain: 50,
        });
        expect(result.success).toBe(true);
    });

    test('should reject invalid activity type', () => {
        const result = ActivitySchema.safeParse({
            ...validActivity,
            type: 'Flying',
        });
        expect(result.success).toBe(false);
    });

    test('should reject missing required fields', () => {
        const result = ActivitySchema.safeParse({});
        expect(result.success).toBe(false);
    });
});

describe('TrainingPlanSchema', () => {
    const validPlan = {
        name: 'Half Marathon Plan',
        target_type: 'distance',
        target_value: 21.0975,
        start_date: '2026-02-01',
        plan_type: 'advanced_half_marathon',
        experience_level: 'intermediate',
        preferred_terrain: 'mixed',
    };

    test('should accept valid training plan', () => {
        const result = TrainingPlanSchema.safeParse(validPlan);
        expect(result.success).toBe(true);
    });

    test('should reject invalid plan type', () => {
        const result = TrainingPlanSchema.safeParse({
            ...validPlan,
            plan_type: 'invalid',
        });
        expect(result.success).toBe(false);
    });

    test('should reject invalid target type', () => {
        const result = TrainingPlanSchema.safeParse({
            ...validPlan,
            target_type: 'invalid',
        });
        expect(result.success).toBe(false);
    });
});

describe('FriendRequestSchema', () => {
    test('should accept valid email', () => {
        const result = FriendRequestSchema.safeParse({ friendEmail: 'friend@example.com' });
        expect(result.success).toBe(true);
    });

    test('should reject invalid email', () => {
        const result = FriendRequestSchema.safeParse({ friendEmail: 'not-email' });
        expect(result.success).toBe(false);
    });
});

describe('PaginationSchema', () => {
    test('should apply defaults', () => {
        const result = PaginationSchema.safeParse({});
        expect(result.success).toBe(true);
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
    });

    test('should accept custom values', () => {
        const result = PaginationSchema.safeParse({ page: 3, limit: 50 });
        expect(result.success).toBe(true);
        expect(result.data.page).toBe(3);
        expect(result.data.limit).toBe(50);
    });

    test('should reject limit > 100', () => {
        const result = PaginationSchema.safeParse({ limit: 200 });
        expect(result.success).toBe(false);
    });

    test('should reject negative page', () => {
        const result = PaginationSchema.safeParse({ page: -1 });
        expect(result.success).toBe(false);
    });
});

describe('ActivityFilterSchema', () => {
    test('should extend pagination schema', () => {
        const result = ActivityFilterSchema.safeParse({});
        expect(result.success).toBe(true);
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
    });

    test('should accept optional filters', () => {
        const result = ActivityFilterSchema.safeParse({
            type: 'Run',
            min_distance: 5000,
        });
        expect(result.success).toBe(true);
    });
});

describe('SyncCredentialsSchema', () => {
    test('should accept valid credentials', () => {
        const result = SyncCredentialsSchema.safeParse({
            provider: 'garmin',
            username: 'runner',
            password: 'secret',
            enabled: true,
        });
        expect(result.success).toBe(true);
    });

    test('should reject invalid provider', () => {
        const result = SyncCredentialsSchema.safeParse({
            provider: 'unknown',
        });
        expect(result.success).toBe(false);
    });
});

describe('ChallengeSchema', () => {
    test('should accept valid challenge', () => {
        const result = ChallengeSchema.safeParse({
            title: 'Run 100km',
            type: 'distance',
            target_value: 100,
            target_unit: 'km',
            duration_days: 30,
            sport_type: 'run',
        });
        expect(result.success).toBe(true);
    });

    test('should reject invalid type', () => {
        const result = ChallengeSchema.safeParse({
            title: 'Test',
            type: 'invalid',
            target_value: 100,
            target_unit: 'km',
            duration_days: 30,
            sport_type: 'run',
        });
        expect(result.success).toBe(false);
    });
});

describe('GroupSchema', () => {
    test('should accept valid group', () => {
        const result = GroupSchema.safeParse({ name: 'Running Club' });
        expect(result.success).toBe(true);
    });

    test('should accept group with optional fields', () => {
        const result = GroupSchema.safeParse({
            name: 'Running Club',
            description: 'For runners',
            is_private: false,
        });
        expect(result.success).toBe(true);
    });
});

describe('validateSchema utility', () => {
    test('should return success for valid data', async () => {
        const result = await validateSchema(LoginSchema, {
            email: 'test@example.com',
            password: 'password123',
        });
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
    });

    test('should return error for invalid data', async () => {
        const result = await validateSchema(LoginSchema, {
            email: 'invalid',
            password: 'short',
        });
        expect(result.success).toBe(false);
        expect(result.error).toContain('Validation failed');
    });

    test('should format errors with field paths', async () => {
        const result = await validateSchema(RegisterSchema, {
            email: 'invalid',
            password: 'short',
        });
        expect(result.success).toBe(false);
        expect(result.error).toContain('email');
        expect(result.error).toContain('password');
        expect(result.error).toContain('name');
    });
});

describe('sanitizeAndValidateString', () => {
    test('should trim whitespace by default', () => {
        expect(sanitizeAndValidateString('  hello  ')).toBe('hello');
    });

    test('should truncate to maxLength', () => {
        const long = 'a'.repeat(200);
        expect(sanitizeAndValidateString(long, { maxLength: 10 })).toBe('a'.repeat(10));
    });

    test('should return null when allowEmpty and input is null', () => {
        expect(sanitizeAndValidateString(null, { allowEmpty: true })).toBeNull();
    });

    test('should throw when input is required but null', () => {
        expect(() => sanitizeAndValidateString(null, { allowEmpty: false })).toThrow('Input is required');
    });

    test('should throw when input is shorter than minLength', () => {
        expect(() => sanitizeAndValidateString('ab', { minLength: 3 })).toThrow(
            'Input must be at least 3 characters'
        );
    });

    test('should pass through valid input', () => {
        expect(sanitizeAndValidateString('valid')).toBe('valid');
    });
});
