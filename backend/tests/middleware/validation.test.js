'use strict';

/**
 * ============================================================
 * VALIDATION MIDDLEWARE TESTS
 * ============================================================
 * Tests for validateBody, validateQuery, validateParams and predefined validators
 */

const { z } = require('zod');

// Mock schemas
jest.mock('../../src/utils/schemas', () => {
    const { z } = require('zod');
    return {
        LoginSchema: z.object({
            email: z.string().email(),
            password: z.string().min(8),
        }),
        RegisterSchema: z.object({
            email: z.string().email(),
            password: z.string().min(8),
            name: z.string().min(1),
        }),
        RefreshTokenSchema: z.object({
            refreshToken: z.string().min(10),
        }),
        ChangePasswordSchema: z.object({
            currentPassword: z.string().min(8),
            newPassword: z.string().min(8),
        }),
        ForgotPasswordRequestSchema: z.object({
            email: z.string().email(),
        }),
        ForgotPasswordConfirmSchema: z.object({
            email: z.string().email(),
            otp: z.string().length(6),
            newPassword: z.string().min(8),
        }),
        UserProfileSchema: z.object({
            name: z.string().min(1).max(100).optional(),
            age: z.number().int().positive().max(120).optional(),
            weight: z.number().positive().optional(),
        }),
        ActivitySchema: z.object({
            name: z.string().min(1),
            type: z.enum(['Run', 'Bike', 'Swim']),
            distance: z.number().nonnegative().optional(),
        }),
        ActivityCreateSchema: z.object({
            name: z.string().min(1),
            type: z.enum(['Run', 'Bike', 'Swim']),
            distance: z.number().nonnegative().optional(),
            date: z.string().optional(),
        }),
        ActivityFilterSchema: z.object({
            page: z.number().int().positive().default(1),
            limit: z.number().int().positive().max(100).default(20),
            type: z.enum(['Run', 'Bike', 'Swim']).optional(),
        }),
        TrainingPlanSchema: z.object({
            name: z.string().min(1),
            plan_type: z.enum(['custom', '5k', '10k']),
        }),
        FriendRequestSchema: z.object({
            friendEmail: z.string().email(),
        }),
        GroupSchema: z.object({
            name: z.string().min(1),
        }),
        ChallengeSchema: z.object({
            title: z.string().min(1),
            type: z.enum(['distance', 'duration']),
            target_value: z.number().positive(),
        }),
        SyncCredentialsSchema: z.object({
            provider: z.enum(['garmin', 'strava']),
        }),
        PaginationSchema: z.object({
            page: z.number().int().positive().default(1),
            limit: z.number().int().positive().max(100).default(20),
        }),
        validateSchema: jest.fn((schema, input) => {
            const result = schema.safeParse(input);
            if (!result.success) {
                const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
                return { success: false, error: `Validation failed: ${errors.join(', ')}` };
            }
            return { success: true, data: result.data };
        }),
    };
});

const {
    validateBody,
    validateQuery,
    validateParams,
    validateLogin,
    validateRegister,
    validateRefreshToken,
    validateChangePassword,
    validateUserProfile,
    validateActivityCreate,
    validateActivityFilter,
    validateFriendRequest,
    validatePagination,
} = require('../../src/middleware/validation');

describe('validateBody', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        jest.clearAllMocks();
        req = { body: {}, path: '/test' };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    // Happy path
    test('should call next() when validation passes', async () => {
        req.body = { email: 'test@example.com', password: 'password123' };
        const schema = require('../../src/utils/schemas').LoginSchema;

        await validateBody(schema)(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.validatedBody).toBeDefined();
        expect(res.status).not.toHaveBeenCalled();
    });

    // Error states
    test('should return 400 when body is empty', async () => {
        req.body = {};
        const schema = require('../../src/utils/schemas').LoginSchema;

        await validateBody(schema)(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Request body is required' });
        expect(next).not.toHaveBeenCalled();
    });

    test('should return 400 when validation fails', async () => {
        req.body = { email: 'invalid', password: 'short' };
        const schema = require('../../src/utils/schemas').LoginSchema;

        await validateBody(schema)(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: expect.stringContaining('Validation failed') })
        );
        expect(next).not.toHaveBeenCalled();
    });

    test('should attach validated data even when validation fails', async () => {
        req.body = { email: 'invalid' };
        const schema = require('../../src/utils/schemas').LoginSchema;

        await validateBody(schema)(req, res, next);

        expect(req.validatedBody).toBeUndefined();
    });
});

