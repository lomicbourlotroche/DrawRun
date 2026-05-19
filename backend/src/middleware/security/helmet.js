/**
 * ============================================================
 * HELMET CONFIGURATION
 * ============================================================
 * Configures Helmet.js with strict CSP and security headers.
 */

'use strict';

const helmet = require('helmet');
const crypto = require('crypto');
const { logger } = require('../../utils/logger');

/**
 * Configure Helmet with strict CSP and security headers.
 * Includes CSP reporting for monitoring policy violations.
 * 
 * Note: CSP is in report-only mode by default (CSP_REPORT_ONLY=true) for monitoring.
 * Set CSP_REPORT_ONLY=false to enforce strict CSP after testing.
 */
function configureHelmet() {
    const reportUri = process.env.CSP_REPORT_URI || '/api/csp-report';
    // Default to report-only mode for safety - set CSP_REPORT_ONLY=false to enforce
    const reportOnly = process.env.CSP_REPORT_ONLY !== 'false';
    
    // Allow connections to the API domain
    const corsOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [];
    const connectSrc = ["'self'", ...corsOrigins];

    return helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'"],  // Removed 'unsafe-inline' for security - use external stylesheets
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: connectSrc,
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
                reportUri: [reportUri],
            },
            reportOnly: reportOnly,
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" },
    });
}

/**
 * Generate a CSP nonce for inline scripts/styles
 * @returns {string} Base64-encoded nonce
 */
function generateCspNonce() {
    return crypto.randomBytes(16).toString('base64');
}

/**
 * Middleware to add CSP nonce to response locals
 * Use this before routes that render HTML with inline scripts/styles
 */
function cspNonceMiddleware(req, res, next) {
    res.locals.cspNonce = generateCspNonce();
    next();
}

/**
 * Get CSP header value with current nonce
 * Use this to set Content-Security-Policy header manually if needed
 * @param {string} nonce - Nonce value
 * @returns {string} CSP header value
 */
function getCspHeader(nonce) {
    return `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self'; img-src 'self' data: https:; connect-src 'self'; font-src 'self'; object-src 'none'; media-src 'self'; frame-src 'none'; report-uri /api/csp-report`;
}

/**
 * CSP Report Handler
 * Receives CSP violation reports and logs them for monitoring.
 */
function cspReportHandler(req, res) {
    try {
        const report = req.body;
        const userAgent = req.get('User-Agent') || 'unknown';
        const ip = req.ip || req.connection?.remoteAddress || 'unknown';

        // Log CSP violation
        logger.warn('[CSP Violation]', {
            timestamp: new Date().toISOString(),
            ip,
            userAgent,
            documentUri: report['document-uri'] || report.documentURI,
            violatedDirective: report['violated-directive'] || report.violatedDirective,
            blockedUri: report['blocked-uri'] || report.blockedURI,
            sourceFile: report['source-file'] || report.sourceFile,
            lineNumber: report['line-number'] || report.lineNumber,
            columnNumber: report['column-number'] || report.columnNumber,
        });

        // Store in security log
        try {
            const { securityLog } = require('../../utils/logger');
            securityLog('csp_violation', {
                ip,
                userAgent,
                report: report
            });
        } catch (e) {
            // Logger might not be available
        }

        res.status(204).send();
    } catch (error) {
        logger.error('[CSP Report Error]', error.message);
        res.status(400).json({ error: 'Invalid report' });
    }
}

module.exports = {
    configureHelmet,
    generateCspNonce,
    cspNonceMiddleware,
    getCspHeader,
    cspReportHandler,
};
