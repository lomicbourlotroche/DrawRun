# AGENTS.md — DrawRun Agentic Coding Guidelines

> This file is the single source of truth for any AI agent working on the DrawRun codebase.
> Read it entirely before making any change.

---

## 1. Project Overview

DrawRun is a full-stack sports performance tracking application.

| Layer | Stack | Port |
|-------|-------|------|
| Backend API | Node.js 18+ / Express 5 / SQLite (sql.js) | 3000 |
| Frontend | Next.js 14 (App Router) / TypeScript 5 strict / Tailwind CSS | 3001 |

**Key architectural decisions:**
- **Per-user SQLite databases** — each user has their own `DrawRun-Data/user_<email>.db`; shared data lives in `DrawRun-Data/main.db`
- **LRU cache** — max 100 open DB connections; evicted entries are persisted to disk before closing
- **JWT + Refresh Token** — access tokens (15 min), refresh tokens (7 days) with rotation; both stored in `sessionStorage`
- **AES-256-GCM encryption** — all third-party credentials (Garmin, Suunto, Strava passwords) encrypted at rest
- **Formal schema migrations** — `schema_migrations` table in `main.db`; migrations run at startup
- **Winston logging** — never use `console.log` in backend source; use `logger.info/warn/error` from `./src/utils/logger`

---

## 2. Repository Structure

