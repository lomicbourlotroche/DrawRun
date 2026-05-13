'use strict';

const { dbGetMain, dbRunMain } = require('../../database');
const { logger } = require('../../utils/logger');

const dbGet = (q, p) => dbGetMain(q, p);
const dbRun = (q, p) => dbRunMain(q, p);

const OTP_LOCKOUT_ATTEMPTS = 5;
const OTP_LOCKOUT_MINUTES = 30;

async function isOtpLocked(email) {
    try {
        const user = await dbGet('SELECT otp_attempts, otp_locked_until FROM users WHERE email = ?', [email.toLowerCase().trim()]);
        if (!user) return { locked: false };
        if (user.otp_locked_until) {
            const lockedUntil = new Date(user.otp_locked_until);
            if (lockedUntil > new Date()) {
                const remainingMinutes = Math.ceil((lockedUntil - new Date()) / 60000);
                return { locked: true, remainingMinutes };
            }
        }
        return { locked: false };
    } catch (e) {
        logger.error('OTP lock check error:', e.message);
        return { locked: false };
    }
}

async function incrementOtpAttempts(email) {
    try {
        const user = await dbGet('SELECT id, otp_attempts FROM users WHERE email = ?', [email.toLowerCase().trim()]);
        if (!user) return { attempts: 0 };
        const attempts = (user.otp_attempts || 0) + 1;
        if (attempts >= OTP_LOCKOUT_ATTEMPTS) {
            const lockedUntil = new Date(Date.now() + OTP_LOCKOUT_MINUTES * 60000).toISOString();
            await dbRun('UPDATE users SET otp_attempts = ?, otp_locked_until = ? WHERE id = ?', [attempts, lockedUntil, user.id]);
            return { attempts, lockedUntil };
        }
        await dbRun('UPDATE users SET otp_attempts = ? WHERE id = ?', [attempts, user.id]);
        return { attempts };
    } catch (e) {
        logger.error('OTP increment error:', e.message);
        return { attempts: 0 };
    }
}

async function clearOtpAttempts(email) {
    try {
        await dbRun('UPDATE users SET otp_attempts = 0, otp_locked_until = NULL WHERE email = ?', [email.toLowerCase().trim()]);
    } catch (e) {
        logger.error('OTP clear error:', e.message);
    }
}

module.exports = { isOtpLocked, incrementOtpAttempts, clearOtpAttempts };
