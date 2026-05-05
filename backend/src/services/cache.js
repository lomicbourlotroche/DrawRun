/**
 * ============================================================
 * CACHE SERVICE
 * ============================================================
 * Service de cache hybride (Redis + LRU fallback)
 * 
 * Utilise Redis en production, LRU cache en développement
 */

'use strict';
const { logger } = require('../logger');

const redisClient = require('../config/redis');
const { LRUCache } = require('../performance');

class CacheService {
    constructor() {
        this.redis = null;
        this.lru = new LRUCache(1000, 5 * 60 * 1000); // 1000 items, 5min TTL
        this.useRedis = false;
    }

    async init() {
        try {
            this.redis = await redisClient.connect();
            this.useRedis = !!this.redis;
        } catch (err) {
            logger.warn('Redis unavailable, falling back to LRU cache:', err.message);
            this.redis = null;
            this.useRedis = false;
        }

        if (this.useRedis) {
            logger.info('Cache service: Redis mode');
        } else {
            logger.info('Cache service: LRU mode (Redis not available)');
        }
    }

    /**
     * Generate cache key with prefix
     */
    _key(key) {
        return `drawrun:${key}`;
    }

    /**
     * Get value from cache
     */
    async get(key) {
        const fullKey = this._key(key);
        
        if (this.useRedis && this.redis) {
            try {
                const value = await this.redis.get(fullKey);
                if (value) {
                    return JSON.parse(value);
                }
            } catch (err) {
                logger.error('Redis get error:', err.message);
            }
        }
        
        // Fallback to LRU
        return this.lru.get(key);
    }

    /**
     * Set value in cache
     */
    async set(key, value, ttl = 300) {
        const fullKey = this._key(key);
        const ttlMs = ttl * 1000;
        
        if (this.useRedis && this.redis) {
            try {
                await this.redis.setex(
                    fullKey, 
                    ttl, 
                    JSON.stringify(value)
                );
                return;
            } catch (err) {
                logger.error('Redis set error:', err.message);
            }
        }
        
        // Fallback to LRU
        this.lru.set(key, value, ttlMs);
    }

    /**
     * Delete value from cache
     */
    async del(key) {
        const fullKey = this._key(key);
        
        if (this.useRedis && this.redis) {
            try {
                await this.redis.del(fullKey);
            } catch (err) {
                logger.error('Redis del error:', err.message);
            }
        }
        
        // Also remove from LRU
        this.lru.cache.delete(key);
    }

    /**
     * Delete multiple keys by pattern
     */
    async delPattern(pattern) {
        const fullPattern = this._key(pattern);
        
        if (this.useRedis && this.redis) {
            try {
                const keys = await this.redis.keys(`${fullPattern}*`);
                if (keys.length > 0) {
                    await this.redis.del(...keys);
                }
            } catch (err) {
                logger.error('Redis delPattern error:', err.message);
            }
        }
        
        // Clear LRU cache for pattern (simplified)
        for (const [key] of this.lru.cache) {
            if (key.startsWith(pattern)) {
                this.lru.cache.delete(key);
            }
        }
    }

    /**
     * Get or set value (cache-aside pattern)
     */
    async getOrSet(key, factory, ttl = 300) {
        let value = await this.get(key);
        
        if (value === null) {
            value = await factory();
            if (value !== null && value !== undefined) {
                await this.set(key, value, ttl);
            }
        }
        
        return value;
    }

    /**
     * Cache middleware for Express
     */
    middleware(ttl = 300) {
        return async (req, res, next) => {
            // Skip cache for non-GET requests
            if (req.method !== 'GET') {
                return next();
            }
            
            const key = `route:${req.originalUrl}`;
            
            try {
                const cached = await this.get(key);
                if (cached) {
                    return res.json(cached);
                }
                
                // Override res.json to cache the response
                const originalJson = res.json.bind(res);
                res.json = (data) => {
                    this.set(key, data, ttl);
                    return originalJson(data);
                };
                
                next();
            } catch (err) {
                next();
            }
        };
    }

    /**
     * Health check
     */
    async healthCheck() {
        const redisHealth = await redisClient.healthCheck();
        
        return {
            redis: redisHealth,
            lru: {
                size: this.lru.cache.size,
                maxSize: this.lru.maxSize
            },
            mode: this.useRedis ? 'redis' : 'lru'
        };
    }

    /**
     * Clear all cache
     */
    async clear() {
        if (this.useRedis && this.redis) {
            try {
                await this.redis.flushdb();
            } catch (err) {
                logger.error('Redis clear error:', err.message);
            }
        }
        
        this.lru.cache.clear();
    }
}

module.exports = new CacheService();
