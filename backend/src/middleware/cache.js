'use strict';

/* eslint-disable unused-imports/no-unused-vars */

const crypto = require('crypto');
const { logger } = require('../utils/logger');
const { performanceMetrics } = require('./performance');

/**
 * Génère un ETag à partir des données
 * @param {Object|Array} data - Données à hasher
 * @returns {string} ETag (format: W/"hash")
 */
function generateETag(data) {
  const hash = crypto
    .createHash('md5')
    .update(JSON.stringify(data))
    .digest('hex')
    .substring(0, 16);
  return `W/"${hash}"`;
}

/**
 * Middleware pour ajouter les headers de cache
 * @param {number} maxAge - Durée de cache en secondes (default: 300)
 * @param {boolean} isPublic - Si true, cache public (default: false)
 * @returns {Function} Express middleware
 */
function cacheMiddleware(maxAge = 300, isPublic = false) {
  return (req, res, next) => {
    if (res._cacheWrapped) return next();
    res._cacheWrapped = true;

    const originalJson = res.json;

    res.json = function(data) {
      const etag = generateETag(data);
      const clientETag = req.headers['if-none-match'];
      if (clientETag && clientETag === etag) {
        performanceMetrics.cacheHits++;
        return res.status(304).end();
      }

      performanceMetrics.cacheMisses++;
      res.setHeader('ETag', etag);
      res.setHeader('Cache-Control', `${isPublic ? 'public' : 'private'}, max-age=${maxAge}`);
      res.setHeader('Vary', 'Authorization');

      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Middleware pour désactiver le cache
 */
function noCacheMiddleware(req, res, next) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
}

/**
 * Middleware pour cache long (données qui changent peu)
 */
function longCacheMiddleware(req, res, next) {
  return cacheMiddleware(3600, false)(req, res, next);
}

/**
 * Middleware pour cache court (données fréquemment modifiées)
 */
function shortCacheMiddleware(req, res, next) {
  return cacheMiddleware(60, false)(req, res, next);
}

module.exports = {
  generateETag,
  cacheMiddleware,
  noCacheMiddleware,
  longCacheMiddleware,
  shortCacheMiddleware,
};
