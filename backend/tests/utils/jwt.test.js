'use strict';

/**
 * ============================================================
 * JWT UTILITY TESTS
 * ============================================================
 * Tests for token generation, verification, rotation, and revocation
 * 
 * NOTE: jwt.js captures JWT_SECRET as a const at module load time (line 18),
 * so we must set process.env.JWT_SECRET BEFORE requiring the module.
 */

const TEST_JWT_SECRET = 'test-jwt-secret-for-jwt-test-suite';

// Set JWT_SECRET before loading the module (it's captured as a const at require time)
process.env.JWT_SECRET = TEST_JWT_SECRET;

// Mock database
jest.mock('../../src/database', () => ({
    dbGetMain: jest.fn(),
    dbRunMain: jest.fn(),
    dbAllMain: jest.fn(),
}));

const { dbGetMain, dbRunMain } = require('../../src/database');
const jwt = require('jsonwebtoken');

const {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    rotateRefreshToken,
    revokeRefreshToken,
    revokeAllUserTokens,
    cleanExpiredTokens,
    ensureRefreshTokensTable,
} = require('../../src/utils/jwt');

describe('JWT Token System', () => {
    const mockUser = { id: 1, email: 'test@example.com' };

    beforeEach(() => {
        // Reset mocks completely (clears call history AND implementations/Once queue)
        dbRunMain.mockReset();
        dbGetMain.mockReset();
        dbRunMain.mockResolvedValue({});
        dbGetMain.mockResolvedValue(null);
    });

    describe('ensureRefreshTokensTable', () => {
        test('should create refresh_tokens table', () => {
            const mockDb = { run: jest.fn() };
            ensureRefreshTokensTable(mockDb);
            expect(mockDb.run).toHaveBeenCalledWith(
                expect.stringContaining('CREATE TABLE IF NOT EXISTS refresh_tokens')
            );
        });
    });

    describe('generateAccessToken', () => {
        test('should generate a valid JWT access token', () => {
            const token = generateAccessToken(mockUser);
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3); // JWT has 3 parts

            const decoded = jwt.verify(token, TEST_JWT_SECRET);
            expect(decoded.id).toBe(1);
            expect(decoded.email).toBe('test@example.com');
            expect(decoded.type).toBe('access');
        });

        test('should have short expiry (15m)', () => {
            const token = generateAccessToken(mockUser);
            const decoded = jwt.decode(token);
            const ttl = decoded.exp - decoded.iat;
            // 15 minutes = 900 seconds
            expect(ttl).toBe(900);
        });

        test('should throw if JWT_SECRET is falsy', () => {
            // isolateModules creates a fresh module registry; the new module
            // captures JWT_SECRET = '' at load time
            jest.isolateModules(() => {
                process.env.JWT_SECRET = '';
                const { generateAccessToken: genToken } = require('../../src/utils/jwt');
                expect(() => genToken(mockUser)).toThrow();
            });
            // Restore JWT_SECRET for subsequent tests
            process.env.JWT_SECRET = TEST_JWT_SECRET;
        });
    });

    describe('generateRefreshToken', () => {
        test('should generate a valid refresh token and store hash', async () => {
            const token = await generateRefreshToken(mockUser);
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3);

            const decoded = jwt.decode(token);
            expect(decoded.id).toBe(1);
            expect(decoded.type).toBe('refresh');
            expect(decoded.jti).toBeDefined();

            // Should have stored the hash in DB
            expect(dbRunMain).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO refresh_tokens'),
                expect.arrayContaining([1, expect.any(String), expect.any(String)])
            );
        });

        test('should clean up expired tokens after generation', async () => {
            await generateRefreshToken(mockUser);
            expect(dbRunMain).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM refresh_tokens'),
                [1]
            );
        });

        test('should throw if JWT_SECRET is falsy', async () => {
            jest.isolateModules(async () => {
                process.env.JWT_SECRET = '';
                const { generateRefreshToken: genToken } = require('../../src/utils/jwt');
                await expect(genToken(mockUser)).rejects.toThrow();
            });
            process.env.JWT_SECRET = TEST_JWT_SECRET;
        });
    });

    describe('verifyAccessToken', () => {
        test('should verify a valid access token', () => {
            const token = generateAccessToken(mockUser);
            const result = verifyAccessToken(token);
            expect(result.valid).toBe(true);
            expect(result.user.id).toBe(1);
            expect(result.user.email).toBe('test@example.com');
        });

        test('should reject a refresh token type', () => {
            // Sign with TEST_JWT_SECRET directly since jwt.js captures it as const
            const refreshToken = jwt.sign(
                { id: 1, email: 'test@example.com', type: 'refresh' },
                TEST_JWT_SECRET,
                { expiresIn: '15m' }
            );
            const result = verifyAccessToken(refreshToken);
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Invalid token type');
        });

        test('should reject expired token', () => {
            const expiredToken = jwt.sign(
                { id: 1, email: 'test@example.com', type: 'access' },
                TEST_JWT_SECRET,
                { expiresIn: '0s' }
            );
            const result = verifyAccessToken(expiredToken);
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
        });

        test('should reject malformed token', () => {
            const result = verifyAccessToken('not-a-valid-token');
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
        });

        test('should reject null/undefined token', () => {
            const resultNull = verifyAccessToken(null);
            expect(resultNull.valid).toBe(false);

            const resultUndefined = verifyAccessToken(undefined);
            expect(resultUndefined.valid).toBe(false);
        });

        test('should handle missing JWT_SECRET gracefully', () => {
            jest.isolateModules(() => {
                process.env.JWT_SECRET = '';
                const { verifyAccessToken: verify } = require('../../src/utils/jwt');
                const result = verify('some-token');
                expect(result.valid).toBe(false);
            });
            process.env.JWT_SECRET = TEST_JWT_SECRET;
        });
    });

    describe('verifyRefreshToken', () => {
        test('should verify a valid stored refresh token', async () => {
            const token = await generateRefreshToken(mockUser);

            // Mock DB to return a valid stored token
            dbGetMain.mockResolvedValueOnce({
                id: 1, user_id: 1, token_hash: 'somehash',
                revoked: 0, expires_at: '2099-01-01',
            });

            const result = await verifyRefreshToken(token);
            expect(result.valid).toBe(true);
            expect(result.user.id).toBe(1);
        });

        test('should reject revoked token', async () => {
            const token = await generateRefreshToken(mockUser);

            // Mock DB to return null (revoked or expired)
            dbGetMain.mockResolvedValueOnce(null);

            const result = await verifyRefreshToken(token);
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Token revoked or expired');
        });

        test('should reject expired token', async () => {
            const token = await generateRefreshToken(mockUser);

            // Mock DB to return null (expired)
            dbGetMain.mockResolvedValueOnce(null);

            const result = await verifyRefreshToken(token);
            expect(result.valid).toBe(false);
        });

        test('should reject access token type', async () => {
            const accessToken = generateAccessToken(mockUser);
            const result = await verifyRefreshToken(accessToken);
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Invalid token type');
        });
    });

    describe('revokeRefreshToken', () => {
        test('should revoke a specific token', async () => {
            dbRunMain.mockResolvedValue({});
            await revokeRefreshToken('some-token');
            expect(dbRunMain).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE refresh_tokens SET revoked = 1'),
                expect.any(Array)
            );
        });

        test('should propagate DB errors', async () => {
            dbRunMain.mockRejectedValueOnce(new Error('DB error'));
            await expect(revokeRefreshToken('token')).rejects.toThrow('DB error');
        });
    });

    describe('revokeAllUserTokens', () => {
        test('should revoke all tokens for a user', async () => {
            await revokeAllUserTokens(1);
            expect(dbRunMain).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?'),
                [1]
            );
        });
    });

    describe('cleanExpiredTokens', () => {
        test('should delete expired and revoked tokens', async () => {
            await cleanExpiredTokens();
            expect(dbRunMain).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM refresh_tokens')
            );
        });
    });

    describe('rotateRefreshToken', () => {
        test('should rotate a valid refresh token', async () => {
            // First, generate refresh token
            const oldToken = await generateRefreshToken(mockUser);

            // Mock verification to succeed
            dbGetMain.mockResolvedValueOnce({
                id: 1, user_id: 1, token_hash: 'hash',
                revoked: 0, expires_at: '2099-01-01',
            });

            const result = await rotateRefreshToken(oldToken, mockUser);

            expect(result.success).toBe(true);
            expect(result.accessToken).toBeDefined();
            expect(result.refreshToken).toBeDefined();
            // Old token should have been revoked
            expect(dbRunMain).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE refresh_tokens SET revoked = 1'),
                expect.any(Array)
            );
        });

        test('should return error for invalid old token', async () => {
            dbGetMain.mockResolvedValueOnce(null); // Token not found in DB

            const result = await rotateRefreshToken('invalid-token', mockUser);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        test('should handle concurrent rotation for different users', async () => {
            dbGetMain.mockImplementation(() => Promise.resolve({
                id: 1, user_id: 1, token_hash: 'hash',
                revoked: 0, expires_at: '2099-01-01',
            }));
            dbRunMain.mockImplementation(() => Promise.resolve({}));

            const oldToken = await generateRefreshToken(mockUser);
            const result = await rotateRefreshToken(oldToken, { ...mockUser, id: 99 });

            expect(result).toEqual(expect.objectContaining({success: true}));
            expect(result.accessToken).toBeDefined();
            expect(result.refreshToken).toBeDefined();
        });
    });
});