```
DrawRun-New/
├── backend/                        # Express 5 API
│   ├── index.js                    # Entry point — runs tests then starts server
│   ├── jest.config.js              # Jest configuration
│   ├── package.json                # v4.1.0
│   ├── .env                        # Local secrets (never commit)
│   ├── .env.example                # Template for all env vars
│   ├── .eslintrc.json              # ESLint (security + node plugins)
│   ├── src/
│   │   ├── database.js             # Re-exports from database/
│   │   ├── database/
│   │   │   ├── index.js            # Core: sql.js init, per-user DB, helpers
│   │   │   └── migrations.js       # Schema migrations (MIGRATIONS, runMigrations)
│   │   ├── api_routes.js           # Re-exports from routes/algo/
│   │   ├── coach_plan.js           # Re-exports from services/coach/
│   │   ├── config/
│   │   │   └── swagger.js          # Swagger/OpenAPI setup
│   │   ├── algorithms/
│   │   │   ├── index.js            # All algorithm exports (Cardiovascular, PMC, etc.)
│   │   │   ├── tss.js              # TSS/TRIMP calculation
│   │   │   ├── sports.js           # Sports management
│   │   │   └── ... (21 files)      # Scientific algorithm modules
│   │   ├── routes/
│   │   │   ├── auth.js             # Express router: login, register, 2FA, credentials
│   │   │   ├── activities.js       # GET/POST /api/activities
│   │   │   ├── coach.js            # /api/coach/*
│   │   │   ├── social.js           # Re-exports from routes/social/
│   │   │   ├── social/             # Social routes by domain (friends, groups, feed, etc.)
│   │   │   │   └── index.js        # All social endpoints (to be split further)
│   │   │   ├── algo/               # Scientific algorithm routes (split from api_routes.js)
│   │   │   │   ├── index.js        # Aggregator + recommendations, health, constants, analyze
│   │   │   │   ├── zones.js        # /zones, /vdot
│   │   │   │   ├── pmc.js          # /pmc, /readiness, /overtraining
│   │   │   │   └── training.js     # /polarization, /taper, /tss, /critical-power
│   │   │   ├── explore.js          # /api/explore (segments, routes, heatmap)
│   │   │   ├── gear.js             # /api/gear (CRUD) — verifyToken fixed
│   │   │   ├── metrics.js          # /api/metrics
│   │   │   ├── notifications.js    # /api/notifications (push/subscribe)
│   │   │   ├── onboarding.js       # /api/onboarding
│   │   │   ├── overtraining.js     # /api/overtraining
│   │   │   ├── pmc.js              # /api/pmc
│   │   │   ├── preferences.js      # /api/preferences
│   │   │   ├── profile.js          # /api/profile
│   │   │   ├── race_planning.js    # /api/race-planning
│   │   │   ├── share.js            # /api/activities/:id/share-image
│   │   │   ├── sync.js             # /api/sync
│   │   │   ├── user-constants.js   # /api/user/constants
│   │   │   └── weather.js          # /api/activities/:id/weather
│   │   ├── services/
│   │   │   ├── cache.js            # Redis / in-memory cache
│   │   │   ├── coach/              # Coach engine (split from coach_plan.js)
│   │   │   │   ├── index.js        # Orchestration (getCoachProfile, getGamification)
│   │   │   │   ├── plan.service.js # Plan creation, periodization, helpers
│   │   │   │   └── session.service.js  # Session CRUD, test scheduling, adaptation
│   │   │   ├── metricsCalculator.service.js # PMC / TSS / VDOT post-sync metrics
│   │   │   ├── queryOptimizer.js   # BatchLoader, N+1 prevention
│   │   │   ├── userConstants.service.js  # User physiological constants
│   │   │   ├── social.service.js   # Re-exports from services/social/
│   │   │   ├── social/             # Social services by domain
│   │   │   │   ├── index.js        # All social service functions (to be split further)
│   │   │   │   ├── draws.service.js  # DrawRun kudos system
│   │   │   │   ├── friends.service.js
│   │   │   │   ├── feed.service.js
│   │   │   │   ├── groups.service.js
│   │   │   │   ├── challenges.service.js
│   │   │   │   ├── conversations.service.js
│   │   │   │   ├── engagement.service.js
│   │   │   │   └── notifications.service.js
│   │   │   ├── explore/            # Explore domain (segments, routes, heatmap)
│   │   │   │   ├── elevation.service.js
│   │   │   │   ├── routes.service.js
│   │   │   │   ├── segments.service.js
│   │   │   │   └── heatmap.service.js
│   │   │   ├── notifications/
│   │   │   │   └── push.service.js # Push notifications
│   │   │   ├── sync/               # Sync providers
│   │   │   │   ├── strava.js       # Strava sync via Playwright
│   │   │   │   ├── garmin.js       # Garmin sync via Python bridge
│   │   │   │   ├── suunto.js       # Suunto sync via reverse-engineered API
│   │   │   │   ├── decathlon.js    # Decathlon sync via OAuth2
│   │   │   │   └── utils.js        # Shared sync helpers (batch insert, merge details)
│   │   │   ├── auth/
│   │   │   │   └── 2fa.service.js   # TOTP / QR code 2FA helpers
│   │   │   └── userConstants.service.js  # User physiological constants
│   │   ├── middleware/
│   │   │   ├── cache.js            # Cache middleware
│   │   │   ├── security.js         # Helmet, rate limiting, CORS, CSP
│   │   │   └── performance.js      # LRU computation cache, compression, perf metrics
│   │   └── utils/
│   │       ├── crypto.js           # AES-256-GCM encrypt/decrypt
│   │       ├── jwt.js              # Token generation, verifyAccessToken, rotation
│   │       ├── validators.js       # Input validation helpers
│   │       ├── logger.js           # Winston logger (use this, not console.log)
│   │       ├── gpx_utils.js        # GPX parsing, Haversine
│   │       └── helpers.js          # maskEmail, sleep, clamp (replaces db_helpers.js)
│   ├── tests/
│   │   ├── setup.js                # Jest global setup (env vars, console mocks)
│   │   ├── algorithms.test.js      # Scientific algorithm tests (55 tests)
│   │   ├── auth.test.js            # Auth + refresh endpoint + encryption (14 tests)
│   │   ├── crypto.test.js          # Encrypt/decrypt + Property 12 (5 tests)
│   │   ├── database.test.js        # LRU cache + migrations + Properties 1-3,13 (12 tests)
│   │   ├── validators.test.js      # Input validation (21 tests)
│   │   ├── routes.test.js          # Route structure (3 tests)
│   │   └── routes/
│   │       └── activities.test.js  # Activities routes (7 tests)
│   ├── scripts/
│   │   ├── backup.js
│   │   └── restore.js
│   ├── logs/                       # Winston log files (gitignored)
│   ├── data/                       # SQLite test data (gitignored)
│   └── test-data/                  # Jest test DB directory
│
├── frontend/                       # Next.js 14 App Router
│   ├── app/
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Landing page (uses _sections/)
│   │   ├── _sections/              # 10 landing page sections
│   │   ├── globals.css
│   │   ├── login/page.tsx
│   │   ├── garmin/page.tsx
│   │   └── app/                    # Authenticated app
│   │       ├── layout.tsx
│   │       ├── page.tsx            # Dashboard
│   │       ├── activities/
│   │       ├── coach/
│   │       ├── performance/
│   │       ├── profile/
│   │       └── social/
│   ├── components/
│   │   ├── ui/                     # Base UI (Button, Card, Input, Modal, etc.)
│   │   ├── layout/                 # AppLayout, Sidebar, Header
│   │   ├── features/
│   │   │   ├── activities/         # ActivityList, MobileActivityRecorder
│   │   │   ├── auth/               # LoginForm
│   │   │   ├── coach/              # AdaptivePlanWizard, SessionFeedback, etc.
│   │   │   ├── dashboard/          # PmcChart, QuickStats, ReadinessCard, etc.
│   │   │   ├── onboarding/         # OnboardingWizard
│   │   │   ├── performance/        # PerformanceMetrics
│   │   │   └── social/             # SocialHub, Chat, Challenges, etc.
│   │   ├── providers/
│   │   │   ├── ErrorBoundary.tsx   # React error boundary with retry + onError
│   │   │   ├── QueryProvider.tsx
│   │   │   ├── ThemeProvider.tsx
│   │   │   └── LanguageProvider.tsx
│   │   └── NavBar.tsx
│   ├── src/
│   │   ├── lib/
│   │   │   ├── api.ts              # ApiClient — ALL HTTP calls go through here
│   │   │   ├── constants.ts        # API_BASE_URL, API_ENDPOINTS
│   │   │   ├── utils.ts
│   │   │   ├── i18n.ts
│   │   │   └── designTokens.ts
│   │   ├── types/
│   │   │   ├── index.ts            # All TypeScript interfaces (User, Activity, Coach, Social…)
│   │   │   └── sports.ts
│   │   └── stores/
│   │       └── index.ts            # Zustand stores (useAuthStore, useDashboardStore, etc.)
│   ├── tests/
│   │   └── lib/
│   │       └── api.test.ts         # ApiClient tests + Properties 4-7 (26 tests)
│   ├── next.config.js
│   ├── tsconfig.json               # strict: true
│   ├── tailwind.config.js
│   └── package.json
│
├── DrawRun-Data/                   # SQLite databases (gitignored)
│   ├── main.db                     # Users + refresh_tokens + schema_migrations
│   └── user_<email>.db             # Per-user data
│
├── AGENTS.md                       # This file
├── README.md                       # User-facing documentation
└── DEPLOYMENT.md                   # Deployment instructions
```

