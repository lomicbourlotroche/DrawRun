# DrawRun

[![Version](https://img.shields.io/badge/version-4.1.0-blue.svg)](https://github.com/lomicbourlotroche/DrawRun)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/tests-107%20passing-brightgreen.svg)](https://github.com/lomicbourlotroche/DrawRun)

A full-stack sports performance tracking application with per-user databases, scientific training algorithms, and multi-platform integration.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Running the Project](#running-the-project)
- [Testing](#testing)
- [API Reference](#api-reference)
- [Database](#database)
- [Security](#security)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Overview

DrawRun is a comprehensive sports performance tracking platform that combines scientific training methodologies with modern web technologies. It provides athletes with tools for performance analysis, training plan management, and social features, all while maintaining strict security and data privacy standards.

Key differentiators:
- **Per-user SQLite databases** for complete data isolation
- **Scientific algorithms** based on validated research (Banister model, ACWR, HRV analysis)
- **Multi-platform sync** with Strava, Garmin, Suunto, Polar, Apple Health, and Samsung Health
- **Adaptive coaching engine** with real-time plan adjustments
- **Enterprise-grade security** with AES-256-GCM encryption and 2FA

## Features

### Performance Analytics
- **PMC (Performance Management Chart)** with Fitness, Fatigue, and Form calculations
- **TSS/TRIMP** calculation for various sports
- **VDOT** estimation and training paces
- **HRV (Heart Rate Variability)** analysis
- **Critical Power** modeling
- **Race time predictions**

### Training Management
- Adaptive training plans with AI-driven adjustments
- Session feedback integration
- Missed session handling
- VMA/VO2max testing tools
- External event integration

### Multi-Platform Sync
- **Strava** (OAuth2)
- **Garmin** (credentials-based)
- **Suunto** (v1 & v2)
- **Polar**
- **Apple Health**
- **Samsung Health**
- **Adidas**

### Social Features
- Friends system with request/accept workflow
- Groups and challenges
- Social feed with activity sharing
- Leaderboards
- Chat functionality

### Security & Privacy
- JWT with refresh token rotation
- AES-256-GCM encryption for credentials
- TOTP-based 2FA
- GDPR compliance (export/delete)
- Rate limiting and CORS protection

## Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express 5
- **Database**: SQLite (sql.js) with per-user architecture
- **Authentication**: JWT + Refresh Tokens
- **Logging**: Winston
- **Testing**: Jest (107 tests, 7 suites)
- **Security**: Helmet.js, bcryptjs, express-rate-limit

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: React Query (@tanstack/react-query)
- **Forms**: React Hook Form + Zod
- **Testing**: Vitest + Testing Library
- **UI Components**: Custom components with Lucide icons

### DevOps
- **Process Management**: PM2 (production)
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt (Certbot)
- **Containerization**: Docker support (backend)

## Architecture

### Key Architectural Decisions

1. **Per-User Databases**
   - Each user has their own `user_<email>.db`
   - Shared data in `main.db` (users, refresh tokens, migrations)
   - Complete data isolation between users

2. **LRU Cache**
   - Max 100 open database connections
   - Evicted entries persisted to disk before closing
   - Prevents memory exhaustion

3. **Token Management**
   - Access tokens: 15-minute expiry
   - Refresh tokens: 7-day expiry with rotation
   - Stored in `sessionStorage` (not localStorage)

4. **Scientific Algorithms**
   - Based on peer-reviewed research
   - Banister impulse-response model
   - ACWR (Acute:Chronic Workload Ratio)
   - HRV trend analysis

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/lomicbourlotroche/DrawRun.git
   cd DrawRun
   ```

### Environment Setup

```bash
# Backend configuration
cd backend
cp .env.example .env
# Edit .env with your values (see Configuration section)

# Frontend configuration
cd ../frontend
# Create .env.local with:
# NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Configuration

### Backend (`backend/.env`)

**Required for production:**
```env
# Security (GENERATE THESE!)
JWT_SECRET=openssl rand -base64 64
CREDENTIALS_SECRET=openssl rand -base64 32
BCRYPT_ROUNDS=12

# Server
PORT=3000
NODE_ENV=production

# Database
DATA_DIR=../../DrawRun-Data

# CORS
CORS_ORIGINS=https://yourdomain.com

# Rate Limiting
API_RATE_LIMIT=100
AUTH_RATE_LIMIT=5
```

**Optional integrations:**
```env
# Strava OAuth2
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_CALLBACK_URL=http://localhost:3001/auth/strava/callback

# Email (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM=noreply@yourdomain.com

# 2FA
TOTP_ISSUER=DrawRun

# Redis (optional, falls back to in-memory)
# REDIS_URL=redis://localhost:6379

# Push Notifications
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

Generate secrets:
```bash
openssl rand -base64 64  # For JWT_SECRET
openssl rand -base64 32  # For CREDENTIALS_SECRET
```

## Running the Project

### Development Mode

**Backend (port 3000):**
```bash
cd backend
npm run dev
```
Note: In development mode, the backend runs tests before starting the server.

**Frontend (port 3001):**
```bash
cd frontend
npm run dev
```

Access:
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- Health check: http://localhost:3000/health

### Production Mode

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

## Testing

### Backend (Jest - 107 tests)

```bash
cd backend

# Run all tests
npm test

# Run specific suite
npm test -- --testPathPattern=auth

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

**Test suites:**
- `algorithms.test.js` (55 tests) - Scientific algorithms
- `auth.test.js` (14 tests) - JWT, refresh, encryption
- `crypto.test.js` (5 tests) - AES-256-GCM encrypt/decrypt
- `database.test.js` (12 tests) - LRU cache, migrations
- `validators.test.js` (21 tests) - Input validation
- `routes.test.js` (3 tests) - Route structure
- `routes/activities.test.js` (7 tests) - Activities API

**Property-based tests (fast-check):**
- Property 1-3, 13: LRU cache behavior
- Property 4-7: Token refresh flow
- Property 8-9: Auth store behavior
- Property 10: Error boundary
- Property 11: Credential encryption
- Property 12: Encrypt/decrypt round-trip

### Frontend (Vitest)

```bash
cd frontend

# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# UI mode
npm run test:ui
```

**Test files:**
- `tests/lib/api.test.ts` (26 tests) - ApiClient
- `src/stores/index.test.ts` - Zustand auth store
- `components/providers/ErrorBoundary.test.tsx` - ErrorBoundary

### Linting

```bash
# Backend
cd backend
npm run lint
npm run lint:fix

# Frontend
cd frontend
npm run lint
```

## API Reference

### Authentication Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | - | Login, returns tokens |
| POST | `/api/auth/register` | - | Register new user |
| POST | `/api/auth/refresh` | - | Rotate refresh token |
| POST | `/api/auth/logout` | JWT | Logout |
| POST | `/api/auth/change-password` | JWT | Change password |
| POST | `/api/auth/forgot-password/request` | - | Send OTP |
| POST | `/api/auth/forgot-password/confirm` | - | Reset with OTP |
| POST | `/api/auth/credentials/garmin` | JWT | Save Garmin credentials (encrypted) |
| POST | `/api/auth/credentials/suunto` | JWT | Save Suunto credentials (encrypted) |
| POST | `/api/auth/credentials/strava` | JWT | Save Strava credentials (encrypted) |
| POST | `/api/auth/2fa/setup` | JWT | Generate TOTP secret |
| POST | `/api/auth/2fa/enable` | JWT | Enable 2FA |
| POST | `/api/auth/2fa/disable` | JWT | Disable 2FA |

### Core Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | - | Health check + version |
| GET | `/api/profile` | JWT | Get user profile |
| PUT | `/api/profile` | JWT | Update profile |
| GET | `/api/activities` | JWT | List activities (paginated) |
| POST | `/api/activities/create` | JWT | Create manual activity |
| GET | `/api/pmc` | JWT | PMC data |
| POST | `/api/sync` | JWT | Trigger sync |
| GET | `/api/sync/status` | JWT | Sync status |
| GET | `/api/metrics` | JWT | Performance metrics |
| POST | `/api/metrics/recalculate` | JWT | Recalculate metrics |

### Coach Endpoints

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

### Social Endpoints

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

### Swagger Documentation

Access interactive API documentation at: `http://localhost:3000/api-docs` (when server is running)

## Database

### Architecture

**Main Database (`DrawRun-Data/main.db`):**
- `users` - User accounts
- `refresh_tokens` - Refresh token storage
- `schema_migrations` - Migration tracking

**Per-User Databases (`DrawRun-Data/user_<email>.db`):**
- `activities` - User activities
- `training_plans` - Training plans
- `sessions` - Plan sessions
- `metrics` - Calculated metrics
- `social_*` - Social data

### Migrations

Migrations run automatically at startup. To add a new migration, edit `backend/src/database.js`:

```javascript
{
    version: '003_your_migration_name',
    description: 'Human-readable description',
    up: (db) => {
        try { db.run('ALTER TABLE users ADD COLUMN new_col TEXT'); } catch (_) {}
    },
}
```

### Database Patterns

```javascript
// Main DB operations
const user = await dbGetMain('SELECT * FROM users WHERE id = ?', [userId]);
await dbRunMain('UPDATE users SET ... WHERE id = ?', [...values, userId]);

// User DB operations
const userDb = await getUserDb(userId);
const activities = await dbAllUser(userDb, 'SELECT * FROM activities', []);
await dbRunUser(userDb, 'INSERT INTO activities ...', [...values]);
```

## Security

### Encryption
- **Credentials**: AES-256-GCM encryption before database storage
- **Passwords**: bcrypt hashing (12 rounds)
- **Tokens**: JWT with short-lived access tokens

### Rate Limiting
- API endpoints: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes

### CORS & Headers
- Configurable CORS origins
- Helmet.js security headers
- Content Security Policy (CSP)

### Best Practices
- Never use `console.log` in backend (use Winston logger)
- All sensitive data encrypted before storage
- Parameterized SQL queries (no string concatenation)
- Tokens stored in `sessionStorage` only (not `localStorage`)

## Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

Quick overview:
1. **VPS Setup**: Ubuntu 22.04+, Node.js 18+, Nginx, PM2
2. **Clone & Install**: `git clone`, `npm install --production`
3. **Configure**: Set up `.env` with production values
4. **Start Services**: PM2 for backend and frontend
5. **Reverse Proxy**: Nginx configuration
6. **SSL**: Certbot for Let's Encrypt certificates

### Docker (Backend)

```bash
cd backend
npm run docker:build
npm run docker:run
```

## Project Structure

```
DrawRun-New/
├── backend/                        # Express 5 API
│   ├── index.js                    # Entry point
│   ├── package.json                # v4.1.0
│   ├── .env.example               # Environment template
│   ├── src/
│   │   ├── database.js             # LRU cache, per-user DB, migrations
│   │   ├── auth.js                 # JWT auth, refresh, 2FA, credentials
│   │   ├── auth2fa.js              # TOTP / QR code 2FA
│   │   ├── jwt_tokens.js           # Token generation, verification
│   │   ├── crypto_utils.js         # AES-256-GCM encrypt/decrypt
│   │   ├── logger.js               # Winston logger
│   │   ├── validators.js           # Input validation
│   │   ├── algorithms/             # Scientific algorithms
│   │   │   ├── index.js            # Cardiovascular, PMC, TrainingLoad
│   │   │   ├── tss.js              # TSS/TRIMP calculation
│   │   │   ├── metrics.js          # Calculated metrics
│   │   │   └── sports.js           # Sports management
│   │   ├── routes/                 # API routes
│   │   │   ├── activities.js
│   │   │   ├── coach.js
│   │   │   ├── social.js
│   │   │   ├── profile.js
│   │   │   ├── pmc.js
│   │   │   ├── sync.js
│   │   │   ├── metrics.js
│   │   │   ├── preferences.js
│   │   │   ├── onboarding.js
│   │   │   ├── overtraining.js
│   │   │   └── tss.js
│   │   ├── services/               # External services
│   │   │   ├── strava.js
│   │   │   ├── garmin.js
│   │   │   ├── suunto_sync.js
│   │   │   ├── polar_sync.js
│   │   │   ├── apple_health_sync.js
│   │   │   └── ...
│   │   ├── middleware/             # Express middleware
│   │   │   ├── auth.js             # JWT verification
│   │   │   └── security.js         # Helmet, rate limiting, CORS
│   │   └── utils/                  # Utility functions
│   ├── tests/                      # Jest test suites
│   │   ├── algorithms.test.js      # 55 tests
│   │   ├── auth.test.js            # 14 tests
│   │   ├── crypto.test.js          # 5 tests
│   │   ├── database.test.js        # 12 tests
│   │   ├── validators.test.js      # 21 tests
│   │   ├── routes.test.js          # 3 tests
│   │   └── routes/
│   │       └── activities.test.js  # 7 tests
│   ├── scripts/                    # Utility scripts
│   │   ├── backup.js
│   │   └── restore.js
│   └── logs/                       # Winston log files
│
├── frontend/                       # Next.js 14 App Router
│   ├── app/                        # Next.js app directory
│   │   ├── layout.tsx
│   │   ├── page.tsx                # Landing page
│   │   ├── login/page.tsx
│   │   └── app/                    # Authenticated app
│   │       ├── layout.tsx
│   │       ├── page.tsx            # Dashboard
│   │       ├── activities/
│   │       ├── coach/
│   │       ├── performance/
│   │       ├── profile/
│   │       └── social/
│   ├── components/                 # React components
│   │   ├── ui/                     # Base UI components
│   │   ├── layout/                 # AppLayout, Sidebar, Header
│   │   ├── features/               # Feature components
│   │   │   ├── activities/
│   │   │   ├── auth/
│   │   │   ├── coach/
│   │   │   ├── dashboard/
│   │   │   ├── onboarding/
│   │   │   ├── performance/
│   │   │   └── social/
│   │   └── providers/              # Context providers
│   ├── src/                        # Source code
│   │   ├── lib/                    # Utilities
│   │   │   ├── api.ts              # ApiClient
│   │   │   ├── constants.ts
│   │   │   ├── utils.ts
│   │   │   └── i18n.ts
│   │   ├── types/                   # TypeScript interfaces
│   │   │   ├── index.ts
│   │   │   └── sports.ts
│   │   └── stores/                 # Zustand stores
│   │       └── index.ts
│   ├── tests/                      # Vitest tests
│   │   └── lib/
│   │       └── api.test.ts
│   ├── next.config.js
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── package.json
│
├── DrawRun-Data/                   # SQLite databases (gitignored)
│   ├── main.db                     # Users + migrations
│   └── user_<email>.db             # Per-user data
│
├── AGENTS.md                       # AI agent guidelines
├── DEPLOYMENT.md                   # Deployment guide
└── README.md                       # This file
```

## Contributing

### Code Style

**Backend (JavaScript):**
- `'use strict'` at top of every file
- Async/await (no raw Promises)
- Parameterized SQL queries
- Winston logger (no `console.log`)
- Error responses: `res.status(4xx).json({ error: 'message' })`

**Frontend (TypeScript):**
- Strict mode enabled
- No `any` types
- Import order: React → External → Internal → Relative
- All HTTP calls through `api` from `@/lib/api`
- PascalCase components, camelCase functions

### Agent Guidelines

If you're an AI agent working on this codebase, read [AGENTS.md](AGENTS.md) first. It contains:
- Complete project overview
- Build & run commands
- Critical rules (what to do and what to never do)
- Token & auth flow
- Database patterns
- Testing requirements
- Security checklist

### Pull Request Process

1. Ensure all tests pass (`npm test` in backend, `npm run test` in frontend)
2. Run linters (`npm run lint` in both)
3. Update documentation if needed
4. Create PR with clear description

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Acknowledgments

- Scientific algorithms based on research by Banister, Daniels, Seiler, Gabbett, and others
- Built with modern web technologies: Next.js, Express, SQLite, Tailwind CSS

---

**Version**: 4.1.0  
**Last Updated**: May 2026

For questions or support, please open an issue on GitHub.