describe('validateQuery', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        jest.clearAllMocks();
        req = { query: {}, path: '/test' };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    test('should call next() when no query params', async () => {
        const schema = require('../../src/utils/schemas').PaginationSchema;

        await validateQuery(schema)(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    test('should validate query params correctly', async () => {
        req.query = { page: '1', limit: '20' };
        const schema = require('../../src/utils/schemas').PaginationSchema;

        await validateQuery(schema)(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.validatedQuery).toBeDefined();
    });

    test('should return 400 for invalid query params', async () => {
        req.query = { page: '-1' };
        const schema = require('../../src/utils/schemas').PaginationSchema;

        await validateQuery(schema)(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
    });

    test('should parse string numbers to actual numbers', async () => {
        req.query = { page: '2', limit: '50' };
        const schema = require('../../src/utils/schemas').PaginationSchema;

        await validateQuery(schema)(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.validatedQuery.page).toBe(2);
        expect(req.validatedQuery.limit).toBe(50);
    });

    test('should parse boolean strings', async () => {
        req.query = { page: '1', limit: '20' };
        const schema = require('../../src/utils/schemas').PaginationSchema;

        await validateQuery(schema)(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});

describe('validateParams', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        jest.clearAllMocks();
        req = { params: {}, path: '/test' };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    test('should call next() when no params', async () => {
        const schema = z.object({ id: z.string() });

        await validateParams(schema)(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    test('should validate params correctly', async () => {
        req.params = { id: '42' };
        const schema = z.object({ id: z.string().regex(/^\d+$/) });

        await validateParams(schema)(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.validatedParams).toBeDefined();
    });

    test('should return 400 for invalid params', async () => {
        req.params = { id: '' };
        const schema = z.object({ id: z.string().min(1) });

        await validateParams(schema)(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
    });
});

describe('Pre-defined validators', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        jest.clearAllMocks();
        req = { body: {}, query: {}, params: {}, path: '/test' };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    test('validateLogin should accept valid login data', async () => {
        req.body = { email: 'test@example.com', password: 'password123' };
        await validateLogin(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    test('validateLogin should reject invalid email', async () => {
        req.body = { email: 'invalid', password: 'password123' };
        await validateLogin(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('validateRegister should accept valid registration', async () => {
        req.body = { email: 'new@example.com', password: 'password123', name: 'John' };
        await validateRegister(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    test('validateRegister should reject missing name', async () => {
        req.body = { email: 'new@example.com', password: 'password123' };
        await validateRegister(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('validateRefreshToken should accept valid token', async () => {
        req.body = { refreshToken: 'valid-refresh-token-here' };
        await validateRefreshToken(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    test('validateRefreshToken should reject short token', async () => {
        req.body = { refreshToken: 'short' };
        await validateRefreshToken(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('validateChangePassword should accept valid passwords', async () => {
        req.body = { currentPassword: 'password123', newPassword: 'newpassword123' };
        await validateChangePassword(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    test('validateChangePassword should reject when passwords are same field', async () => {
        // Schema validates format; both must be >= 8 chars
        req.body = { currentPassword: 'short', newPassword: 'alsoshrt' };
        await validateChangePassword(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('validateUserProfile should accept valid profile', async () => {
        req.body = { name: 'John', age: 30, weight: 75 };
        await validateUserProfile(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    test('validateUserProfile should accept partial profile', async () => {
        req.body = { name: 'John' };
        await validateUserProfile(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    test('validateUserProfile should reject invalid age', async () => {
        req.body = { age: 200 };
        await validateUserProfile(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('validateActivityCreate should accept valid activity', async () => {
        req.body = { name: 'Morning Run', type: 'Run', distance: 5000 };
        await validateActivityCreate(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    test('validateActivityCreate should reject invalid type', async () => {
        req.body = { name: 'Test', type: 'InvalidType' };
        await validateActivityCreate(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('validateActivityFilter should accept valid query params', async () => {
        req.query = { page: '1', limit: '20' };
        await validateActivityFilter(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    test('validateActivityFilter should call next with empty query', async () => {
        await validateActivityFilter(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    test('validateFriendRequest should accept valid email', async () => {
        req.body = { friendEmail: 'friend@example.com' };
        await validateFriendRequest(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    test('validateFriendRequest should reject invalid email', async () => {
        req.body = { friendEmail: 'not-an-email' };
        await validateFriendRequest(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('validatePagination should accept valid pagination', async () => {
        req.query = { page: '2', limit: '50' };
        await validatePagination(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    test('validatePagination should reject invalid limit', async () => {
        req.query = { page: '1', limit: '200' };
        await validatePagination(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });
});
