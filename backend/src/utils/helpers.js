'use strict';

function maskEmail(email) {
    if (!email) return null;
    const [name, domain] = email.split('@');
    if (!domain) return email;
    if (name.length <= 2) return `${name[0]}*@${domain}`;
    return `${name[0]}***@${domain}`;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

module.exports = { maskEmail, sleep, clamp };
