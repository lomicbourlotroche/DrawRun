'use strict';

/**
 * ============================================================
 * HELPERS TESTS
 * ============================================================
 * Tests for maskEmail, sleep, clamp utility functions
 */

const { maskEmail, sleep, clamp } = require('../../src/utils/helpers');

describe('maskEmail', () => {
    // Happy path
    test('should mask email with name > 2 chars', () => {
        expect(maskEmail('john.doe@example.com')).toBe('j***@example.com');
    });

    test('should mask email with name <= 2 chars', () => {
        expect(maskEmail('ab@example.com')).toBe('a*@example.com');
    });

    test('should mask email with single char name', () => {
        expect(maskEmail('a@example.com')).toBe('a*@example.com');
    });

    // Edge cases
    test('should return null for null input', () => {
        expect(maskEmail(null)).toBeNull();
    });

    test('should return null for undefined input', () => {
        expect(maskEmail(undefined)).toBeNull();
    });

    test('should return original email if no domain', () => {
        expect(maskEmail('invalid-email')).toBe('invalid-email');
    });

    test('should return original email if empty string', () => {
        expect(maskEmail('')).toBeNull();
    });

    test('should handle emails with dots in name', () => {
        expect(maskEmail('first.last@domain.com')).toBe('f***@domain.com');
    });

    test('should handle emails with plus sign', () => {
        expect(maskEmail('user+tag@domain.com')).toBe('u***@domain.com');
    });

    test('should handle emails with numbers', () => {
        expect(maskEmail('test123@domain.com')).toBe('t***@domain.com');
    });
});

describe('clamp', () => {
    // Happy path
    test('should return value when within range', () => {
        expect(clamp(5, 0, 10)).toBe(5);
    });

    test('should return min when value below range', () => {
        expect(clamp(-5, 0, 10)).toBe(0);
    });

    test('should return max when value above range', () => {
        expect(clamp(15, 0, 10)).toBe(10);
    });

    // Edge cases
    test('should handle value equal to min', () => {
        expect(clamp(0, 0, 10)).toBe(0);
    });

    test('should handle value equal to max', () => {
        expect(clamp(10, 0, 10)).toBe(10);
    });

    test('should handle negative ranges', () => {
        expect(clamp(-5, -10, -1)).toBe(-5);
    });

    test('should handle value below negative range', () => {
        expect(clamp(-15, -10, -1)).toBe(-10);
    });

    test('should handle value above negative range', () => {
        expect(clamp(0, -10, -1)).toBe(-1);
    });

    test('should handle decimal values', () => {
        expect(clamp(3.14, 2.5, 3.0)).toBe(3.0);
    });

    test('should handle zero range', () => {
        expect(clamp(5, 5, 5)).toBe(5);
    });

    test('should handle large numbers', () => {
        expect(clamp(Number.MAX_SAFE_INTEGER, 0, 100)).toBe(100);
    });
});

describe('sleep', () => {
    test('should resolve after given time', async () => {
        const start = Date.now();
        await sleep(50);
        const elapsed = Date.now() - start;
        expect(elapsed).toBeGreaterThanOrEqual(40);
    });

    test('should resolve with 0ms delay', async () => {
        const start = Date.now();
        await sleep(0);
        const elapsed = Date.now() - start;
        expect(elapsed).toBeLessThan(50);
    });

    test('should return a Promise', () => {
        const result = sleep(10);
        expect(result).toBeInstanceOf(Promise);
    });
});