---

## 3. Build & Run Commands

### Backend

```bash
cd backend

# Development (runs tests first, then starts server with nodemon)
npm run dev

# Production
npm start

# Tests only
npm test                          # All 107 tests
npm test -- --testPathPattern=auth  # Single suite
npm run test:coverage             # Coverage report

# Maintenance
npm run backup                    # Backup SQLite databases
npm run restore                   # Restore from backup
npm run lint                      # ESLint check
npm run lint:fix                  # Auto-fix lint issues
```

### Frontend

```bash
cd frontend

# Development
npm run dev                       # http://localhost:3001

# Production
npm run build
npm run start

# Quality
npm run lint                      # ESLint (next/core-web-vitals)
npm run test                      # Vitest (run once)
npm run test:watch                # Vitest watch mode
npm run test:coverage             # Coverage report

# Storybook
npm run storybook                 # http://localhost:6006
```

---

## 4. Environment Variables

### Backend (`backend/.env`)

```bash
# Server
PORT=3000
NODE_ENV=development              # development | production | test

# Database
DATA_DIR=../../DrawRun-Data       # Path to SQLite databases

# Security — REQUIRED in production
JWT_SECRET=                       # openssl rand -base64 64
CREDENTIALS_SECRET=               # openssl rand -base64 32
BCRYPT_ROUNDS=12

# CORS
CORS_ORIGINS=http://localhost:3001

# Rate limiting
API_RATE_LIMIT=100
AUTH_RATE_LIMIT=5

# Strava OAuth2
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_CALLBACK_URL=http://localhost:3001/auth/strava/callback

# Email (SMTP)
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@drawrun.fr

# Logging
LOG_LEVEL=info
LOG_DIR=./logs

# Redis (optional, falls back to in-memory)
# REDIS_URL=redis://localhost:6379

# 2FA
TOTP_ISSUER=DrawRun
```

