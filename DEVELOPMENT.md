# DEVELOPMENT.md — DrawRun Development Guide

> **Version:** 4.1.0 | **Last Updated:** June 2026

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Initial Setup](#2-initial-setup)
3. [Development Workflow](#3-development-workflow)
4. [Environment Configuration](#4-environment-configuration)
5. [Running the Project](#5-running-the-project)
6. [Testing](#6-testing)
7. [Database Management](#7-database-management)
8. [Adding a New Migration](#8-adding-a-new-migration)
9. [Adding a New API Route](#9-adding-a-new-api-route)
10. [Working with Sync Providers](#10-working-with-sync-providers)
11. [Coding Standards](#11-coding-standards)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | >= 18.0.0 | Runtime |
| npm | >= 8.0.0 | Package manager |
| Git | Any | Version control |
| Python 3 | >= 3.12 | Garmin sync (optional) |
| Playwright | Latest | E2E tests + Strava sync |

### Verify installation

```bash
node --version  # Must be 18+
npm --version   # Must be 8+
git --version
```

---

## 2. Initial Setup

### 2.1 Clone and install

```bash
git clone https://github.com/lomicbourlotroche/DrawRun.git
cd DrawRun-New

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to project root
cd ..
```

### 2.2 Configure environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your values

# Frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:3000" > frontend/.env.local
```

### 2.3 Generate secrets (if needed)

```bash
openssl rand -base64 64  # For JWT_SECRET
openssl rand -base64 32  # For CREDENTIALS_SECRET
```

### 2.4 Install Playwright browsers (for tests)

```bash
cd backend
npm run test:e2e:install    # Installs Chromium for Playwright
```

---

## 3. Development Workflow

### 3.1 Standard workflow

```bash
# 1. Pull latest changes
git pull origin main

# 2. Install new dependencies (if any)
cd backend && npm install && cd ../frontend && npm install && cd ..

# 3. Start development servers
# Terminal 1 - Backend (runs tests first, then starts on port 3000)
cd backend && npm run dev

# Terminal 2 - Frontend (starts on port 3001)
cd frontend && npm run dev

# 4. Make changes, run tests, commit
cd backend && npm test          # 210/210 must pass
cd frontend && npm run test     # 421 tests
git add . && git commit -m "description"
git push origin main
```

### 3.2 Branch strategy

```
main          → Production-ready code (deployed to VPS)
feature/*     → New features (merge to main via PR)
fix/*         → Bug fixes (merge to main via PR)
```

### 3.3 Commit conventions

```
type(scope): description

Types: feat, fix, chore, refactor, test, docs, style, perf, security
Scopes: backend, frontend, api, algo, db, auth, coach, social, sync, deploy

Examples:
  feat(coach): add session feedback adaptation logic
  fix(api): handle null refresh token in auth middleware
  security(db): add OTP lockout columns and rate limiting
  chore(deps): update express to 5.2.1
  test(algo): add property-based test for VDOT calculation
```

---

## 4. Environment Configuration

### 4.1 Backend (`backend/.env`)

```env
# Server
PORT=3000
NODE_ENV=development              # development | production | test

# Database
DATA_DIR=../../DrawRun-Data       # Path relative to backend/

# Security (REQUIRED)
JWT_SECRET=your_jwt_secret_here   # openssl rand -base64 64
CREDENTIALS_SECRET=your_cred_secret  # openssl rand -base64 32
BCRYPT_ROUNDS=12

# CORS
CORS_ORIGINS=http://localhost:3001

# Rate Limiting
API_RATE_LIMIT=100
AUTH_RATE_LIMIT=5

# Strava OAuth2 (optional)
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_CALLBACK_URL=http://localhost:3001/auth/strava/callback

# Email (SMTP, optional for forgot password)
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@drawrun.fr

# Logging
LOG_LEVEL=info                    # debug | info | warn | error
LOG_DIR=./logs

# Redis (optional, falls back to in-memory)
# REDIS_URL=redis://localhost:6379

# 2FA
TOTP_ISSUER=DrawRun

# Playwright (for Strava sync)
# PLAYWRIGHT_BROWSERS_PATH=/path/to/browsers

# Push Notifications (VAPID keys)
# VAPID_PUBLIC_KEY=
# VAPID_PRIVATE_KEY=
```

### 4.2 Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

For production, set to your domain:
```env
NEXT_PUBLIC_API_URL=https://drawrun.fr
```

---

## 5. Running the Project

### 5.1 Development mode

```bash
# Option A: Run both together
npm run dev                       # From project root (uses concurrently)

# Option B: Run separately (recommended for debugging)
# Terminal 1:
cd backend && npm run dev         # Port 3000 (runs tests first)

# Terminal 2:
cd frontend && npm run dev        # Port 3001
```

In development mode, the backend runs Jest tests before starting. If any test fails, the server will not start.

### 5.2 Production mode

```bash
# Backend
cd backend
npm start                         # Skips startup tests (NODE_ENV=production)

# Frontend
cd frontend
npm run build
npm start
```

### 5.3 Docker

```bash
# Start all services (backend, frontend, redis)
docker-compose up -d

# Start with production profile (adds nginx)
docker-compose --profile production up -d

# Start with monitoring (adds Prometheus + Grafana)
docker-compose --profile monitoring up -d

# View logs
docker-compose logs -f backend

# Stop
docker-compose down
```

---

## 6. Testing

### 6.1 Backend tests (Jest)

```bash
cd backend

# Run all tests (210 tests, 13 suites)
npm test

# Run specific test file
npm test -- --testPathPattern=auth      # Only auth tests
npm test -- --testPathPattern=database  # Only database tests

# Watch mode (re-runs on file changes)
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests (Playwright)
npm run test:e2e                    # Headless
npm run test:e2e:ui                 # With UI mode
npm run test:e2e:debug              # Debug mode

# Run a single test
npm test -- --testPathPattern=algorithms -t "VDOT"
```

### 6.2 Frontend tests (Vitest)

```bash
cd frontend

# Run all unit tests (421 tests, 27 files)
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# UI mode (interactive test runner)
npm run test:ui

# E2E tests (Playwright)
npm run test:e2e

# Run all tests (unit + e2e)
npm run test:all
```

### 6.3 Linting and formatting

```bash
# Backend
cd backend
npm run lint                       # ESLint check
npm run lint:fix                   # Auto-fix
npm run format                     # Prettier format
npm run format:check               # Prettier check-only

# Frontend
cd frontend
npm run lint
npm run format

# Both from root
npm run lint
npm run format
```

### 6.4 Writing tests

**Backend property-based tests using fast-check:**

```javascript
// Example: LRU size invariant
test('LRU size never exceeds LRU_MAX_SIZE', () => {
  fc.assert(
    fc.property(fc.array(fc.string()), (paths) => {
      const cache = new Map();
      for (const p of paths) {
        if (cache.size >= LRU_MAX_SIZE) cache.delete(cache.keys().next().value);
        cache.set(p, {});
      }
      expect(cache.size).toBeLessThanOrEqual(LRU_MAX_SIZE);
    })
  );
});
```

**Frontend component tests using Testing Library:**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/Button';

test('calls onClick handler', async () => {
  const handleClick = vi.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  await userEvent.click(screen.getByRole('button'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

---

## 7. Database Management

### 7.1 Database files

All databases live in `DrawRun-Data/` (gitignored):

```
DrawRun-Data/
├── main.db              # Shared data (users, tokens, migrations)
├── user_alice@test.com.db
└── user_bob@test.com.db
```

### 7.2 Database access patterns

```javascript
const { dbGetMain, dbRunMain, dbAllMain } = require('./src/database');
const { getUserDb, dbGetUser, dbRunUser, dbAllUser } = require('./src/database');

// Main database
const user = await dbGetMain('SELECT * FROM users WHERE id = ?', [userId]);
await dbRunMain('UPDATE users SET name = ? WHERE id = ?', [name, userId]);

// User database
const userDb = await getUserDb(userId);
const activities = await dbAllUser(userDb,
  'SELECT * FROM activities WHERE type = ? ORDER BY start_date DESC LIMIT 10',
  ['Run']
);
await dbRunUser(userDb,
  'INSERT INTO activities (user_id, type, name, distance, start_date) VALUES (?, ?, ?, ?, ?)',
  [userId, 'Run', 'Morning Run', 10000, '2026-06-04']
);
```

### 7.3 Backup and restore

```bash
# Manual backup
cd backend
npm run backup              # Backs up all databases to backup/ directory

# Manual restore
npm run restore             # Restores from latest backup

# Shell backup
cp -r DrawRun-Data DrawRun-Data-backup-$(date +%Y%m%d)
```

### 7.4 Direct database inspection

```bash
# Install sqlite3 CLI
# Open main database
sqlite3 DrawRun-Data/main.db
.tables
SELECT * FROM users;

# Open user database
sqlite3 "DrawRun-Data/user_alice@test.com.db"
.tables
SELECT COUNT(*) FROM activities;
```

---

## 8. Adding a New Migration

### Step 1: Add to MIGRATIONS array

File: `backend/src/database/migrations.js`

```javascript
const MIGRATIONS = [
  // ... existing migrations ...
  {
    version: '027_add_new_feature_table',  // Must be lexicographically after last
    description: 'Add new feature table',
    up: (db) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS new_table (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      db.run('CREATE INDEX IF NOT EXISTS idx_new_table_user ON new_table(user_id)');
    },
  },
];
```

### Step 2: Run migration

Migrations run automatically at server startup. To test:

```bash
# Start server - migrations will run
cd backend && npm run dev

# Or test directly with:
node -e "const m = require('./src/database/migrations'); m.runMigrations(...).then(() => console.log('done'))"
```

### Migration rules

1. Version strings must be **lexicographically ordered** (property-test verified)
2. Use `try { ... } catch (_) { }` for ALTER TABLE operations that may fail
3. Always use `CREATE TABLE IF NOT EXISTS` for new tables
4. Indexes should have `IF NOT EXISTS`
5. Migrations are tracked in `schema_migrations` table in `main.db`

---

## 9. Adding a New API Route

### Step 1: Create route file

File: `backend/src/routes/my-feature.js`

```javascript
'use strict';
const express = require('express');
const router = express.Router();

/**
 * GET /api/my-feature
 * Description of the endpoint
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;  // Set by verifyToken middleware
    const data = { message: 'Hello from my feature' };
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/my-feature
 * Create new resource
 */
router.post('/', async (req, res) => {
  try {
    const { name, value } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    
    // Save to database...
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

### Step 2: Register in index.js

File: `backend/index.js`

```javascript
// At top, with other route imports:
const myFeatureRoutes = require('./src/routes/my-feature');

// With other route registrations:
app.use('/api/my-feature', verifyToken, userBasedLimiter, cacheMiddleware(300), myFeatureRoutes);
```

### Step 3: Add frontend API module

File: `frontend/src/lib/api/my-feature.api.ts`

```typescript
import { client } from './client';
import type { ApiResponse } from './types';

export const myFeatureApi = {
  list: () => client.get<MyFeature[]>('/api/my-feature'),
  create: (data: CreateMyFeatureInput) => client.post<ApiResponse>('/api/my-feature', data),
};
```

### Step 4: Export from barrel

File: `frontend/src/lib/api/index.ts`

```typescript
export { myFeatureApi } from './my-feature.api';
```

### Step 5: Add tests

- Backend: `backend/tests/routes/my-feature.test.js`
- Frontend: `frontend/tests/lib/my-feature.test.ts`

---

## 10. Working with Sync Providers

### 10.1 Local development with sync providers

Sync providers (Garmin, Strava, Suunto, Decathlon) require external credentials and services. In development, you can:

1. **Mock the sync provider** for testing route handlers
2. **Use test credentials** for real sync testing
3. **Create manual activities** via `POST /api/activities/create` to avoid sync

### 10.2 Adding a new sync provider

1. Create file in `backend/src/services/sync/`
2. Implement the provider interface (fetch activities, parse data)
3. Add route in `backend/src/routes/sync.js`
4. Add credentials endpoint in `backend/src/routes/auth.js`
5. Store encrypted credentials using `crypto.js`
6. Add sync queue integration in `migrations.js`

### 10.3 Strava sync (Playwright)

Requires Playwright with Chromium installed:

```bash
cd backend
npx playwright install chromium
```

Environment variables:
```env
PLAYWRIGHT_BROWSERS_PATH=/path/to/chromium
```

### 10.4 Garmin sync (Python bridge)

Requires Python 3 with pip packages:

```bash
pip3 install garminconnect garth requests
```

---

## 11. Coding Standards

### 11.1 Backend (JavaScript)

```javascript
'use strict';

const { logger } = require('../utils/logger');

async function getData(userId) {
  try {
    const result = await dbGetMain('SELECT * FROM users WHERE id = ?', [userId]);
    logger.info('User fetched', { userId });
    return result;
  } catch (err) {
    logger.error('Failed to fetch user', { error: err.message });
    throw err;
  }
}
```

**Rules:**
- `'use strict'` at top of every file
- Async/await everywhere (no raw Promise chains)
- Parameterized SQL queries (never string concatenation)
- Winston logger (never `console.log`)
- Error responses: `res.status(4xx).json({ error: 'message' })`
- Use `const` and `let` (never `var`)

### 11.2 Frontend (TypeScript)

```typescript
import type { User, Activity } from '@/types';
import { api } from '@/lib/api';
import { API_BASE_URL } from '@/lib/constants';

export async function fetchUserData(): Promise<User | null> {
  try {
    const response = await api.getProfile();
    return response;
  } catch (error) {
    console.error('Failed to fetch user data', error);
    return null;
  }
}
```

**Import order:**
1. React / Next.js built-ins
2. External packages
3. Internal aliases (`@/lib/...`, `@/types`, `@/stores`)
4. Relative imports
5. Type-only imports (`import type`)

**Naming conventions:**

| Kind | Convention | Example |
|------|-----------|---------|
| React components | PascalCase | `ActivityList.tsx` |
| Utility files | camelCase | `api.ts`, `utils.ts` |
| Functions | camelCase | `getActivities()` |
| Interfaces/Types | PascalCase | `CoachProfile`, `Friend` |
| Constants | SCREAMING_SNAKE_CASE | `API_BASE_URL` |

**Rules:**
- Strict mode enabled (`tsconfig.json` has `strict: true`)
- No `any` types (use proper interfaces or `unknown`)
- All HTTP calls through `api` from `@/lib/api` (never raw `fetch` in components)
- Use `API_BASE_URL` from `@/lib/constants` (never hardcode URLs)
- PascalCase components, camelCase functions

### 11.3 Project configuration

| File | Purpose |
|------|---------|
| `.eslintrc.json` (backend) | Security + Node.js plugins |
| `.eslintrc.json` (frontend) | Next.js core-web-vitals |
| `tsconfig.json` | strict: true (not enforced at build) |
| `tailwind.config.js` | Custom design tokens |
| `vitest.config.ts` | Vitest configuration |
| `jest.config.js` | Jest configuration |
| `next.config.js` | Next.js configuration |

### 11.4 What NOT to do

| Forbidden | Correct Alternative |
|-----------|-------------------|
| `console.log` in backend src | `logger.info(...)` from `./src/utils/logger` |
| `console.error` in backend src | `logger.error(...)` from `./src/utils/logger` |
| Raw `fetch` in frontend components | `api.methodName(...)` from `@/lib/api` |
| Hardcoded `http://localhost:3000` | `API_BASE_URL` from `@/lib/constants` |
| `any` type in TypeScript | Proper interface or `unknown` |
| `localStorage` for tokens | `sessionStorage` only |
| String concatenation in SQL | Parameterized queries |
| Storing passwords in plaintext | `encrypt()` from `utils/crypto.js` |

---

## 12. Troubleshooting

### 12.1 Backend startup issues

**Problem: Backend crashes with "Cannot find module 'compression'"**

```
Cause: PM2 working directory not set to backend/
Fix: Set cwd to /home/drawrun/app/backend in ecosystem.config.js
Test: cd backend && node -e "require('compression'); console.log('OK')"
```

**Problem: Server won't start (tests failing)**

```
Cause: Startup tests failed in development mode
Fix: Run npm test -- --forceExit to see full error output
      Fix the failing test → server starts on next npm run dev
```

**Problem: JWT_SECRET not set**

```
Cause: Missing .env file
Fix: cp backend/.env.example backend/.env
      Edit JWT_SECRET in .env
```

### 12.2 Database issues

**Problem: "User not found" when accessing user DB**

```
Cause: User doesn't exist in main.db
Fix: Register a new user via POST /api/auth/register
```

**Problem: Database migration fails**

```
Cause: Migration version conflict or SQL error
Fix: Check schema_migrations table in main.db
     Verify migration versions are lexicographically ordered
```

### 12.3 Frontend issues

**Problem: CORS error in browser**

```
Cause: Backend CORS_ORIGINS doesn't include frontend URL
Fix: Set CORS_ORIGINS=http://localhost:3001 in backend/.env
```

**Problem: API calls returning 401**

```
Cause: Token expired or missing
Fix: Check sessionStorage for 'drawrun_token'
     Log out and log back in
     Verify API_BASE_URL is correct
```

**Problem: Build errors in frontend**

```
Cause: TypeScript errors (not enforced but still visible)
Fix: Check tsconfig.json — strict mode errors show in IDE
     Use proper types instead of 'any'
```

### 12.4 Docker issues

**Problem: Container can't connect to database**

```
Cause: DATA_DIR volume not mounted correctly
Fix: Ensure ./DrawRun-Data:/data volume mapping in docker-compose.yml
```

### 12.5 Quick diagnostic commands

```bash
# Health check
curl http://localhost:3000/health

# Check database files exist
ls -la DrawRun-Data/

# Check node_modules
ls backend/node_modules/.package-lock.json  # (exists if install OK)

# View server logs
tail -f backend/logs/combined.log

# PM2 status
pm2 list
pm2 logs drawrun-backend --lines 20

# Test database access
node -e "
  const db = require('./backend/src/database');
  db.initMainDb().then(() => console.log('DB OK'));
"

# Test module loading
node -e "
  require('./backend/src/utils/logger');
  require('./backend/src/utils/crypto');
  require('./backend/src/utils/jwt');
  console.log('All modules loaded');
"
```
