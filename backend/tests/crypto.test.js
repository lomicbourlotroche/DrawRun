/**
 * ============================================================
 * CRYPTO UTILS TESTS
 * ============================================================
 * Tests pour le chiffrement/déchiffrement
 */

const { encrypt, decrypt } = require('../src/crypto_utils');
const { test: fcTest, fc } = require('@fast-check/jest');

describe('Encryption/Decryption', () => {
    // Set up encryption key for tests
    beforeAll(() => {
        process.env.CREDENTIALS_SECRET = 'test-secret-32-characters-long!!';
    });
    
    test('should encrypt and decrypt text', () => {
        const original = 'sensitive-data-123';
        const encrypted = encrypt(original);
        
        expect(encrypted).toBeDefined();
        expect(encrypted).not.toBe(original);
        expect(typeof encrypted).toBe('string');
        
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(original);
    });
    
    test('should produce different ciphertexts for same input', () => {
        const text = 'test-data';
        const encrypted1 = encrypt(text);
        const encrypted2 = encrypt(text);
        
        expect(encrypted1).not.toBe(encrypted2);
        expect(decrypt(encrypted1)).toBe(text);
        expect(decrypt(encrypted2)).toBe(text);
    });
    
    test('should handle empty string', () => {
        // encrypt() returns null for empty/falsy input by design (no-op guard).
        // Verify that behaviour is consistent: null in → null out.
        const encrypted = encrypt('');
        expect(encrypted).toBeNull();
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBeNull();
    });
    
    test('should handle special characters', () => {
        const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        const encrypted = encrypt(special);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(special);
    });
});

// Feature: drawrun-improvements, Property 12: encrypt/decrypt round-trip
// Validates: Requirement 9.3
describe('Property 12: encrypt/decrypt round-trip', () => {
    beforeAll(() => {
        process.env.CREDENTIALS_SECRET = 'test-secret-32-characters-long!!';
    });

    afterAll(() => {
        delete process.env.CREDENTIALS_SECRET;
    });

    fcTest.prop([fc.string({ minLength: 1 })])(
        'decrypt(encrypt(password)) === password for any non-empty string',
        (password) => {
            return decrypt(encrypt(password)) === password;
        }
    );
});
