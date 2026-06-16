/* eslint-disable unused-imports/no-unused-vars */
'use strict';

/**
 * ============================================================
 * PERFORMANCE MIDDLEWARE TESTS
 * ============================================================
 * Tests for LRUCache, cacheKey, cached decorator, withCache, cacheRoute
 */

const { LRUCache, cacheKey, caches, performanceMetrics } = require('../../src/middleware/performance');

describe('LRUCache', () => {
    let cache;

    beforeEach(() => {
        cache = new LRUCache(5, 1000); // max 5 items, 1s TTL
    });

    // Happy path
    test('should store and retrieve a value', () => {
        cache.set('key1', 'value1');
        expect(cache.get('key1')).toBe('value1');
    });

    test('should store and retrieve numeric values', () => {
        cache.set('count', 42);
        expect(cache.get('count')).toBe(42);
    });

    test('should store and retrieve object values', () => {
        const obj = { id: 1, name: 'test' };
        cache.set('obj', obj);
        expect(cache.get('obj')).toEqual(obj);
    });

    test('should store and retrieve array values', () => {
        const arr = [1, 2, 3];
        cache.set('arr', arr);
        expect(cache.get('arr')).toEqual(arr);
    });

    // TTL / expiry
    test('should return null for expired items', async () => {
        cache = new LRUCache(5, 50); // 50ms TTL
        cache.set('key1', 'value1');
        await new Promise(resolve => setTimeout(resolve, 60));
        expect(cache.get('key1')).toBeNull();
    });

    test('should return value before TTL expiry', async () => {
        cache = new LRUCache(5, 1000);
        cache.set('key1', 'value1');
        await new Promise(resolve => setTimeout(resolve, 50));
        expect(cache.get('key1')).toBe('value1');
    });

    // Eviction
    test('should evict oldest item when at capacity', () => {
        for (let i = 1; i <= 6; i++) {
            cache.set(`key${i}`, `value${i}`);
        }
        // key1 should be evicted, key6 should exist
        expect(cache.get('key1')).toBeNull();
        expect(cache.get('key6')).toBe('value6');
    });

    test('should evict least recently used item', () => {
        for (let i = 1; i <= 5; i++) {
            cache.set(`key${i}`, `value${i}`);
        }
        // Access key1 to make it most recently used
        cache.get('key1');
        // Add more items to trigger eviction
        cache.set('key6', 'value6');
        // key2 should be evicted (LRU), key1 should remain (recently used)
        expect(cache.get('key1')).toBe('value1');
        expect(cache.get('key2')).toBeNull();
    });

    test('should update existing key without eviction', () => {
        cache.set('key1', 'value1');
        cache.set('key2', 'value2');
        cache.set('key1', 'updated');
        // Cache should still have 2 items
        expect(cache.get('key1')).toBe('updated');
        expect(cache.get('key2')).toBe('value2');
    });

    // has()
    test('should return true for existing key', () => {
        cache.set('key1', 'value1');
        expect(cache.has('key1')).toBe(true);
    });

    test('should return false for non-existent key', () => {
        expect(cache.has('nonexistent')).toBe(false);
    });

    test('should return false for expired key', async () => {
        cache = new LRUCache(5, 50);
        cache.set('key1', 'value1');
        await new Promise(resolve => setTimeout(resolve, 60));
        expect(cache.has('key1')).toBe(false);
    });

    // del()
    test('should delete a key', () => {
        cache.set('key1', 'value1');
        cache.del('key1');
        expect(cache.get('key1')).toBeNull();
    });

    test('should not throw when deleting non-existent key', () => {
        expect(() => cache.del('nonexistent')).not.toThrow();
    });

    // clear()
    test('should clear all items', () => {
        cache.set('key1', 'value1');
        cache.set('key2', 'value2');
        cache.clear();
        expect(cache.get('key1')).toBeNull();
        expect(cache.get('key2')).toBeNull();
    });

    // size()
    test('should return correct size', () => {
        expect(cache.size()).toBe(0);
        cache.set('key1', 'value1');
        expect(cache.size()).toBe(1);
        cache.set('key2', 'value2');
        expect(cache.size()).toBe(2);
        cache.del('key1');
        expect(cache.size()).toBe(1);
    });

    // Edge cases
    test('should handle null key', () => {
        cache.set(null, 'value1');
        expect(cache.get(null)).toBe('value1');
    });

    test('should handle undefined value', () => {
        cache.set('key1', undefined);
        expect(cache.get('key1')).toBeUndefined();
    });

    test('should handle boolean values', () => {
        cache.set('flag', true);
        expect(cache.get('flag')).toBe(true);
    });

    test('should handle custom TTL per item', async () => {
        cache.set('short', 'dies-fast', 100);
        cache.set('long', 'lives-long', 1000);
        await new Promise(resolve => setTimeout(resolve, 200));
        expect(cache.get('short')).toBeNull();
        expect(cache.get('long')).toBe('lives-long');
    });

    test('should not exceed maxSize', () => {
        for (let i = 0; i < 100; i++) {
            cache.set(`key${i}`, `value${i}`);
        }
        expect(cache.size()).toBeLessThanOrEqual(5);
    });
});

