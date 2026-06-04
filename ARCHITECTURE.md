# ARCHITECTURE.md — DrawRun Architecture Guide

> **Version:** 4.1.0 | **Last Updated:** June 2026

---

## 1. System Overview

DrawRun is a full-stack sports performance tracking platform with three primary design pillars:

1. **Data isolation** — Each user's data lives in its own SQLite database
2. **Scientific rigor** — Training metrics based on peer-reviewed sports science
3. **Multi-source sync** — Activities pulled from Garmin, Strava, Suunto, and Decathlon

```
Users (Browser)
       |
    HTTPS / WSS
       |
Nginx Reverse Proxy (Port 80/443)
  /api/*  →  :3000  (Express API)
  /       →  :3001  (Next.js Frontend)
       |
Express 5 API Server (Port 3000)
  Middleware Stack:
    Helmet → CORS → Compression → Rate Limit → Auth → Cache
       |
  Route Modules:
    Auth | Activity | Coach | Algorithm | Social | Explore | Sync | Race Planning
       |
  Service Layer:
    Coach Engine | Metrics Calculator | Social Service | Sync Providers
       |
  Database Layer:
    main.db (users, tokens, migrations)
    user_{email}.db (per-user: activities, plans, metrics, social)
    LRU Cache (max 100 connections, evict → persist to disk)
```

---

## 2. Key Architectural Decisions

### 2.1 Per-User SQLite Databases

**Why:** Complete data isolation, simpler backups, no multi-tenant complexity.

| Database | Purpose | Location |
|----------|---------|----------|
| `main.db` | Users, refresh_tokens, sync_queue, schema_migrations | `DrawRun-Data/main.db` |
| `user_{email}.db` | Activities, plans, sessions, metrics, social data | `DrawRun-Data/user_{email}.db` |

**Module breakdown:**
- `mainDb.js` — Manages the shared database (users, tokens, migrations)
- `userDb.js` — Opens/creates per-user databases with email-based filenames
- `lruCache.js` — LRU cache for open DB connections (max 100); evicted entries flushed to disk
- `migrations.js` — Schema migration system (MIGRATIONS[] array, runMigrations)
- `index.js` — Barrel file re-exporting all modules for backward compatibility

**Access patterns:**
```javascript
const user = await dbGetMain('SELECT * FROM users WHERE id = ?', [id]);
const userDb = await getUserDb(userId);
const activities = await dbAllUser(userDb, 'SELECT * FROM activities WHERE type = ?', ['Run']);
```

### 2.2 LRU Connection Cache

- **Max size:** 100 concurrent database connections
- **Eviction strategy:** Least Recently Used (Map insertion order)
- **On eviction:** Persists in-memory DB changes to disk via `saveUserDb()`, then closes the connection
- **Property verified:** LRU size never exceeds LRU_MAX_SIZE, evicted entry always the LRU, `saveUserDb` called on every eviction
- **Test isolation:** `fs.writeFileSync` mocked globally in database tests to prevent junk files

### 2.3 Authentication Flow

```
Login
  → POST /api/auth/login
  → Backend validates credentials (bcrypt compare)
  → Returns { token, refreshToken, expiresIn }

Token Storage
  → api.setToken(token)          → sessionStorage['drawrun_token']
  → api.setRefreshToken(token)   → sessionStorage['drawrun_refresh_token']
  → useAuthStore persists to sessionStorage via Zustand persist middleware

Access Token:  JWT, 15 min expiry
Refresh Token: JWT, 7 day expiry, single-use with rotation

401 Handling (Automatic):
  Request → 401 → has refreshToken?
    ├─ Yes → POST /api/auth/refresh
    │        → Rotate tokens → retry original request
    │        → Concurrent 401s queue to single refresh call
    └─ No  → clear tokens → redirect /login

Logout
  → api.setToken(null) → clears both sessionStorage keys
  → api.setRefreshToken(null)
  → useAuthStore.logout()
```

### 2.4 Scientific Algorithms Module

21 algorithm modules backed by peer-reviewed research:

| Module | Research Basis | Key Functions |
|--------|---------------|---------------|
| `Cardiovascular` | Karvonen, HR zones | Heart rate zone calculation |
| `RunningPerformance` | Jack Daniels [4] | VDOT, training paces, race prediction |
| `TrainingLoad` | Edwards TRIMP [2], TSS | TRIMP, TSS, intensity minutes |
| `PMC` | Banister model [1][5][6] | Fitness (CTL), Fatigue (ATL), Form (TSB) |
| `Polarization` | Seiler [3] | 80/20, pyramidal, threshold distribution |
| `HRV` | Esco [10] | Recovery analysis, stress score |
| `CriticalPower` | Poole [9] | CP, W', time-to-exhaustion |
| `Overtraining` | Gabbett [7], ACWR [8] | ACWR, risk assessment |
| `Taper` | Mujika & Padilla [11] | Optimal taper duration, volume reduction |
| `RaceStrategy` | Daniels [4] | Pacing strategy, effort distribution |
| `Biomechanics` | Støren [12] | Running economy, GCT, vertical oscillation |
| `RunningPower` | — | Running power estimation |
| `SleepOptimization` | — | Sleep quality and training readiness |
| `AltitudeTraining` | — | Altitude exposure planning |
| `Nutrition` | — | Sports nutrition recommendations |
| `EnvironmentalImpact` | — | Heat, humidity, air quality impact |
| `SportAnalysis` | — | Multi-sport analysis |
| `MathUtils` | — | Shared math utility functions |
| `ScientificConstants` | — | Reference constants |
| `Recommendations` | — | Training recommendation engine |
| `SportAnalysis` | — | Sport-specific analytics |

**References:**
- [1] Banister, E.W. (1975). Training impulse model.
- [2] Edwards, T.L. (1993). Heart rate monitoring.
- [3] Seiler, S. & Kjerland, G.Ø. (2006). Training intensity distribution.
- [4] Jack Daniels (2021). Daniels' Running Formula, 4th Edition.
- [5] Hellard, P. et al. (2006). Banister model limitations.
- [6] Busso, T. & Chalencon, S. (2023). Impulse-Response Models validity.
- [7] Gabbett, T.J. (2016). Training-injury prevention paradox.
- [8] Maupin, D. et al. (2020). ACWR and Injury Risk.
- [9] Poole, D.C. et al. (2016). Critical Power.
- [10] Esco, M.R. et al. (2025). HRV monitoring.
- [11] Mujika, I. & Padilla, S. (2003). Precompetition tapering.
- [12] Støren, Ø. et al. (2008). Running economy.

### 2.5 Encryption at Rest

- **Algorithm:** AES-256-GCM (authenticated encryption)
- **Purpose:** All third-party credentials (Garmin, Suunto, Strava passwords)
- **Key:** 32-byte key from `CREDENTIALS_SECRET` env variable
- **Format:** `base64( iv + ciphertext + authTag )`
- **Verified:** `decrypt(encrypt(x)) === x` for any valid payload (property-based test)

### 2.6 Cache Strategy

Two-tier caching:

| Layer | Technology | Purpose | TTL |
|-------|-----------|---------|-----|
| L1 | Redis (optional, falls back to in-memory) | API response cache | Configurable |
| L2 | LRU Map | Database connection cache | Eviction-based |

Route cache TTLs:
- Profile/preferences: 600s (10 min)
- Activities: 120s (2 min)
- PMC: 300s (5 min)
- Metrics: 60s (1 min)
- Onboarding: 3600s (1 hour)
- Explore: 600s (10 min)
- Coach: 300s (5 min)
- Sync: no cache
- Notifications: no cache
- Race planning: no cache
- Gear: no cache

### 2.7 Real-Time User Counter

WebSocket-based live user counter (`/api/stats`):
- Tracks active WebSocket connections
- Broadcasts count changes to all connected clients
- Used for community awareness features

---

## 3. Security Architecture

### 3.1 Defense Layers