### Frontend (`frontend/.env.local`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## 5. Critical Rules for AI Agents

### 5.1 Never do these

| ❌ Forbidden | ✅ Correct alternative |
|-------------|----------------------|
| `console.log(...)` in backend `src/` | `logger.info(...)` from `./src/utils/logger` |
| `console.error(...)` in backend `src/` | `logger.error(...)` |
| `fetch(process.env.NEXT_PUBLIC_API_URL + '/api/...')` in components | `api.methodName(...)` from `@/lib/api` |
| Hardcode `http://localhost:3000` anywhere | Use `API_BASE_URL` from `@/lib/constants` |
| Use `any` type in TypeScript | Use proper interface from `@/types` or `unknown` |
| Write to `backend/` root directory from tests | Use `test-data/` or mock `fs.writeFileSync` |
| Add `playwright` to `dependencies` | Keep in `devDependencies` |
| Store tokens in `localStorage` | Use `sessionStorage` only |

### 5.2 Always do these

- **All HTTP calls** from frontend must go through `api` from `@/lib/api` — never use raw `fetch` in components
- **All backend logging** must use Winston `logger` — never `console.log`
- **All sensitive data** (passwords, tokens) must be encrypted with `encrypt()` from `utils/crypto.js` before DB storage
- **All new DB schema changes** must be added as a migration in the `MIGRATIONS` array in `database.js`
- **TypeScript strict mode** — `tsc --noEmit` must pass with 0 errors after every change
- **Tests must pass** — `npm test` must show 107/107 passing (120 with extended) after every backend change
- **No junk files** — LRU tests must mock `fs.writeFileSync` globally (see `database.test.js` `beforeAll`)

### 5.3 Token & Auth flow

```
Login → backend returns { token, refreshToken }
      → api.setToken(token)           → sessionStorage['drawrun_token']
      → api.setRefreshToken(token)    → sessionStorage['drawrun_refresh_token']
      → useAuthStore persists to sessionStorage via createJSONStorage

401 on any request (except /api/auth/login, /api/auth/refresh):
      → if no refreshToken → logout() + redirect /login
      → if refreshToken → POST /api/auth/refresh → rotate tokens → retry request
      → concurrent 401s → queue, single refresh call

Logout:
      → api.setToken(null)            → clears both sessionStorage keys
      → api.setRefreshToken(null)
      → useAuthStore.logout()
```

### 5.4 Database patterns

```javascript
// Main DB (users, refresh_tokens, schema_migrations)
const user = await dbGetMain('SELECT * FROM users WHERE id = ?', [userId]);
await dbRunMain('UPDATE users SET ... WHERE id = ?', [...values, userId]);

// User DB (activities, training_plans, etc.)
const userDb = await getUserDb(userId);           // or getUserDbByEmail(email)
const activities = await dbAllUser(userDb, 'SELECT * FROM activities', []);
await dbRunUser(userDb, 'INSERT INTO activities ...', [...values]);

// Never access userDbCache directly — use lruGet/lruSet
// Never write raw SQL with string concatenation — always use parameterized queries
```

### 5.5 Adding a new migration

```javascript
// In backend/src/database.js, add to MIGRATIONS array:
{
    version: '003_your_migration_name',   // must be lexicographically after '002_...'
    description: 'Human-readable description',
    up: (db) => {
        try { db.run('ALTER TABLE users ADD COLUMN new_col TEXT'); } catch (_) {}
    },
},
```

---

## 6. Testing

