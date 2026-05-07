/* eslint-disable security/detect-non-literal-fs-filename, security/detect-object-injection */
/**
 * ============================================================
 * Audit Logging System
 * ============================================================
 * Centralized logging with Winston for security audit trails.
 */

'use strict';

const winston = require('winston');
const path = require('path');
const fs = require('fs');

const LOG_DIR = process.env.LOG_DIR || './logs';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
        return `[${timestamp}] ${level}: ${message} ${metaStr}`;
    })
);

const logger = winston.createLogger({
    level: LOG_LEVEL,
    format: logFormat,
    transports: [
        new winston.transports.File({ 
            filename: path.join(LOG_DIR, 'error.log'), 
            level: 'error',
            maxsize: 5242880,
            maxFiles: 5
        }),
        new winston.transports.File({ 
            filename: path.join(LOG_DIR, 'combined.log'),
            maxsize: 5242880,
            maxFiles: 5
        }),
        new winston.transports.File({ 
            filename: path.join(LOG_DIR, 'security.log'),
            level: 'warn',
            maxsize: 5242880,
            maxFiles: 10
        }),
        new winston.transports.File({ 
            filename: path.join(LOG_DIR, 'auth.log'),
            maxsize: 5242880,
            maxFiles: 10
        })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat,
        level: 'debug'
    }));
}

function log(level, message, meta = {}) {
    logger.log(level, message, { ...meta, service: 'drawrun' });
}

function logInfo(message, meta = {}) {
    log('info', message, meta);
}

function logWarn(message, meta = {}) {
    log('warn', message, meta);
}

function logError(message, meta = {}) {
    log('error', message, meta);
}

function logDebug(message, meta = {}) {
    log('debug', message, meta);
}

function auditLog(action, userId, details = {}, req = null) {
    const auditEntry = {
        action,
        userId,
        timestamp: new Date().toISOString(),
        ip: req?.ip || req?.connection?.remoteAddress || 'unknown',
        userAgent: req?.get('User-Agent') || 'unknown',
        ...details
    };
    
    log('info', `AUDIT: ${action}`, auditEntry);
    
    if (['LOGIN', 'REGISTER', 'LOGOUT', 'PASSWORD_CHANGE', '2FA_ENABLE', '2FA_DISABLE', 
         'DELETE_ACCOUNT', 'SYNC_START', 'SYNC_COMPLETE', 'PROFILE_UPDATE'].includes(action)) {
        logger.write({ level: 'info', message: `[AUTH] ${new Date().toISOString()} ${action} user=${userId} ip=${auditEntry.ip}` });
    }
}

function securityLog(event, severity, details = {}) {
    log('warn', `SECURITY [${severity}]: ${event}`, {
        event,
        severity,
        ...details
    });
}

function maskSensitiveData(obj) {
    if (!obj) return obj;
    const masked = { ...obj };
    const sensitiveFields = ['password', 'password_hash', 'token', 'secret', 'apiKey', 'accessToken', 'refreshToken', 'credentials', 'strava_token', 'garmin_token', 'suunto_token', 'decathlon_token', 'VAPID_PRIVATE_KEY'];
    
    for (const field of sensitiveFields) {
        if (masked[field]) {
            masked[field] = '***REDACTED***';
        }
    }
    
    return masked;
}

module.exports = {
    logger,
    log,
    logInfo,
    logWarn,
    logError,
    logDebug,
    auditLog,
    securityLog,
    maskSensitiveData
};