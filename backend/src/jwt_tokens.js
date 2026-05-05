'use strict';

/**
 * ============================================================
 * JWT Refresh Token System
 * ============================================================
 * Refresh tokens are stored in main.db (table: refresh_tokens).
 * Supports per-token revocation and full user revocation.
 * Used by auth.js for token generation and /auth/refresh endpoint.
 */

const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const { dbGetMain, dbRunMain, dbAllMain } = require('./database');

const JWT_SECRET           = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRY  = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Concurrency guard: prevents simultaneous refresh token rotations for the same user
const pendingRefreshes = new Map();

// ============================================================================
// SCHEMA MIGRATION — called once from database.js initMainDb()
// ============================================================================

function ensureRefreshTokensTable(mainDb) {
    mainDb.run(`
        CREATE TABLE IF NOT EXISTS refresh_tokens (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL,
            token_hash  TEXT    NOT NULL UNIQUE,
            expires_at  DATETIME NOT NULL,
            revoked     INTEGER DEFAULT 0,
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

// ============================================================================
// TOKEN GENERATION
// ============================================================================

function generateAccessToken(user) {
    if (!JWT_SECRET) throw new Error('JWT_SECRET not set');
    return jwt.sign(
        { id: user.id, email: user.email, type: 'access' },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
}

async function generateRefreshToken(user) {
    if (!JWT_SECRET) throw new Error('JWT_SECRET not set');

    const jti = crypto.randomBytes(16).toString('hex');
    const token = jwt.sign(
        { id: user.id, email: user.email, type: 'refresh', jti },
        JWT_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    // Store hash in DB (never store the raw token)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS).toISOString();

    await dbRunMain(
        'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
        [user.id, tokenHash, expiresAt]
    );

    // Clean up expired tokens for this user (housekeeping)
    await dbRunMain(
        "DELETE FROM refresh_tokens WHERE user_id = ? AND (expires_at < datetime('now') OR revoked = 1)",
        [user.id]
    ).catch(() => {});

    return token;
}

// ============================================================================
// TOKEN VERIFICATION
// ============================================================================

function verifyAccessToken(token) {
    try {
        if (!JWT_SECRET) return { valid: false, error: 'JWT_SECRET not set' };
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.type !== 'access') return { valid: false, error: 'Invalid token type' };
        return { valid: true, user: decoded };
    } catch (error) {
        return { valid: false, error: error.message };
    }
}

async function verifyRefreshToken(token) {
    try {
        if (!JWT_SECRET) return { valid: false, error: 'JWT_SECRET not set' };
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.type !== 'refresh') return { valid: false, error: 'Invalid token type' };

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const stored = await dbGetMain(
            "SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked = 0 AND expires_at > datetime('now')",
            [tokenHash]
        );

        if (!stored) return { valid: false, error: 'Token revoked or expired' };
        return { valid: true, user: decoded, tokenHash, stored };
    } catch (error) {
        return { valid: false, error: error.message };
    }
}

// ============================================================================
// REFRESH TOKEN ROTATION
// ============================================================================

/**
 * Rotate refresh token - security best practice.
 * When a refresh token is used, the old one is revoked and a new one is issued.
 * This prevents token replay attacks.
 * Concurrency guard: only one refresh per user at a time.
 */
async function rotateRefreshToken(oldToken, user) {
    const userId = user.id;

    // If another refresh is already in progress for this user, wait for it
    if (pendingRefreshes.has(userId)) {
        return pendingRefreshes.get(userId);
    }

    // Create a promise for this refresh operation
    const refreshPromise = (async () => {
        try {
            // Verify the old token first
            const verification = await verifyRefreshToken(oldToken);
            if (!verification.valid) {
                return { success: false, error: verification.error };
            }

            // Revoke the old token
            await revokeRefreshToken(oldToken);

            // Generate new tokens (access + refresh)
            const accessToken = generateAccessToken(user);
            const newRefreshToken = await generateRefreshToken(user);

            return {
                success: true,
                accessToken,
                refreshToken: newRefreshToken
            };
        } catch (error) {
            return { success: false, error: error.message };
        } finally {
            // Clean up the pending promise
            pendingRefreshes.delete(userId);
        }
    })();

    // Store the promise so concurrent calls can await it
    pendingRefreshes.set(userId, refreshPromise);
    return refreshPromise;
}

// ============================================================================
// TOKEN REVOCATION
// ============================================================================

async function revokeRefreshToken(token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await dbRunMain('UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?', [tokenHash]);
}

async function revokeAllUserTokens(userId) {
    await dbRunMain('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?', [userId]);
}

async function cleanExpiredTokens() {
    await dbRunMain(
        "DELETE FROM refresh_tokens WHERE expires_at < datetime('now') OR revoked = 1"
    );
}

module.exports = {
    ensureRefreshTokensTable,
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    rotateRefreshToken,
    revokeRefreshToken,
    revokeAllUserTokens,
    cleanExpiredTokens,
};