describe('cacheKey', () => {
    test('should return deterministic key for same args', () => {
        const key1 = cacheKey('prefix', 1, 'arg');
        const key2 = cacheKey('prefix', 1, 'arg');
        expect(key1).toBe(key2);
    });

    test('should return different key for different args', () => {
        const key1 = cacheKey('prefix', 1);
        const key2 = cacheKey('prefix', 2);
        expect(key1).not.toBe(key2);
    });

    test('should include prefix in key', () => {
        const key = cacheKey('myPrefix', 'arg1');
        expect(key).toContain('myPrefix:');
    });

    test('should handle object args', () => {
        const key = cacheKey('test', { a: 1, b: 2 });
        expect(key).toBeDefined();
        expect(typeof key).toBe('string');
    });

    test('should handle array args', () => {
        const key = cacheKey('test', [1, 2, 3]);
        expect(key).toBeDefined();
    });

    test('should handle no additional args', () => {
        const key = cacheKey('alone');
        // MD5 of empty string is d41d8cd9 (first 8 chars)
        expect(key).toBe('alone:d41d8cd9');
    });
});

describe('performanceMetrics', () => {
    beforeEach(() => {
        performanceMetrics.reset();
    });

    test('should start with zero requests', () => {
        expect(performanceMetrics.requests).toBe(0);
    });

    test('should have hitRate method', () => {
        expect(typeof performanceMetrics.hitRate).toBe('function');
    });

    test('should return N/A when no data', () => {
        expect(performanceMetrics.hitRate()).toBe('N/A');
    });

    test('should calculate hit rate correctly', () => {
        performanceMetrics.cacheHits = 80;
        performanceMetrics.cacheMisses = 20;
        expect(performanceMetrics.hitRate()).toBe('80.0%');
    });

    test('should return 100% when no misses', () => {
        performanceMetrics.cacheHits = 10;
        performanceMetrics.cacheMisses = 0;
        expect(performanceMetrics.hitRate()).toBe('100.0%');
    });

    test('should return 0% when no hits', () => {
        performanceMetrics.cacheHits = 0;
        performanceMetrics.cacheMisses = 10;
        expect(performanceMetrics.hitRate()).toBe('0.0%');
    });

    test('should reset all metrics', () => {
        performanceMetrics.requests = 100;
        performanceMetrics.cacheHits = 50;
        performanceMetrics.cacheMisses = 50;
        performanceMetrics.reset();
        expect(performanceMetrics.requests).toBe(0);
        expect(performanceMetrics.cacheHits).toBe(0);
        expect(performanceMetrics.cacheMisses).toBe(0);
    });

    test('should include cache sizes in JSON output', () => {
        const json = performanceMetrics.toJSON();
        expect(json).toHaveProperty('cacheSizes');
        expect(json.cacheSizes).toHaveProperty('pmc');
        expect(json.cacheSizes).toHaveProperty('zones');
        expect(json.cacheSizes).toHaveProperty('profiles');
    });
});
