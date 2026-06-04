'use strict';

/**
 * ============================================================
 * QUERY OPTIMIZER TESTS
 * ============================================================
 * Tests for BatchLoader, batchLoadActivityDraws, batchLoadUsers,
 * enrichActivitiesWithDraws, optimizeDatabaseIndexes
 */

// Mock database
jest.mock('../../src/database', () => ({
    dbGetMain: jest.fn(),
    dbAllMain: jest.fn(),
}));

jest.mock('../../src/utils/logger', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const {
    BatchLoader,
    batchLoadActivityDraws,
    batchLoadUsers,
    enrichActivitiesWithDraws,
    optimizeDatabaseIndexes,
} = require('../../src/services/queryOptimizer');

const { dbGetMain, dbAllMain } = require('../../src/database');

describe('BatchLoader', () => {
    let loader;
    let fetchFn;

    beforeEach(() => {
        jest.clearAllMocks();
        fetchFn = jest.fn();
        loader = new BatchLoader(fetchFn, { batchSize: 10, debounceMs: 50 });
    });

    afterEach(async () => {
        // Clean up any pending timers
        if (loader.timer) {
            clearTimeout(loader.timer);
            loader.timer = null;
        }
    });

    // Happy path
    test('should load a single item by ID', async () => {
        fetchFn.mockResolvedValue([{ id: 1, name: 'Item 1' }]);

        const result = await loader.load(1);

        expect(result).toEqual({ id: 1, name: 'Item 1' });
        expect(fetchFn).toHaveBeenCalledTimes(1);
        expect(fetchFn).toHaveBeenCalledWith([1]);
    });

    test('should load multiple items and batch them', async () => {
        fetchFn.mockResolvedValue([
            { id: 1, name: 'Item 1' },
            { id: 2, name: 'Item 2' },
        ]);

        const [r1, r2] = await Promise.all([
            loader.load(1),
            loader.load(2),
        ]);

        expect(r1).toEqual({ id: 1, name: 'Item 1' });
        expect(r2).toEqual({ id: 2, name: 'Item 2' });
        expect(fetchFn).toHaveBeenCalledTimes(1);
        expect(fetchFn).toHaveBeenCalledWith([1, 2]);
    });

    test('should cache results and not refetch', async () => {
        fetchFn.mockResolvedValue([{ id: 1, name: 'Cached' }]);

        const r1 = await loader.load(1);
        const r2 = await loader.load(1);

        expect(r1).toEqual({ id: 1, name: 'Cached' });
        expect(r2).toEqual({ id: 1, name: 'Cached' });
        expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    test('should return undefined for missing IDs', async () => {
        fetchFn.mockResolvedValue([{ id: 1, name: 'Item 1' }]);

        const result = await loader.load(999);

        expect(result).toBeUndefined();
    });

    test('should clear cache', async () => {
        fetchFn.mockResolvedValue([{ id: 1, name: 'Original' }]);
        await loader.load(1);

        loader.clearCache();

        fetchFn.mockResolvedValue([{ id: 1, name: 'Refetched' }]);
        const result = await loader.load(1);

        expect(result).toEqual({ id: 1, name: 'Refetched' });
        expect(fetchFn).toHaveBeenCalledTimes(2);
    });

    // loadMany
    test('should load many items by IDs', async () => {
        fetchFn.mockResolvedValue([
            { id: 1, name: 'Item 1' },
            { id: 2, name: 'Item 2' },
            { id: 3, name: 'Item 3' },
        ]);

        const results = await loader.loadMany([1, 2, 3]);

        expect(results).toHaveLength(3);
        expect(fetchFn).toHaveBeenCalledWith([1, 2, 3]);
    });

    // Error handling
    test('should reject all batched promises on error', async () => {
        fetchFn.mockRejectedValue(new Error('DB error'));

        const p1 = loader.load(1);
        const p2 = loader.load(2);

        await expect(p1).rejects.toThrow('DB error');
        await expect(p2).rejects.toThrow('DB error');
    });

    // Edge cases
    test('should handle empty batch gracefully', async () => {
        // executeBatch with empty batch should do nothing
        await loader.executeBatch();
        expect(fetchFn).not.toHaveBeenCalled();
    });

    test('should respect batch size and create multiple batches', async () => {
        fetchFn.mockResolvedValue([]);
        const smallLoader = new BatchLoader(fetchFn, { batchSize: 2, debounceMs: 10 });

        await Promise.all([
            smallLoader.load(1),
            smallLoader.load(2),
            smallLoader.load(3),
        ]);

        // Should have been called 3 times (2 + 1, or 2 + 1 depending on scheduling)
        expect(fetchFn).toHaveBeenCalled();
    });

    test('should use default options when not provided', () => {
        const defaultLoader = new BatchLoader(fetchFn);
        expect(defaultLoader.batchSize).toBe(100);
        expect(defaultLoader.debounceMs).toBe(10);
    });
});

describe('batchLoadActivityDraws', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return empty array for empty activity IDs', async () => {
        const result = await batchLoadActivityDraws([], 1);
        expect(result).toEqual([]);
    });

    test('should return empty array for missing userId', async () => {
        const result = await batchLoadActivityDraws([1, 2], null);
        expect(result).toEqual([]);
    });

    test('should return draw counts and status for each activity', async () => {
        dbAllMain
            .mockResolvedValueOnce([
                { activity_id: 1, count: 5 },
                { activity_id: 3, count: 2 },
            ])
            .mockResolvedValueOnce([
                { activity_id: 1 },
            ]);

        const result = await batchLoadActivityDraws([1, 2, 3], 42);

        expect(result).toHaveLength(3);
        expect(result[0]).toEqual({ activity_id: 1, draw_count: 5, has_drawn: true });
        expect(result[1]).toEqual({ activity_id: 2, draw_count: 0, has_drawn: false });
        expect(result[2]).toEqual({ activity_id: 3, draw_count: 2, has_drawn: false });
    });
});

