/**
 * Jest Test Setup
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.CREDENTIALS_SECRET = 'test-credentials-secret-for-testing-only';
process.env.DATA_DIR = './tests/test-data';

global.console = {
    ...console,
    error: jest.fn(),
    warn: jest.fn(),
    log: jest.fn()
};