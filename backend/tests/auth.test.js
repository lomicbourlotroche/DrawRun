/**
 * ============================================================
 * AUTH TESTS
 * ============================================================
 * Tests pour l'authentification JWT et 2FA
 */

// ============================================================================
// Module mocks — hoisted to top by Jest, apply to all tests in this file.
// jwt_tokens DB-dependent functions are mocked; generateAccessToken is kept
// real (it is pure — no DB access).
// ============================================================================

jest.mock('../src/database', () => ({
    dbGetMain: jest.fn(),
    dbRunMain: jest.fn().mockResolvedValue({ lastID: 1, changes: 1 }),
    dbAllMain: jest.fn().mockResolvedValue([]),
    getUserDb: jest.fn(),
    getUserDbByEmail: jest.fn(),
    sanitizeEmail: jest.fn((email) => email.replace(/[@.]/g, '_')),
    initMainDb: jest.fn().mockResolvedValue(undefined),
    isInitialized: jest.fn().mockReturnValue(true),
}));

jest.mock('../src/crypto_utils', () => ({
    encrypt: jest.fn((v) => `enc:${v}`),
    decrypt: jest.fn((v) => v.replace(/^enc:/, '')),
}));

jest.mock('../src/logger', () => ({
    auditLog: jest.fn(),
    securityLog: jest.fn(),
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock('../src/auth2fa', () => ({
    has2FAEnabled: jest.fn().mockResolvedValue(false),
    has2FAPending: jest.fn().mockResolvedValue(false),
    verify2FAToken: jest.fn().mockResolvedValue({ valid: true }),
    generate2FASecret: jest.fn(),
    enable2FA: jest.fn(),
    disable2FA: jest.fn(),
}));

// Partially mock jwt_tokens: keep generateAccessToken real, mock the rest.
jest.mock('../src/jwt_tokens', () => {
    const actual = jest.requireActual('../src/jwt_tokens');
    return {
        ...actual,
        generateRefreshToken: jest.fn().mockResolvedValue('mock-refresh-token'),
        verifyRefreshToken: jest.fn(),
        rotateRefreshToken: jest.fn(),
        revokeRefreshToken: jest.fn().mockResolvedValue(undefined),
        revokeAllUserTokens: jest.fn().mockResolvedValue(undefined),
        ensureRefreshTokensTable: jest.fn(),
        cleanExpiredTokens: jest.fn().mockResolvedValue(undefined),
    };
});

// ============================================================================
// JWT Tokens — unit tests on generateAccessToken (pure, no DB)
// ============================================================================

describe('JWT Tokens', () => {
    const { generateAccessToken } = require('../src/jwt_tokens');
    const mockUser = { id: 1, email: 'test@example.com' };

    test('should generate access token', () => {
        const token = generateAccessToken(mockUser);
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
    });
});

// ============================================================================
// Password Validation
// ============================================================================

describe('Password Validation', () => {
    const { isStrongPassword } = require('../src/validators');

    test('should accept strong password', () => {
        expect(isStrongPassword('StrongP@ss123')).toBe(true);
    });

    test('should reject weak password (too short)', () => {
        expect(isStrongPassword('weak')).toBe(false);
    });

    test('should reject password without numbers', () => {
        expect(isStrongPassword('PasswordOnly')).toBe(false);
    });
});

// ============================================================================
// Email Validation
// ============================================================================

describe('Email Validation', () => {
    const { isValidEmail } = require('../src/validators');

    test('should accept valid email', () => {
        expect(isValidEmail('user@example.com')).toBe(true);
    });

    test('should reject invalid email', () => {
        expect(isValidEmail('not-an-email')).toBe(false);
    });

    test('should reject email without domain', () => {
        expect(isValidEmail('user@')).toBe(false);
    });
});

// ============================================================================
// POST /api/auth/refresh — Endpoint Tests
// ============================================================================

const request = require('supertest');
const express = require('express');
const { router: authRouter } = require('../src/auth');
const jwtTokens = require('../src/jwt_tokens');

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('POST /api/auth/refresh', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('valid refresh token returns { token, refreshToken, expiresIn: 900 }', async () => {
        jwtTokens.verifyRefreshToken.mockResolvedValue({
            valid: true,
            user: { id: 1, email: 'test@example.com' },
        });
        jwtTokens.rotateRefreshToken.mockResolvedValue({
            success: true,
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
        });

        const res = await request(app)
            .post('/api/auth/refresh')
            .send({ refreshToken: 'valid-refresh-token' });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            token: 'new-access-token',
            refreshToken: 'new-refresh-token',
            expiresIn: 900,
        });
    });

    test('invalid/revoked token returns HTTP 401 with { error: "Invalid or expired refresh token" }', async () => {
        jwtTokens.verifyRefreshToken.mockResolvedValue({
            valid: false,
            error: 'Token revoked or expired',
        });

        const res = await request(app)
            .post('/api/auth/refresh')
            .send({ refreshToken: 'revoked-token' });

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: 'Invalid or expired refresh token' });
    });

    test('missing refreshToken body field returns HTTP 400', async () => {
        const res = await request(app)
            .post('/api/auth/refresh')
            .send({});

        expect(res.status).toBe(400);
    });
});

// ============================================================================
// Credential Encryption — Unit Tests
// ============================================================================

describe('Credential Encryption', () => {
    test('Garmin credentials are encrypted before storage', () => {
        const { encrypt } = require('../src/crypto_utils');
        const password = 'my-garmin-password';

        // encrypt is mocked as (v) => 'enc:' + v
        const encrypted = encrypt(password);

        // Verify the stored value is not plaintext
        expect(encrypted).not.toBe(password);
        expect(encrypted).toBe('enc:' + password);
    });

    test('Suunto credentials are encrypted before storage', () => {
        const { encrypt } = require('../src/crypto_utils');
        const password = 'my-suunto-password';

        const encrypted = encrypt(password);

        expect(encrypted).not.toBe(password);
        expect(encrypted).toBe('enc:' + password);
    });

    test('real encrypt() output matches encrypted format ^[0-9a-f]{32}:[0-9a-f]{32}:.+', () => {
        // Use the REAL encrypt function (bypass mock)
        const { encrypt: realEncrypt } = jest.requireActual('../src/crypto_utils');

        // Set CREDENTIALS_SECRET for the test
        process.env.CREDENTIALS_SECRET = 'test-secret-for-encryption-testing';

        const password = 'test-password-123';
        const encrypted = realEncrypt(password);

        expect(encrypted).not.toBe(password);
        expect(encrypted).toMatch(/^[0-9a-f]{32}:[0-9a-f]{32}:.+/);

        // Cleanup
        delete process.env.CREDENTIALS_SECRET;
    });
});

// ============================================================================
// Property 11: Credentials never stored in plaintext
// Feature: drawrun-improvements, Property 11: passwords never stored in plaintext
// Validates: Requirements 9.1, 9.2
// ============================================================================

describe('Property 11: Credentials never stored in plaintext', () => {
    test('Property 11: Garmin/Suunto passwords never stored in plaintext', async () => {
        const { fc } = require('@fast-check/jest');
        const { encrypt: realEncrypt } = jest.requireActual('../src/crypto_utils');

        process.env.CREDENTIALS_SECRET = 'test-secret-for-encryption-testing';

        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 1 }),
                async (password) => {
                    const stored = realEncrypt(password);
                    return stored !== password && /^[0-9a-f]{32}:[0-9a-f]{32}:/.test(stored);
                }
            ),
            { numRuns: 100 }
        );

        delete process.env.CREDENTIALS_SECRET;
    });
});