| Layer | Technology | Purpose |
|-------|-----------|---------|
| 1 | Helmet.js | CSP, HSTS, XSS, X-Frame-Options |
| 2 | CORS | Fail-closed origin validation |
| 3 | Rate Limiting | 5 tiers (auth, sync, sync-status, general, sensitive) |
| 4 | JWT Auth | 15-min access + 7-day rotating refresh |
| 5 | Input Validation | Zod schemas + sanitization middleware |
| 6 | Encryption | AES-256-GCM for credentials |
| 7 | Password Hashing | bcrypt, 12 rounds |
| 8 | SQL Parameterization | Never raw string concatenation |

### 3.2 Rate Limiting Tiers

| Limiter | Scope | Rate | Applied To |
|---------|-------|------|-----------|
| `authLimiter` | Auth endpoints | 5 req/15min | `/api/auth/*` |
| `otpLimiter` | OTP/forgot password | Strict | Forgot password endpoints |
| `syncLimiter` | Sync triggers | Moderate | `POST /api/sync` |
| `syncStatusLimiter` | Status polling | Generous (burst) | `GET /api/sync/status`, `/api/sync/job/*` |
| `userBasedLimiter` | General API | 100 req/15min | Most `/api/*` routes |
| `sensitiveUserLimiter` | Sensitive data | Stricter | Profile, preferences, coach |

### 3.3 CSP Configuration

- Strict CSP with nonces for scripts
- Report-only mode for incremental enforcement
- CSP violation reports sent to `/api/csp-report`
- Separate CORS origins for authenticated API vs public assets

---

## 4. Sync Provider Architecture

| Provider | Method | Auth | Dependencies |
|----------|--------|------|-------------|
| **Garmin** | Python script via child_process.spawn | Username/password (encrypted) | Python 3, garminconnect, garth, requests |
| **Strava** | Playwright headless Chromium scraping | Email/password (encrypted) | Playwright, Chromium browser |
| **Suunto** | HTTP to cloud.suunto.com (reverse-engineered) | OAuth2 credentials (encrypted) | axios |
| **Decathlon** | Official API OAuth2 PKCE | OAuth2 with PKCE flow | axios |

**Token storage:**
- Garmin tokens: `backend/data/garmin_tokens/<userId>/`
- Strava cookies: `backend/data/strava_cookies/<userId>.json`
- Suunto tokens: `backend/data/suunto_tokens/<userId>.json`
- Decathlon tokens: `backend/data/decathlon_tokens/<userId>.json`

**Sync pipeline:** Trigger → Provider fetches → Activity Parser Service (FIT/GPX/TCX) → Store in DB → Metrics Calculator (TSS/PMC/VDOT)

---

## 5. Database Schema

### 5.1 Main DB (`main.db`)

**`users`**
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| email | TEXT UNIQUE | User email |
| password_hash | TEXT | bcrypt hash |
| name | TEXT | Display name |
| twofa_secret | TEXT | TOTP secret |
| twofa_enabled | INTEGER | 0/1 flag |
| fcm | INTEGER | Max heart rate |
| vma | REAL | VMA (km/h) |
| vdot | REAL | VDOT score |
| ftp | INTEGER | Functional Threshold Power |
| weight | REAL | Weight in kg |
| avatar_url | TEXT | Avatar path |
| profile_data | TEXT | JSON profile data |
| otp_attempts | INTEGER | Failed OTP count |
| otp_locked_until | DATETIME | OTP lockout time |
| created_at | DATETIME | Account creation |

**`refresh_tokens`**
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| user_id | INTEGER FK | References users(id) |
| token_hash | TEXT | SHA-256 of token |
| expires_at | DATETIME | Expiry time |
| created_at | DATETIME | Creation time |

**`sync_queue`**
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| user_id | INTEGER FK | References users(id) |
| service | TEXT | Provider name |
| status | TEXT | pending/processing/done/failed |
| priority | INTEGER | Queue priority |
| attempts | INTEGER | Retry count |
| max_attempts | INTEGER | Max retries (default 5) |
| last_error | TEXT | Error message |
| next_retry_at | DATETIME | When to retry |

