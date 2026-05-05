'use strict';

/**
 * ============================================================
 * 2FA TOTP Authentication
 * ============================================================
 * Time-based One-Time Password (RFC 6238)
 * Supports authenticator apps (Google Authenticator, Authy, etc.)
 *
 * Uses the sql.js per-user DB API (dbGetMain, dbRunMain).
 * Column twofa_pending is added via migration in database.js.
 */

const OTPAuth = require('otpauth');
const { dbGetMain, dbRunMain } = require('./database');
const { encrypt, decrypt } = require('./crypto_utils');

/**
 * Generate a new 2FA secret for a user.
 * Stores the encrypted secret and marks setup as pending.
 */
async function generate2FASecret(userId, userEmail) {
    const issuer = process.env.TOTP_ISSUER || 'DrawRun';

    const secret = new OTPAuth.Secret({ size: 20 });

    const totp = new OTPAuth.TOTP({
        issuer,
        label: userEmail,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret,
    });

    const uri = totp.toURI();
    const encryptedSecret = encrypt(totp.secret.base32);

    await dbRunMain(
        'UPDATE users SET totp_secret = ?, twofa_pending = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [encryptedSecret, userId]
    );

    return {
        secret: totp.secret.base32,
        uri,
        qrCodeUrl: uri
    };
}

/**
 * Verify a TOTP token against the stored secret.
 */
async function verify2FAToken(userId, token) {
    const user = await dbGetMain('SELECT totp_secret FROM users WHERE id = ?', [userId]);

    if (!user || !user.totp_secret) {
        return { valid: false, error: '2FA not configured' };
    }

    let secretBase32;
    try {
        secretBase32 = decrypt(user.totp_secret);
    } catch (e) {
        return { valid: false, error: 'Failed to decrypt 2FA secret' };
    }

    const totp = new OTPAuth.TOTP({
        issuer: process.env.TOTP_ISSUER || 'DrawRun',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secretBase32),
    });

    const delta = totp.validate({ token: String(token), window: 1 });

    if (delta !== null) {
        return { valid: true };
    }

    return { valid: false, error: 'Invalid token' };
}

/**
 * Enable 2FA after the user has verified their token.
 */
async function enable2FA(userId, token) {
    const verification = await verify2FAToken(userId, token);

    if (!verification.valid) {
        return { success: false, error: verification.error };
    }

    await dbRunMain(
        'UPDATE users SET twofa_enabled = 1, twofa_pending = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [userId]
    );

    return { success: true };
}

/**
 * Disable 2FA after the user has verified their token.
 */
async function disable2FA(userId, token) {
    const verification = await verify2FAToken(userId, token);

    if (!verification.valid) {
        return { success: false, error: verification.error };
    }

    await dbRunMain(
        'UPDATE users SET totp_secret = NULL, twofa_enabled = 0, twofa_pending = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [userId]
    );

    return { success: true };
}

/**
 * Check if user has 2FA fully enabled.
 */
async function has2FAEnabled(userId) {
    const user = await dbGetMain('SELECT twofa_enabled FROM users WHERE id = ?', [userId]);
    return !!(user && user.twofa_enabled === 1);
}

/**
 * Check if user has a pending 2FA setup (secret generated but not yet verified).
 */
async function has2FAPending(userId) {
    const user = await dbGetMain('SELECT twofa_pending FROM users WHERE id = ?', [userId]);
    return !!(user && user.twofa_pending === 1);
}

module.exports = {
    generate2FASecret,
    verify2FAToken,
    enable2FA,
    disable2FA,
    has2FAEnabled,
    has2FAPending
};
