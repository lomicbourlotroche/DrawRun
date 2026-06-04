'use strict';

/**
 * ============================================================
 * AUTH MIDDLEWARE TESTS
 * ============================================================
 * Tests for verifyToken middleware
 */

const { verifyToken } = require('../../src/middleware/auth');

// Mock jwt utils
jest.mock('../../src/utils/jwt', () => ({
    verifyAccessToken: jest.fn(),
}));

const { verifyAccessToken } = require('../../src/utils/jwt');

describe('verifyToken middleware', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        jest.clearAllMocks();
        mockReq = {
            headers: {},
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        mockNext = jest.fn();
    });

    // Happy path
    test('should call next() when valid token is provided', () => {
        const mockUser = { id: 1, email: 'test@example.com' };
        mockReq.headers.authorization = 'Bearer valid-token-here';
        verifyAccessToken.mockReturnValue({ valid: true, user: mockUser });

        verifyToken(mockReq, mockRes, mockNext);

        expect(verifyAccessToken).toHaveBeenCalledWith('valid-token-here');
        expect(mockReq.user).toEqual(mockUser);
        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockRes.status).not.toHaveBeenCalled();
    });

    // Error states
    test('should return 401 when no authorization header is present', () => {
        verifyToken(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'No authorization header provided' });
        expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 when authorization header is empty', () => {
        mockReq.headers.authorization = '';
        verifyAccessToken.mockReturnValue({ valid: false, error: 'No token provided' });

        verifyToken(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 when authorization header has no Bearer prefix', () => {
        mockReq.headers.authorization = 'Basic someCredentials';
        verifyAccessToken.mockReturnValue({ valid: false, error: 'No token provided' });

        verifyToken(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 when token is malformed', () => {
        mockReq.headers.authorization = 'Bearer';
        verifyAccessToken.mockReturnValue({ valid: false, error: 'No token provided' });

        verifyToken(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 when access token is expired', () => {
        mockReq.headers.authorization = 'Bearer expired-token';
        verifyAccessToken.mockReturnValue({ valid: false, error: 'Token expired' });

        verifyToken(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
        expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 when verifyAccessToken returns invalid', () => {
        mockReq.headers.authorization = 'Bearer some-token';
        verifyAccessToken.mockReturnValue({ valid: false, error: 'Invalid signature' });

        verifyToken(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
        expect(mockNext).not.toHaveBeenCalled();
    });

    // Edge cases
    test('should handle authorization header with extra spaces', () => {
        mockReq.headers.authorization = '  Bearer   token-with-spaces  ';
        verifyAccessToken.mockReturnValue({ valid: false, error: 'No token provided' });

        verifyToken(mockReq, mockRes, mockNext);

        // split(' ')[1] on '  Bearer   token-with-spaces  ' gives empty
        expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    test('should handle lowercase bearer prefix', () => {
        mockReq.headers.authorization = 'bearer lower-token';
        const mockUser = { id: 1, email: 'test@example.com' };
        verifyAccessToken.mockReturnValue({ valid: true, user: mockUser });

        verifyToken(mockReq, mockRes, mockNext);

        // split(' ')[1] gives 'lower-token' with 'bearer '
        expect(verifyAccessToken).toHaveBeenCalledWith('lower-token');
        expect(mockNext).toHaveBeenCalled();
    });

    test('should attach user object to request when token is valid', () => {
        const mockUser = { id: 42, email: 'john@example.com', type: 'access' };
        mockReq.headers.authorization = 'Bearer robert';
        verifyAccessToken.mockReturnValue({ valid: true, user: mockUser });

        verifyToken(mockReq, mockRes, mockNext);

        expect(mockReq.user).toEqual(mockUser);
        expect(mockReq.user.id).toBe(42);
        expect(mockReq.user.email).toBe('john@example.com');
    });
});