### 5.2 User DB (`user_{email}.db`)

**`activities`**: id, user_id, type, name, distance, moving_time, elapsed_time, total_elevation_gain, average_speed, max_speed, average_heartrate, max_heartrate, start_date, timezone, map_polyline, tss, source, description, gear_id, weather_data

**`activity_streams`**: id, activity_id, type (time/distance/heartrate/altitude/lat/lng/velocity), data (JSON)

**`training_plans`**: id, user_id, name, type, start_date, end_date, goal, objective, periodization, status, created_at

**`plan_sessions`**: id, plan_id, week, day, type, sport, target_type, duration, distance, intensity, description, scheduled_date, status, feedback, completed_date, matched_activity_id

**`metrics`**: id, date, ctl, atl, tsb, tss_7d, tss_30d, acwr, vdot, fitness, fatigue, form

**`segments`**: id, name, description, created_by, start_lat, start_lng, end_lat, end_lng, distance, elevation_gain

**`routes`**: id, name, distance, elevation_gain, polyline, created_by, is_public, sport_type

**`gear`**: id, name, type, brand, model, distance_used, retired, purchase_date, notes

**`social_*`**: friends, friend_requests, groups, group_members, challenges, challenge_participants, conversations, messages, draws, feed_items, notifications

---

## 6. Database Module Architecture

The database layer was refactored from a single `database.js` into a modular structure:

```
src/database/
├── index.js        # Barrel: initializes SQL.js, re-exports all functions for backward compat
├── mainDb.js       # Main database: init, save, query helpers (dbGetMain, dbRunMain, dbAllMain)
├── userDb.js       # Per-user database: open, save, query helpers (getUserDbByEmail, saveUserDb)
├── lruCache.js     # LRU cache: lruGet, lruSet, lruEvictLRU, getCacheStats, clearCache
└── migrations.js   # Schema migrations: MIGRATIONS[], runMigrations, getMigrationStatus
```

The top-level `src/database.js` is a backward-compatible re-export barrel. All new additions go into the subdirectory modules.

---

## 7. Middleware Architecture

Security middleware was refactored from a single `security.js` into a modular structure:

```
src/middleware/security/
├── index.js        # Barrel: re-exports all security middleware
├── helmet.js       # configureHelmet(), cspReportHandler, generateCspNonce, cspNonceMiddleware
├── cors.js         # validateCorsOrigin() — fail-closed in production
├── headers.js      # securityHeaders, sanitizeInputs, bodySizeLimiter, validateContentType
└── rateLimit.js    # apiLimiter, authLimiter, otpLimiter, syncLimiter, userBasedLimiter, etc.
```

Additional middleware at `src/middleware/`:
- `auth.js` — verifyToken middleware (JWT verification)
- `cache.js` — cacheMiddleware(ttl), noCacheMiddleware
- `validation.js` — Zod schema validation middleware
- `performance.js` — compressionMiddleware, performanceMetrics

---

## 8. Frontend Architecture

### 8.1 API Client Architecture

The frontend API client was refactored from a single `api.ts` into a modular structure:

```
src/lib/api/
├── index.ts              # Barrel: re-exports all domains + backward-compatible `api` object
├── client.ts             # ApiClient class: token management, refresh, HTTP methods
├── types.ts              # ApiError, ApiResponse types
├── auth.api.ts           # login, register, logout, refresh, changePassword
├── activities.api.ts     # list, detail, streams, create, manualActivity
├── coach.api.ts          # profile, startPlan, planFeedback, session management
├── algo.api.ts           # zones, vdot, pmc, readiness, hrv, taper, criticalPower
├── social.api.ts         # friends, feed, groups, challenges, conversations
├── explore.api.ts        # segments, routes, heatmap
├── sync.api.ts           # triggerSync, syncStatus
├── metrics.api.ts        # getMetrics, recalculate
├── profile.api.ts        # getProfile, updateProfile
├── race-planning.api.ts  # calculate, save, list, raceStrategy
├── gear.api.ts           # list, add, update, delete
├── notifications.api.ts  # subscribe, unsubscribe, getVapidKey
├── onboarding.api.ts     # onboarding status, update
├── share.api.ts          # share image generation
├── weather.api.ts        # activity weather data
├── user-constants.api.ts # physiological constants
└── user-counter.api.ts   # live user count
```