### Backend (Jest) — 120 tests, 8 suites (107 core + 13 extended)

| Suite | Tests | What it covers |
|-------|-------|----------------|
| `algorithms.test.js` | 55 | Scientific algorithms (VDOT, PMC, TSS, HRV, etc.) |
| `extended_algorithms.test.js` | 13 | Biomechanics, Taper, RaceStrategy, property-based |
| `auth.test.js` | 14 | JWT, refresh endpoint, credential encryption, Property 11 |
| `crypto.test.js` | 5 | AES-256-GCM encrypt/decrypt, Property 12 |
| `database.test.js` | 12 | LRU cache, migrations, Properties 1-3, 13 |
| `validators.test.js` | 21 | Input validation |
| `routes.test.js` | 3 | Route file structure |
| `routes/activities.test.js` | 7 | Activities API endpoints |

**Property-based tests (fast-check):**

| Property | File | What it proves |
|----------|------|----------------|
| 1 — LRU size ≤ 100 | database.test.js | Cache never exceeds LRU_MAX_SIZE |
| 2 — LRU eviction order | database.test.js | Evicted entry is always the LRU |
| 3 — Eviction persists | database.test.js | saveUserDb called on every eviction |
| 4 — refreshToken stored on login | api.test.ts | sessionStorage updated after login |
| 5 — 401 → refresh → retry | api.test.ts | Exactly 1 refresh call, then retry |
| 6 — Failed refresh → logout | api.test.ts | logout() + redirect /login |
| 7 — N concurrent 401s → 1 refresh | api.test.ts | Queue mechanism works |
| 8 — Logout clears all auth state | stores/index.test.ts | Both sessionStorage keys cleared |
| 9 — Token never in localStorage | stores/index.test.ts | sessionStorage only |
| 10 — ErrorBoundary onError | ErrorBoundary.test.tsx | Callback called for any error |
| 11 — Credentials never plaintext | auth.test.js | Encrypted format regex |
| 12 — encrypt/decrypt round-trip | crypto.test.js | decrypt(encrypt(x)) === x |
| 13 — Migrations in order | database.test.js | Ascending lexicographic order |

### Frontend (Vitest)

```bash
cd frontend
npm run test          # Run all tests once
npm run test:watch    # Watch mode
npm run test:coverage # Coverage
```

Test files:
- `tests/lib/api.test.ts` — ApiClient (26 tests, Properties 4-7)
- `src/stores/index.test.ts` — Zustand auth store (Properties 8-9)
- `components/providers/ErrorBoundary.test.tsx` — ErrorBoundary (Property 10)

### Startup tests (development only)

When `NODE_ENV !== 'production'`, `backend/index.js` runs the full Jest suite before starting the server. If any test fails, the server does not start.

```
╔══════════════════════════════════════════════════╗
║         🧪  Running startup test suite…          ║
╚══════════════════════════════════════════════════╝
... Jest output ...
╔══════════════════════════════════════════════════╗
║         ✅  All tests passed — starting server   ║
╚══════════════════════════════════════════════════╝
```

---

## 7. Code Style

### TypeScript (frontend)

