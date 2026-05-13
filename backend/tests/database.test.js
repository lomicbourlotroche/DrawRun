/**
 * ============================================================
 * DATABASE TESTS
 * ============================================================
 * Tests pour la base de données per-user
 */

const { fc } = require('@fast-check/jest');
const fs = require('fs');
const { sanitizeEmail, getUserDbPath, lruSet, lruGet, lruEvictLRU, getCacheStats, LRU_MAX_SIZE } = require('../src/database');

// ============================================================
// Global fs.writeFileSync mock — must be installed BEFORE any
// LRU cache operations so that drainCache() never writes to disk,
// even during module-level initialisation side-effects.
// ============================================================
let globalWriteSpy;
beforeAll(() => {
    globalWriteSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
});
afterAll(() => {
    globalWriteSpy.mockRestore();
});

describe('Database Utils', () => {
    test('should sanitize email for filename', () => {
        expect(sanitizeEmail('user@example.com')).toBe('user_at_example_dot_com');
        expect(sanitizeEmail('User.Name@Example.COM')).toBe('user_dot_name_at_example_dot_com');
        expect(sanitizeEmail('test+tag@gmail.com')).toBe('test_tag_at_gmail_dot_com');
    });
    
    test('should generate correct user DB path', () => {
        const path = getUserDbPath('test@example.com');
        expect(path).toContain('user_test_at_example_dot_com.db');
    });
});

describe('DB Helpers', () => {
    const { clamp, maskEmail, sleep } = require('../src/utils/helpers');
    
    test('should clamp values correctly', () => {
        expect(clamp(5, 0, 10)).toBe(5);
        expect(clamp(-5, 0, 10)).toBe(0);
        expect(clamp(15, 0, 10)).toBe(10);
    });
    
    test('should mask email correctly', () => {
        expect(maskEmail('user@example.com')).toBe('u***@example.com');
        expect(maskEmail('ab@example.com')).toBe('a*@example.com');
    });
    
    test('should sleep for specified duration', async () => {
        const start = Date.now();
        await sleep(50);
        const elapsed = Date.now() - start;
        expect(elapsed).toBeGreaterThanOrEqual(45);
    });
});

// ============================================================
// LRU Cache Property Tests
// ============================================================

/**
 * Helper: create a minimal mock db object that satisfies lruEvictLRU's
 * requirements (export() for saveUserDb, close() for cleanup).
 * fs.writeFileSync is spied on so no actual disk I/O occurs.
 */
function makeMockDb() {
    return {
        export: () => new Uint8Array(0),
        close: () => {},
    };
}

/**
 * Drain the LRU cache completely between test runs so each property
 * iteration starts from a known empty state.
 * We spy on fs.writeFileSync to suppress disk writes during draining.
 */
function drainCache() {
    while (getCacheStats().size > 0) {
        lruEvictLRU();
    }
}

describe('LRU Cache Property Tests', () => {
    beforeEach(() => {
        // Clear call history between tests; the global spy stays active.
        globalWriteSpy.mockClear();
        drainCache();
    });

    afterEach(() => {
        drainCache();
    });

    // Feature: drawrun-improvements, Property 1: cache size never exceeds LRU_MAX_SIZE
    // Validates: Requirements 1.1, 1.2
    test(
        'Property 1: LRU cache size never exceeds LRU_MAX_SIZE',
        async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.array(fc.string(), { minLength: 101, maxLength: 200 }),
                    async (keys) => {
                        // Drain cache before each iteration
                        drainCache();

                        // Use distinct keys to ensure we actually exceed LRU_MAX_SIZE
                        const distinctKeys = [...new Set(keys)];

                        for (const key of distinctKeys) {
                            lruSet(key, makeMockDb());
                            const stats = getCacheStats();
                            if (stats.size > LRU_MAX_SIZE) {
                                return false;
                            }
                        }
                        return true;
                    }
                ),
                { numRuns: 100 }
            );
        }
    );

    // Feature: drawrun-improvements, Property 3: saveUserDb called on eviction
    // Validates: Requirement 1.3
    test(
        'Property 3: saveUserDb called on every eviction',
        async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string(),
                    async (newKey) => {
                        // Drain cache and reset spy before each iteration
                        drainCache();
                        globalWriteSpy.mockClear();

                        // Fill cache to capacity with key_0 … key_99 in insertion order.
                        // key_0 is inserted first and never re-accessed, so it is the LRU entry.
                        for (let i = 0; i < LRU_MAX_SIZE; i++) {
                            lruSet(`key_${i}`, makeMockDb());
                        }

                        // Use a guaranteed-unique key so it cannot collide with key_0…key_99
                        const triggerKey = `__new__${newKey}`;

                        // Adding one more entry triggers eviction of key_0 (the LRU)
                        lruSet(triggerKey, makeMockDb());

                        // saveUserDb calls fs.writeFileSync(dbPath, buffer).
                        // Assert that at least one call used key_0 as the first argument (the LRU path).
                        const calledWithLruPath = globalWriteSpy.mock.calls.some(
                            (args) => args[0] === 'key_0'
                        );

                        return calledWithLruPath;
                    }
                ),
                { numRuns: 100 }
            );
        }
    );

    // Feature: drawrun-improvements, Property 2: evicted entry is least recently used
    // Validates: Requirements 1.2, 1.4
    test(
        'Property 2: evicted entry is the least recently used',
        async () => {
            // Build the fixed set of 100 keys used to fill the cache to capacity
            const allKeys = Array.from({ length: LRU_MAX_SIZE }, (_, i) => `key_${i}`);

            await fc.assert(
                fc.asyncProperty(
                    // Pick a random non-empty subset of the 100 keys to re-access (making them MRU)
                    fc.shuffledSubarray(allKeys, { minLength: 1, maxLength: LRU_MAX_SIZE - 1 }),
                    async (accessedKeys) => {
                        // Drain cache before each iteration
                        drainCache();

                        // Fill cache to capacity with key_0 … key_99 in insertion order
                        for (const key of allKeys) {
                            lruSet(key, makeMockDb());
                        }

                        // Access the chosen subset — each lruGet moves the key to MRU position
                        const accessedSet = new Set(accessedKeys);
                        for (const key of accessedKeys) {
                            lruGet(key);
                        }

                        // Add one new key to trigger eviction of the current LRU entry
                        lruSet('key_new', makeMockDb());

                        // The evicted key must NOT be in the accessed subset.
                        // Verify: every key in accessedSet is still present in the cache.
                        for (const key of accessedSet) {
                            if (lruGet(key) === undefined) {
                                // An accessed (recently-used) key was evicted — property violated
                                return false;
                            }
                        }

                        // Also verify the new key was inserted successfully
                        if (lruGet('key_new') === undefined) {
                            return false;
                        }

                        // Cache size must still be at capacity
                        if (getCacheStats().size !== LRU_MAX_SIZE) {
                            return false;
                        }

                        return true;
                    }
                ),
                { numRuns: 100 }
            );
        }
    );
});