### 8.2 State Management (Zustand Stores)

```
src/stores/index.ts:
- useAuthStore:          Authentication state (user, token, login, logout, 2FA)
- useDashboardStore:     Dashboard metrics (PMC, stats, activities)
- useZonesStore:         Training zones (HR, pace, power zones)
- useActivitiesStore:    Activity list and filters
```

All stores use `persist` middleware with `sessionStorage` (never localStorage), verified by property-based tests.

### 8.3 Component Architecture

```
components/
├── ui/              # Base primitives (Button, Card, Input, Modal, Skeleton, Badge, Avatar, Dialog, GlassCard)
├── layout/          # App layout (AppLayout, Sidebar, Header, NavBar)
├── features/        # Feature components (activities/, auth/, coach/, dashboard/, explore/, gear/, onboarding/, performance/, social/)
└── providers/       # Context providers (ErrorBoundary, QueryProvider, ThemeProvider, LanguageProvider)
```

### 8.4 Data Fetching

- Primary: `@tanstack/react-query` for server data caching and auto-refetch
- State: Zustand for global client state
- Forms: react-hook-form + Zod validation
- All HTTP requests go through `api` from `@/lib/api` (never raw fetch in components)
- API URL from `API_BASE_URL` in `@/lib/constants` (never hardcoded)

---

## 9. Testing Architecture

### 9.1 Backend (Jest)

| Suite | Tests | Type |
|-------|-------|------|
| `algorithms.test.js` | 55 | Scientific algorithm validation |
| `extended_algorithms.test.js` | 13 | Biomechanics, Taper, RaceStrategy + property test |
| `auth.test.js` | 14 | JWT, refresh, credential encryption + Property 11 |
| `crypto.test.js` | 5 | AES-256-GCM + Property 12 |
| `database.test.js` | 12 | LRU cache, migrations + Properties 1-3, 13 |
| `validators.test.js` | 21 | Input validation |
| `routes.test.js` | 3 | Route file structure |
| `routes/activities.test.js` | 7 | Activities API |
| `routes/explore.test.js` | 9 | Explore endpoints |
| `routes/sync.test.js` | 12 | Sync endpoints |
| `routes/performance.test.js` | 15 | Performance endpoints |
| `routes/race_planning.test.js` | 14 | Race planning |
| `services/metricsCalculator.test.js` | 30 | Metrics calculation |
| **Total** | **210** | **13 suites** |

**Property-based tests (fast-check):**
1. LRU size never exceeds LRU_MAX_SIZE
2. Evicted entry is always the LRU
3. saveUserDb called on every eviction
4. sessionStorage updated after login
5. Exactly 1 refresh call, then retry
6. logout + redirect on failed refresh
7. Queue mechanism: N concurrent 401s → 1 refresh
8. Both sessionStorage keys cleared on logout
9. sessionStorage only, never localStorage
10. Callback called for any error
11. Credentials never plaintext (encrypted format regex)
12. decrypt(encrypt(x)) === x for any valid payload
13. Migrations in ascending lexicographic order

### 9.2 Frontend (Vitest + Playwright)

| Category | Files | Tests |
|----------|-------|-------|
| Unit tests | 27 files | 421 tests |
| E2E specs | 2 files | auth.spec, dashboard.spec |

**Coverage areas:**
- API client (26 tests)
- Zustand stores (auth store, sync store)
- UI components (Button, Card, Input, Modal, Skeleton, Badge, Avatar, Dialog, GlassCard)
- Feature components (GearCard, analysis-cards, DrawButton, TaperingChart)
- Explore components (RouteDetailPopup, ElevationProfile, MapLayerSwitcher, Segments)
- Custom hooks (useSocial, useGroupDetail, useLeafletMap)
- ErrorBoundary, polyline utility