```typescript
// ✅ Correct
import type { User, Activity, CoachProfile } from '@/types';
import { api } from '@/lib/api';
import { API_BASE_URL } from '@/lib/constants';

// ❌ Wrong
const response = await fetch(`http://localhost:3000/api/coach/start-plan`, ...);
const data: any = await api.getProfile();
```

**Import order:**
1. React / Next.js built-ins
2. External packages
3. Internal aliases (`@/lib/...`, `@/types`, `@/stores`)
4. Relative imports
5. Type-only imports (`import type`)

**Naming:**

| Kind | Convention | Example |
|------|-----------|---------|
| React components | PascalCase | `ActivityList.tsx` |
| Utility files | camelCase | `api.ts`, `utils.ts` |
| Config files | kebab-case | `tailwind.config.js` |
| Functions | camelCase | `getActivities()` |
| Interfaces/Types | PascalCase | `CoachProfile`, `Friend` |
| Constants | SCREAMING_SNAKE_CASE | `API_BASE_URL`, `LRU_MAX_SIZE` |

### JavaScript (backend)

- `'use strict'` at top of every file
- Async/await everywhere — no raw Promise chains
- Parameterized SQL queries — never string concatenation
- Winston logger — never `console.log`
- Error responses: `res.status(4xx).json({ error: 'message' })`

---

## 8. Security Checklist

Before committing any change, verify:

- [ ] No secrets hardcoded (use `process.env.*`)
- [ ] All user inputs validated before DB queries
- [ ] Passwords/tokens encrypted with `encrypt()` before storage
- [ ] New endpoints protected with `verifyToken` middleware
- [ ] Rate limiting applied to sensitive endpoints
- [ ] `tsc --noEmit` passes (frontend)
- [ ] `npm test` passes 120/120 (backend) [107 core + 13 extended]
- [ ] No new files created in `backend/` root (LRU test isolation)

---

## 9. API Reference

### Auth endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | — | Login, returns `{ token, refreshToken, expiresIn }` |
| POST | `/api/auth/register` | — | Register |
| POST | `/api/auth/refresh` | — | Rotate refresh token |
| POST | `/api/auth/logout` | JWT | Logout |
| POST | `/api/auth/change-password` | JWT | Change password |
| POST | `/api/auth/forgot-password/request` | — | Send OTP |
| POST | `/api/auth/forgot-password/confirm` | — | Reset with OTP |
| POST | `/api/auth/credentials/garmin` | JWT | Save Garmin credentials (encrypted) |
| POST | `/api/auth/credentials/suunto` | JWT | Save Suunto credentials (encrypted) |
| POST | `/api/auth/credentials/strava` | JWT | Save Strava credentials (encrypted) |
| POST | `/api/auth/2fa/setup` | JWT | Generate TOTP secret |
| POST | `/api/auth/2fa/enable` | JWT | Enable 2FA |
| POST | `/api/auth/2fa/disable` | JWT | Disable 2FA |

### Core endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | — | Health check + version |
| GET | `/api/profile` | JWT | Get user profile |
| PUT | `/api/profile` | JWT | Update profile |
| GET | `/api/activities` | JWT | List activities (paginated) |
| POST | `/api/activities/create` | JWT | Create manual activity |
| GET | `/api/pmc` | JWT | PMC data |
| POST | `/api/sync` | JWT | Trigger sync |
| GET | `/api/sync/status` | JWT | Sync status |
| GET | `/api/metrics` | JWT | Performance metrics |
| POST | `/api/metrics/recalculate` | JWT | Recalculate metrics |

### Coach endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/coach/profile` | Coach profile |
| POST | `/api/coach/start-plan` | Start adaptive plan |
| POST | `/api/coach/plan-feedback` | Submit session feedback |
| GET | `/api/coach/plan/:id` | Get plan details |
| POST | `/api/coach/session-missed` | Report missed session |
| GET | `/api/coach/progress/:id` | Plan progress |
| POST | `/api/coach/schedule-test` | Schedule VMA test |
| POST | `/api/coach/submit-test-results` | Submit test results |
| POST | `/api/coach/external-event` | Add external event |
| GET | `/api/coach/gamification/:id` | Gamification data |
| POST | `/api/coach/match-activity` | Match activity to session |
| GET | `/api/coach/pending-sessions` | Pending sessions |

### Social endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/social/friends` | Friend list |
| POST | `/api/social/friends/request` | Send friend request |
| POST | `/api/social/friends/accept` | Accept request |
| GET | `/api/social/feed` | Social feed |
| GET | `/api/social/leaderboard` | Leaderboard |
| GET | `/api/social/groups` | Groups |
| POST | `/api/social/groups` | Create group |
| GET | `/api/social/challenges/public` | Public challenges |

