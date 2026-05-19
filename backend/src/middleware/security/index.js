/**
 * ============================================================
 * SECURITY MIDDLEWARE - Main Entry Point
 * ============================================================
 * Re-exports all security middleware functions.
 * 
 * This file maintains backward compatibility with the original security.js API.
 */

'use strict';

// Re-export everything from sub-modules
const helmetModule = require('./helmet');
const rateLimitModule = require('./rateLimit');
const headersModule = require('./headers');
const corsModule = require('./cors');

module.exports = {
    // From helmet.js
    ...helmetModule,
    configureHelmet: helmetModule.configureHelmet,
    cspReportHandler: helmetModule.cspReportHandler,
    generateCspNonce: helmetModule.generateCspNonce,
    cspNonceMiddleware: helmetModule.cspNonceMiddleware,
    getCspHeader: helmetModule.getCspHeader,
    
    // From rateLimit.js
    ...rateLimitModule,
    apiLimiter: rateLimitModule.apiLimiter,
    authLimiter: rateLimitModule.authLimiter,
    otpLimiter: rateLimitModule.otpLimiter,
    syncLimiter: rateLimitModule.syncLimiter,
    syncStatusLimiter: rateLimitModule.syncStatusLimiter,
    userBasedLimiter: rateLimitModule.userBasedLimiter,
    sensitiveUserLimiter: rateLimitModule.sensitiveUserLimiter,
    
    // From headers.js
    ...headersModule,
    securityHeaders: headersModule.securityHeaders,
    bodySizeLimiter: headersModule.bodySizeLimiter,
    validateContentType: headersModule.validateContentType,
    sanitizeInputs: headersModule.sanitizeInputs,
    
    // From cors.js
    ...corsModule,
    validateCorsOrigin: corsModule.validateCorsOrigin,
};