---

## 10. Deployment Architecture

### 10.1 Production Stack (VPS)

```
Ubuntu 24.04 LTS
  ├── Node.js 20.20.2
  ├── PM2 6.0.14 (process manager)
  ├── Nginx 1.24.0 (reverse proxy + SSL termination)
  ├── Python 3.12.3 (Garmin sync bridge)
  └── Certbot (Let's Encrypt SSL)
```

### 10.2 PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'drawrun-backend',
      script: 'index.js',
      cwd: '/home/drawrun/app/backend',  // Critical: must be backend directory
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production', PORT: 3000 },
      max_memory_restart: '512M',
      restart_delay: 3000,
      max_restarts: 5,
    },
    {
      name: 'drawrun-frontend',
      script: './node_modules/.bin/next',
      cwd: '/home/drawrun/app/frontend',
      args: 'start --port 3001',
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production', PORT: 3001 },
      max_memory_restart: '512M',
    },
  ],
};
```

**Key insight:** The `cwd` must point to `backend/` directory so that `require('compression')` resolves from `backend/node_modules/`.

### 10.3 Docker Alternative

```yaml
services:
  backend:  # Custom Node.js Dockerfile, port 3000
  frontend: # Next.js Dockerfile, port 3001
  redis:    # redis:7-alpine, for caching (optional)
  nginx:    # nginx:1.25-alpine, reverse proxy (production profile)
  prometheus + grafana: # monitoring (monitoring profile)
```

See `docker-compose.yml` for full configuration.

---

## 11. Known Constraints

- **sql.js** (not better-sqlite3) — synchronous API wrapped in Promises; no native async
- **LRU test isolation** — `fs.writeFileSync` must be mocked globally in `database.test.js`
- **Startup tests** — only run when `NODE_ENV !== 'production'`
- **Redis optional** — cache falls back to in-memory if `REDIS_URL` not set
- **Playwright** — in `dependencies` (not devDependencies) for production sync
- **TypeScript errors NOT enforced at build** — `next.config.js` has `typescript: { ignoreBuildErrors: true }`
- **Modular barrel pattern** — always extend subdirectories, update barrel exports for backward compat

---

## 12. Logging Architecture

- **Library:** Winston 3
- **Log files:** `backend/logs/`
  - `combined.log` — all levels
  - `error.log` — errors only
  - `security.log` — security events (warn+)
  - `auth.log` — authentication events
- **Development:** Console transport with colors
- **Rule:** Never use `console.log` in backend source code; always use `logger.info/warn/error`

---

## 13. Key Design Patterns

### Barrel Export Pattern

Used in database, middleware/security, frontend API client, and algorithms:

```javascript
// Module subdirectory (e.g., database/)
// Each submodule owns its logic
// Parent index.js re-exports everything for backward compat
module.exports = {
  ...require('./mainDb'),
  ...require('./userDb'),
  ...require('./lruCache'),
  ...require('./migrations'),
};
```

### Query Parameterization

All SQL queries use parameterized statements — never string concatenation:

```javascript
// ✅ Correct
db.run('SELECT * FROM users WHERE email = ?', [email]);

// ❌ Wrong
db.run(`SELECT * FROM users WHERE email = '${email}'`);
```

### Token Queue Pattern

Concurrent 401s are queued to prevent multiple simultaneous refresh calls:

```javascript
refreshQueue.push({ resolve, reject });
if (!this.isRefreshing) {
  this.isRefreshing = true;
  await this.refreshAccessToken();
  // Replay queued requests
  this.refreshQueue.forEach(({ resolve }) => resolve(newToken));
}
```

### Cache-First Route Pattern

Most API routes use cache middleware with TTL appropriate to data freshness:

```javascript
app.use('/api/activities', verifyToken, userBasedLimiter, cacheMiddleware(120), activitiesRoutes);
```