### Scientific algorithm endpoints (`/api/algo`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/algo/zones` | — | Training zones (HR, speed, pace) |
| GET | `/api/algo/vdot` | — | VDOT and race time prediction |
| GET | `/api/algo/pmc` | — | PMC calculation |
| GET | `/api/algo/recommendations` | — | Training recommendations |
| GET | `/api/algo/polarization` | — | Polarization analysis (80/20, pyramidal) |
| GET | `/api/algo/hrv` | — | HRV analysis |
| GET | `/api/algo/taper` | — | Optimal taper calculation |
| GET | `/api/algo/overtraining` | — | Overtraining risk detection |
| GET | `/api/algo/critical-power` | — | Critical power / W' estimation |
| GET | `/api/algo/tss` | — | TSS/TRIMP calculation |
| GET | `/api/algo/readiness` | — | Readiness assessment |
| GET | `/api/algo/health` | — | Health check for algo module |
| GET | `/api/algo/constants` | — | Scientific constants |
| POST | `/api/algo/analyze` | — | Full activity analysis |
| GET | `/api/algo/sports` | — | Sports management data |

### Additional route endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/explore/segments` | JWT | List segments |
| POST | `/api/explore/segments` | JWT | Create segment |
| GET | `/api/explore/segments/:id` | JWT | Segment details |
| GET | `/api/explore/segments/:id/leaderboard` | JWT | Segment leaderboard |
| POST | `/api/explore/routes` | JWT | Create route |
| GET | `/api/explore/routes` | JWT | List routes |
| GET | `/api/explore/routes/:id` | JWT | Route details |
| GET | `/api/explore/routes/my` | JWT | My routes |
| GET | `/api/explore/routes/favorites` | JWT | Favorite routes |
| GET | `/api/explore/heatmap` | JWT | Heatmap data |
| GET | `/api/explore/heatmap/popular` | JWT | Popular segments heatmap |
| GET | `/api/explore/community/traces` | JWT | Community traces |
| GET | `/api/notifications/vapid-key` | JWT | VAPID public key |
| POST | `/api/notifications/subscribe` | JWT | Subscribe to push |
| DELETE | `/api/notifications/unsubscribe` | JWT | Unsubscribe from push |
| POST | `/api/notifications/test` | JWT | Test push notification |
| POST | `/api/race-planning/calculate` | JWT | Calculate race plan |
| POST | `/api/race-planning/save` | JWT | Save race plan |
| GET | `/api/race-planning/list` | JWT | List race plans |
| DELETE | `/api/race-planning/:id` | JWT | Delete race plan |
| POST | `/api/coach/race-planner/race-strategy` | JWT | Generate race strategy |
| GET | `/api/activities/:id/weather` | JWT | Activity weather data |
| GET | `/api/activities/:id/share-image` | JWT | Generate share image |
| GET | `/api/user/constants` | JWT | User physiological constants |
| GET | `/api/gear` | JWT | List gear |
| POST | `/api/gear` | JWT | Add gear item |
| PUT | `/api/gear/:id` | JWT | Update gear item |
| DELETE | `/api/gear/:id` | JWT | Delete gear item |

---

## 10. Logging

All backend logging uses Winston. Import and use:

```javascript
const { logger } = require('./utils/logger');   // or '../utils/logger' depending on depth

logger.info('Message');
logger.warn('Warning', { context: 'value' });
logger.error('Error message', { error: err.message, stack: err.stack });
```

Log files (in `backend/logs/`):
- `combined.log` — all levels
- `error.log` — errors only
- `security.log` — security events (warn+)
- `auth.log` — authentication events

In development, logs also print to console with colors.

---

## 11. Health Check

```bash
curl http://localhost:3000/health
```

```json
{
  "status": "running",
  "message": "DrawRun API Server is running. 🚀",
  "timestamp": "2026-05-02T...",
  "version": "4.1.0",
  "cache": { "type": "memory", "status": "ok" }
}
```

---

## 12. Known Constraints

- **sql.js** (not better-sqlite3) — synchronous API wrapped in Promises; no native async
- **LRU test isolation** — `fs.writeFileSync` must be mocked globally in `database.test.js` via `beforeAll` to prevent junk files in `backend/` root
- **Startup tests** — only run when `NODE_ENV !== 'production'`; add `NODE_ENV=production` to skip in CI if needed
- **Redis optional** — cache falls back to in-memory if `REDIS_URL` not set
- **Playwright** — in `devDependencies` only; not installed in production (`npm install --production`)
