/**
 * ============================================================
 * VALIDATORS TESTS
 * ============================================================
 * Tests pour la validation des entrées
 */

const {
    validatePagination,
    sanitizeString,
    isValidEmail,
    isStrongPassword
} = require('../src/utils/validators');

describe('Pagination Validation', () => {
    test('should validate pagination defaults', () => {
        const result = validatePagination(1, 20);
        expect(result.page).toBe(1);
        expect(result.perPage).toBe(20);
    });
    
    test('should clamp page to minimum 1', () => {
        const result = validatePagination(0, 20);
        expect(result.page).toBe(1);
    });
    
    test('should clamp per_page to maximum 100', () => {
        const result = validatePagination(1, 200);
        expect(result.perPage).toBe(100);
    });
    
    test('should handle string inputs', () => {
        const result = validatePagination('5', '50');
        expect(result.page).toBe(5);
        expect(result.perPage).toBe(50);
    });
});

describe('String Sanitization', () => {
    test('should trim strings', () => {
        expect(sanitizeString('  test  ')).toBe('test');
    });
    
    test('should limit string length', () => {
        const longString = 'a'.repeat(20000);
        const result = sanitizeString(longString);
        expect(result.length).toBe(10000);
    });
    
    test('should handle null/undefined', () => {
        expect(sanitizeString(null)).toBe('');
        expect(sanitizeString(undefined)).toBe('');
    });
});

describe('Email Validation', () => {
    test('should accept valid emails', () => {
        expect(isValidEmail('user@example.com')).toBe(true);
        expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true);
    });
    
    test('should reject invalid emails', () => {
        expect(isValidEmail('')).toBe(false);
        expect(isValidEmail('user@')).toBe(false);
        expect(isValidEmail('@example.com')).toBe(false);
        expect(isValidEmail('user@example')).toBe(false);
    });
});

describe('Password Validation', () => {
    test('should accept strong passwords', () => {
        expect(isStrongPassword('StrongP@ss123')).toBe(true);
        expect(isStrongPassword('MyP@ssw0rd!')).toBe(true);
    });
    
    test('should reject weak passwords', () => {
        expect(isStrongPassword('short')).toBe(false);
        expect(isStrongPassword('password')).toBe(false);
        expect(isStrongPassword('12345678')).toBe(false);
    });
});
