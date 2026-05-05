/**
 * Crypto Utilities
 * ================
 * Chiffrement AES-256-GCM pour les credentials tiers (Garmin, Strava).
 */

'use strict';

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;

function getEncryptionKey() {
    const secret = process.env.CREDENTIALS_SECRET;
    if (!secret) {
        throw new Error('CREDENTIALS_SECRET environment variable is required for encryption');
    }
    // Derive a 32-byte key from the secret using PBKDF2 with a project-specific salt
    return crypto.pbkdf2Sync(secret, 'drawrun-v2-credentials-salt', 100000, 32, 'sha256');
}

/**
 * Chiffre une chaîne de caractères.
 * Retourne : iv:tag:encrypted (hex encodé)
 */
function encrypt(text) {
    if (!text) return null;
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${tag}:${encrypted}`;
}

/**
 * Déchiffre une chaîne chiffrée.
 */
function decrypt(encryptedText) {
    if (!encryptedText) return null;

    // Handle legacy unencrypted values (not hex:hex:hex format)
    if (!encryptedText.match(/^[0-9a-f]{32}:[0-9a-f]{32}:/)) {
        return encryptedText; // Legacy plaintext
    }

    const key = getEncryptionKey();
    const [ivHex, tagHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

module.exports = { encrypt, decrypt };
