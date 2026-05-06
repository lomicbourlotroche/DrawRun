/* eslint-disable security/detect-object-injection, unused-imports/no-unused-vars */
/**
 * ============================================================
 * PERFORMANCE OPTIMIZATION - Cache & Compression
 * ============================================================
 * 
 * - In-memory LRU cache for expensive computations
 * - Response compression middleware
 * - Query result caching
 * 
 * @module performance
 */

'use strict';

const crypto = require('crypto');

/**
 * LRU Cache implementation
 */
class LRUCache {
    constructor(maxSize = 100, maxAge = 5 * 60 * 1000) {
        this.maxSize = maxSize;
        this.maxAge = maxAge;
        this.cache = new Map();
    }
    
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        
        // Move to end (most recently used)
        this.cache.delete(key);
        this.cache.set(key, item);
        
        return item.value;
    }
    
    set(key, value, ttl = this.maxAge) {
        // Evict oldest if at capacity
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, {
            value,
            expiresAt: Date.now() + ttl,
        });
    }
    
    has(key) {
        return this.get(key) !== null;
    }
    
    del(key) {
        this.cache.delete(key);
    }
    
    clear() {
        this.cache.clear();
    }
    
    size() {
        return this.cache.size;
    }
}

// Global caches
const caches = {
    // PMC calculations (can be cached for 15 minutes)
    pmc: new LRUCache(200, 15 * 60 * 1000),
    
    // Zone calculations (can be cached for 1 hour)
    zones: new LRUCache(100, 60 * 60 * 1000),
    
    // User profiles (can be cached for 5 minutes)
    profiles: new LRUCache(100, 5 * 60 * 1000),
    
    // Metrics summaries (can be cached for 10 minutes)
    metrics: new LRUCache(100, 10 * 60 * 1000),
    
    // Recommendations (can be cached for 5 minutes)
    recommendations: new LRUCache(100, 5 * 60 * 1000),
};

const cacheKey = (prefix, ...args) => {
    const str = args.map(a => JSON.stringify(a)).join(':');
    const hash = crypto.createHash('md5').update(str).digest('hex').substring(0, 8);
    return `${prefix}:${hash}`;
};

const cached = (cacheName, ttl) => (target, propertyName, descriptor) => {
    if (descriptor.value instanceof Function) {
        const original = descriptor.value;
        
        descriptor.value = async function(...args) {
            const cache = caches[cacheName];
            if (!cache) return original.apply(this, args);
            
            const key = cacheKey(propertyName, ...args);
            const cached = cache.get(key);
            
            if (cached !== null) {
                return cached;
            }
            
            const result = await original.apply(this, args);
            cache.set(key, result, ttl);
            
            return result;
        };
    }
    return descriptor;
};

// Cache invalidation helpers
const invalidateCache = (cacheName, pattern = null) => {
    if (!caches[cacheName]) return;
    
    if (!pattern) {
        caches[cacheName].clear();
        return;
    }
    
    // For pattern-based invalidation (user-specific)
    // Would need to track keys per user
    // For now, just clear all
    caches[cacheName].clear();
};

const invalidateUserCache = (userId) => {
    // In production, would track which keys belong to which user
    // For now, clear all user-related caches
    caches.profiles.clear();
    caches.pmc.clear();
    caches.metrics.clear();
    caches.recommendations.clear();
};

// Response compression
const compression = require('compression');
const compressionMiddleware = compression({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
    },
    level: 6, // Balanced compression
    threshold: 1024, // Only compress > 1KB
});

// Metrics middleware
const performanceMetrics = {
    requests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    
    hitRate() {
        const total = this.cacheHits + this.cacheMisses;
        return total > 0 ? (this.cacheHits / total * 100).toFixed(1) + '%' : 'N/A';
    },
    
    reset() {
        this.requests = 0;
        this.cacheHits = 0;
        this.cacheMisses = 0;
    },
    
    toJSON() {
        return {
            requests: this.requests,
            cacheHits: this.cacheHits,
            cacheMisses: this.cacheMisses,
            hitRate: this.hitRate(),
            cacheSizes: {
                pmc: caches.pmc.size(),
                zones: caches.zones.size(),
                profiles: caches.profiles.size(),
                metrics: caches.metrics.size(),
                recommendations: caches.recommendations.size(),
            },
        };
    },
};

module.exports = {
    caches,
    cacheKey,
    cached,
    invalidateCache,
    invalidateUserCache,
    compressionMiddleware,
    performanceMetrics,
    LRUCache,
};