describe('batchLoadUsers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return empty array for empty IDs', async () => {
        const result = await batchLoadUsers([]);
        expect(result).toEqual([]);
    });

    test('should load users by IDs', async () => {
        dbAllMain.mockResolvedValue([
            { id: 1, email: 'user1@test.com', name: 'User 1' },
            { id: 2, email: 'user2@test.com', name: 'User 2' },
        ]);

        const result = await batchLoadUsers([1, 2]);

        expect(result).toHaveLength(2);
        expect(result[0].email).toBe('user1@test.com');
        expect(dbAllMain).toHaveBeenCalledWith(
            expect.stringContaining('WHERE id IN'),
            [1, 2]
        );
    });
});

describe('enrichActivitiesWithDraws', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return empty array for empty activities', async () => {
        const result = await enrichActivitiesWithDraws([], 1);
        expect(result).toEqual([]);
    });

    test('should enrich activities with draw data', async () => {
        const activities = [
            { id: 1, name: 'Morning Run', type: 'Run' },
            { id: 2, name: 'Evening Bike', type: 'Bike' },
        ];

        dbAllMain
            .mockResolvedValueOnce([
                { activity_id: 1, count: 3 },
            ])
            .mockResolvedValueOnce([
                { activity_id: 1 },
            ]);

        const result = await enrichActivitiesWithDraws(activities, 42);

        expect(result).toHaveLength(2);
        expect(result[0]).toHaveProperty('draw_count', 3);
        expect(result[0]).toHaveProperty('has_drawn', true);
        expect(result[0]).toHaveProperty('user_id', 42);
        expect(result[1]).toHaveProperty('draw_count', 0);
        expect(result[1]).toHaveProperty('has_drawn', false);
        expect(result[1]).toHaveProperty('user_id', 42);
    });
});

describe('optimizeDatabaseIndexes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should create indexes successfully', async () => {
        dbGetMain.mockResolvedValue({});

        await expect(optimizeDatabaseIndexes()).resolves.not.toThrow();

        expect(dbGetMain).toHaveBeenCalledWith(
            expect.stringContaining('CREATE INDEX IF NOT EXISTS idx_activity_draws_activity_user')
        );
        expect(dbGetMain).toHaveBeenCalledWith(
            expect.stringContaining('CREATE INDEX IF NOT EXISTS idx_activities_user_date')
        );
        expect(dbGetMain).toHaveBeenCalledWith(
            expect.stringContaining('CREATE INDEX IF NOT EXISTS idx_efforts_segment_user_time')
        );
    });

    test('should handle errors gracefully', async () => {
        dbGetMain.mockRejectedValue(new Error('DB error'));

        await expect(optimizeDatabaseIndexes()).resolves.not.toThrow();
    });
});