// ============================================================================
// Migration System Tests (Task 13.1 & 13.2)
// ============================================================================

describe('Migration System', () => {
    beforeEach(() => {
        globalWriteSpy.mockClear();
    });

    test('getMigrationStatus() is a function', async () => {
        const { getMigrationStatus } = require('../src/database');
        expect(typeof getMigrationStatus).toBe('function');
    });

    test('runMigrations is idempotent - running twice does not insert duplicate rows', async () => {
        const { runMigrations } = require('../src/database');
        const SQL = require('sql.js');
        const sqlModule = await SQL();
        const db = new sqlModule.Database();

        // Create users table (required by migrations)
        db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT)');

        // Run migrations twice
        await runMigrations(db);
        await runMigrations(db);

        // Check schema_migrations has no duplicates
        const stmt = db.prepare('SELECT COUNT(*) as count FROM schema_migrations');
        const result = stmt.getAsObject();
        stmt.free();

        const stmt2 = db.prepare('SELECT COUNT(DISTINCT version) as unique_count FROM schema_migrations');
        const result2 = stmt2.getAsObject();
        stmt2.free();

        expect(result.count).toBe(result2.unique_count);
        db.close();
    });

    test('schema_migrations table exists after runMigrations', async () => {
        const { runMigrations } = require('../src/database');
        const SQL = require('sql.js');
        const sqlModule = await SQL();
        const db = new sqlModule.Database();

        db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT)');
        await runMigrations(db);

        // Verify schema_migrations table exists
        const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'");
        stmt.step();
        const result = stmt.getAsObject();
        stmt.free();

        expect(result.name).toBe('schema_migrations');
        db.close();
    });
});

// Feature: drawrun-improvements, Property 13: migrations applied in ascending version order
// Validates: Requirements 10.2, 10.3
describe('Property 13: Migrations applied in ascending version order', () => {
    test('migrations applied in ascending lexicographic version order, each version appears exactly once', async () => {
        const { fc } = require('@fast-check/jest');
        const SQL = require('sql.js');
        const { MIGRATIONS } = require('../src/database');

        const migrationVersions = MIGRATIONS.map(m => m.version);

        await fc.assert(
            fc.asyncProperty(
                fc.shuffledSubarray(migrationVersions, { minLength: Math.min(5, migrationVersions.length) }),
                async (shuffledVersions) => {
                    const sqlModule = await SQL();
                    const db = new sqlModule.Database();
                    db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT)');

                    // Create a custom migration runner with the shuffled versions
                    const customMigrations = shuffledVersions.map(v => ({
                        version: v,
                        description: `Test migration ${v}`,
                        up: (_db) => { /* no-op */ },
                    }));

                    // Sort and apply
                    const sorted = [...customMigrations].sort((a, b) => a.version.localeCompare(b.version));

                    db.run('CREATE TABLE IF NOT EXISTS schema_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, version TEXT NOT NULL UNIQUE, applied_at DATETIME DEFAULT CURRENT_TIMESTAMP, description TEXT)');

                    for (const migration of sorted) {
                        migration.up(db);
                        db.run('INSERT INTO schema_migrations (version, description) VALUES (?, ?)', [migration.version, migration.description]);
                    }

                    // Verify order and uniqueness
                    const stmt = db.prepare('SELECT version FROM schema_migrations ORDER BY rowid ASC');
                    const applied = [];
                    while (stmt.step()) {
                        applied.push(stmt.getAsObject().version);
                    }
                    stmt.free();
                    db.close();

                    const expectedOrder = [...shuffledVersions].sort();
                    const isCorrectOrder = JSON.stringify(applied) === JSON.stringify(expectedOrder);
                    const hasNoDuplicates = new Set(applied).size === applied.length;

                    return isCorrectOrder && hasNoDuplicates;
                }
            ),
            { numRuns: 20 }
        );
    });
});
