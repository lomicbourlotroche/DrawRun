'use strict';

/**
 * Shared database helper functions.
 * Eliminates duplication across server.js, auth.js, strava_sync.js,
 * garmin_sync.js, and all service files.
 */

/**
 * Promisified db.get()
 */
function dbGet(db, query, params = []) {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

/**
 * Promisified db.run()
 */
function dbRun(db, query, params = []) {
    return new Promise((resolve, reject) => {
        db.run(query, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

/**
 * Promisified db.all()
 */
function dbAll(db, query, params = []) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

/**
 * Masks an email for logging (e.g. j***@example.com)
 */
function maskEmail(email) {
    if (!email) return null;
    const [name, domain] = email.split('@');
    if (!domain) return email;
    // For names of 1 char: show it + single star. For 2 chars: first + single star.
    // For 3+ chars: first char + three stars.
    if (name.length <= 2) return `${name[0]}*@${domain}`;
    return `${name[0]}${'*'.repeat(3)}@${domain}`;
}

/**
 * Async sleep utility
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Validate password strength (min 8 chars, at least one letter and one number)
 */
function isStrongPassword(password) {
    if (!password || typeof password !== 'string') return false;
    if (password.length < 8) return false;
    return /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
}

/**
 * Validate that a value is a positive number within bounds
 */
function validatePositiveNumber(value, min = 0, max = Infinity) {
    const num = Number(value);
    return !isNaN(num) && num >= min && num <= max;
}

/**
 * Clamp a number between min and max
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

module.exports = {
    dbGet,
    dbRun,
    dbAll,
    maskEmail,
    sleep,
    isValidEmail,
    isStrongPassword,
    validatePositiveNumber,
    clamp
};
