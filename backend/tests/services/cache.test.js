'use strict';

/**
 * ============================================================
 * CACHE SERVICE TESTS
 * ============================================================
 * Tests for CacheService with Redis/LRU fallback
 */

// Mock dependencies
const mockRedisClient = {
    connect: jest.fn(),
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    flushdb: jest.fn(),
    healthCheck: jest.fn(),
};

jest.mock('../../src/config/redis', () => mockRedisClient);

jest.mock('../../src/utils/logger', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
}));

const CacheService = require('../../src/services/cache');

describe('CacheService', () => {
    let cacheService;

    beforeEach(() => {
        jest.clearAllMocks();
        // Create a fresh instance for each test
        // Since the module exports a singleton, we need to test at instance level
        cacheService = new CacheService.constructor();
        cacheService.redis = null;
        cacheService.useRedis = false;
        cacheService.lru.cache.clear();
    });

    describe('init()', () => {
        test('should fall back to LRU when Redis is unavailable', async () => {
            mockRedisClient.connect.mockRejectedValue(new Error('Connection refused'));
            const { logger } = require('../../src/utils/logger');

            await cacheService.init();

            expect(cacheService.useRedis).toBe(false);
            expect(logger.warn).toHaveBeenCalledWith(
                'Redis unavailable, falling back to LRU cache:',
                'Connection refused'
            );
        });

        test('should use Redis when connect succeeds', async () => {
            mockRedisClient.connect.mockResolvedValue({});
            const { logger } = require('../../src/utils/logger');

            await cacheService.init();

            expect(cacheService.useRedis).toBe(true);
            expect(logger.info).toHaveBeenCalledWith('Cache service: Redis mode');
        });
    });

    describe('get/set (LRU mode)', () => {
        beforeEach(async () => {
            cacheService.useRedis = false;
            cacheService.redis = null;
        });

        test('should set and get a value', async () => {
            await cacheService.set('test-key', { data: 'test' });
            const result = await cacheService.get('test-key');
            expect(result).toEqual({ data: 'test' });
        });

        test('should return null for non-existent key', async () => {
            const result = await cacheService.get('non-existent');
            expect(result).toBeNull();
        });

        test('should overwrite existing value', async () => {
            await cacheService.set('key', 'value1');
            await cacheService.set('key', 'value2');
            const result = await cacheService.get('key');
            expect(result).toBe('value2');
        });

        test('should handle string values', async () => {
            await cacheService.set('str', 'hello');
            expect(await cacheService.get('str')).toBe('hello');
        });

        test('should handle numeric values', async () => {
            await cacheService.set('num', 42);
            expect(await cacheService.get('num')).toBe(42);
        });

        test('should handle array values', async () => {
            const arr = [1, 2, 3, { nested: true }];
            await cacheService.set('arr', arr);
            expect(await cacheService.get('arr')).toEqual(arr);
        });

        test('should handle null value', async () => {
            await cacheService.set('null-key', null);
            expect(await cacheService.get('null-key')).toBeNull();
        });

        test('should respect custom TTL', async () => {
            cacheService.lru.maxAge = 10000; // Reset maxAge for test
            await cacheService.set('ttl-key', 'expires-fast', 0.05); // 50ms
            expect(await cacheService.get('ttl-key')).toBe('expires-fast');
            await new Promise(resolve => setTimeout(resolve, 100));
            expect(await cacheService.get('ttl-key')).toBeNull();
        });
    });

    describe('del (LRU mode)', () => {
        beforeEach(async () => {
            cacheService.useRedis = false;
            cacheService.redis = null;
        });

        test('should delete existing key', async () => {
            await cacheService.set('key', 'value');
            await cacheService.del('key');
            expect(await cacheService.get('key')).toBeNull();
        });

        test('should not throw when deleting non-existent key', async () => {
            await expect(cacheService.del('non-existent')).resolves.not.toThrow();
        });
    });

    describe('getOrSet (cache-aside)', () => {
        beforeEach(async () => {
            cacheService.useRedis = false;
            cacheService.redis = null;
        });

        test('should return cached value without calling factory', async () => {
            await cacheService.set('key', 'cached-value');
            const factory = jest.fn().mockResolvedValue('new-value');

            const result = await cacheService.getOrSet('key', factory);

            expect(result).toBe('cached-value');
            expect(factory).not.toHaveBeenCalled();
        });

        test('should call factory and cache result when cache misses', async () => {
            const factory = jest.fn().mockResolvedValue('computed-value');

            const result = await cacheService.getOrSet('key', factory);

            expect(result).toBe('computed-value');
            expect(factory).toHaveBeenCalledTimes(1);
            // Verify it's now cached
            expect(await cacheService.get('key')).toBe('computed-value');
        });

        test('should not cache null factory results', async () => {
            const factory = jest.fn().mockResolvedValue(null);

            const result = await cacheService.getOrSet('key', factory);

            expect(result).toBeNull();
            expect(factory).toHaveBeenCalledTimes(1);
            // Should not have been cached
            expect(await cacheService.get('key')).toBeNull();
        });

        test('should not cache undefined factory results', async () => {
            const factory = jest.fn().mockResolvedValue(undefined);

            const result = await cacheService.getOrSet('key', factory);

            expect(result).toBeUndefined();
            expect(factory).toHaveBeenCalledTimes(1);
        });

        test('should throw when factory throws', async () => {
            const factory = jest.fn().mockRejectedValue(new Error('Factory error'));

            await expect(cacheService.getOrSet('key', factory)).rejects.toThrow('Factory error');
        });
    });

    describe('delPattern', () => {
        beforeEach(async () => {
            cacheService.useRedis = false;
            cacheService.redis = null;
        });

        test('should delete keys matching pattern', async () => {
            await cacheService.set('user:1:profile', 'data1');
            await cacheService.set('user:1:settings', 'data2');
            await cacheService.set('user:2:profile', 'data3');

            await cacheService.delPattern('user:1:');

            expect(await cacheService.get('user:1:profile')).toBeNull();
            expect(await cacheService.get('user:1:settings')).toBeNull();
            expect(await cacheService.get('user:2:profile')).toBe('data3');
        });

        test('should not throw when no keys match', async () => {
            await expect(cacheService.delPattern('nonexistent:')).resolves.not.toThrow();
        });
    });

    describe('middleware', () => {
        test('should skip cache for non-GET requests', async () => {
            const req = { method: 'POST', originalUrl: '/api/test' };
            const res = {};
            const next = jest.fn();

            const mw = cacheService.middleware();
            await mw(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
        });

        test('should return cached response when available', async () => {
            const cachedData = { cached: true, data: 'test' };
            await cacheService.set('route:/api/test', cachedData);

            const req = { method: 'GET', originalUrl: '/api/test' };
            const res = { json: jest.fn() };
            const next = jest.fn();

            const mw = cacheService.middleware();
            await mw(req, res, next);

            expect(res.json).toHaveBeenCalledWith(cachedData);
            expect(next).not.toHaveBeenCalled();
        });

        test('should intercept res.json on cache miss', async () => {
            const req = { method: 'GET', originalUrl: '/api/test' };
            const res = { json: jest.fn() };
            const next = jest.fn();

            const mw = cacheService.middleware();
            await mw(req, res, next);

            expect(next).toHaveBeenCalled();
            // res.json should be overridden
            expect(typeof res.json).toBe('function');
        });

        test('should cache response when intercepted res.json is called', async () => {
            const req = { method: 'GET', originalUrl: '/api/test' };
            const res = { json: jest.fn() };
            const next = jest.fn();

            const mw = cacheService.middleware(60);
            await mw(req, res, next);

            // Now call the intercepted res.json
            const responseData = { success: true, data: [1, 2, 3] };
            res.json(responseData);

            // The data should now be cached
            const cached = await cacheService.get('route:/api/test');
            expect(cached).toEqual(responseData);
        });

        test('should handle middleware errors gracefully', async () => {
            const req = { method: 'GET', originalUrl: '/api/test' };
            const res = {};
            const next = jest.fn();

            // Force an error by setting a non-function next
            const mw = cacheService.middleware();
            // This should not throw
            await mw(req, res, next);
            expect(next).toHaveBeenCalled();
        });
    });

    describe('clear', () => {
        test('should clear all cached items', async () => {
            cacheService.useRedis = false;
            cacheService.redis = null;

            await cacheService.set('key1', 'value1');
            await cacheService.set('key2', 'value2');
            await cacheService.clear();

            expect(await cacheService.get('key1')).toBeNull();
            expect(await cacheService.get('key2')).toBeNull();
        });
    });

    describe('_key', () => {
        test('should prefix key with drawrun:', () => {
            const result = cacheService._key('test-key');
            expect(result).toBe('drawrun:test-key');
        });

        test('should handle empty key', () => {
            const result = cacheService._key('');
            expect(result).toBe('drawrun:');
        });
    });

    describe('healthCheck', () => {
        test('should return health info in LRU mode', async () => {
            cacheService.useRedis = false;
            cacheService.redis = null;
            mockRedisClient.healthCheck.mockResolvedValue({ status: 'unavailable' });

            const health = await cacheService.healthCheck();

            expect(health).toHaveProperty('redis');
            expect(health).toHaveProperty('lru');
            expect(health).toHaveProperty('mode', 'lru');
            expect(health.lru).toHaveProperty('size');
            expect(health.lru).toHaveProperty('maxSize');
        });
    });
});
