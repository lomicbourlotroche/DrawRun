# DrawRun Architecture Documentation

## Overview

DrawRun is a full-stack sports performance tracking application with a focus on scientific training algorithms and per-user data isolation.

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Data Layer    │
│   (Next.js)     │◄──►│   (Express)     │◄──►│   (SQLite)      │
│   Port: 3001    │    │   Port: 3000    │    │   Per-User DB   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Core Architectural Decisions

### 1. Per-User Database Architecture

**Rationale**: Complete data isolation and scalability
- `main.db`: Users, authentication, refresh tokens
- `user_{email}.db`: Individual user data
- LRU Cache: Max 100 concurrent DB connections

**Benefits**:
- GDPR compliance by design
- Easy data export/deletion
- Horizontal scaling potential
- Multi-tenant isolation

### 2. Scientific Algorithm Foundation

**Base**: Peer-reviewed sports science research
- Banister Impulse-Response Model (1975)
- Jack Daniels VDOT system (2021)
- Gabbett ACWR injury prevention (2016)
- Seiler Polarization training (2006)

**Implementation**: 3,168 lines of validated algorithms

### 3. Security-First Design

**Layers**:
- AES-256-GCM encryption for credentials
- JWT with refresh token rotation
- 2FA TOTP support
- Rate limiting per user type
- Comprehensive audit logging

## Frontend Architecture

### Technology Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS
- **State**: Zustand + persist
- **Data Fetching**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod validation
- **Testing**: Vitest + Playwright E2E

### Key Patterns

#### 1. Modular API Client
```typescript
// Modular imports by domain
import { authApi, activitiesApi } from '@/lib/api';
```

#### 2. Type-Safe State Management
```typescript
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
}
```

#### 3. Component Architecture
- `components/ui/`: Base UI components
- `components/features/`: Business logic components
- `components/layout/`: Layout components

## Backend Architecture

### Technology Stack
- **Runtime**: Node.js 18+
- **Framework**: Express 5
- **Database**: SQLite (sql.js) with per-user architecture
- **Authentication**: JWT + bcrypt
- **Monitoring**: OpenTelemetry + Prometheus + Jaeger
- **Testing**: Jest with property-based testing

### Core Modules

#### 1. Database Layer (`src/database.js`)
```javascript
// LRU Cache for user DB connections
const userDbCache = new Map();
const LRU_MAX_SIZE = 100;

// Per-user database access
async function getUserDb(userId) {
  // Cache management with eviction
}
```

#### 2. Authentication (`src/auth.js`)
```javascript
// JWT with refresh token rotation
const accessToken = generateAccessToken(userId);
const refreshToken = await rotateRefreshToken(userId);
```

#### 3. Scientific Algorithms (`src/algorithms/`)
```javascript
// Banister Model constants
const SCIENTIFIC_CONSTANTS = {
  PMC: {
    TAU_FITNESS_DEFAULT: 42,    // days
    TAU_FATIGUE_DEFAULT: 7,     // days
    ALPHA_FITNESS: 1 - Math.exp(-1 / 42),
    ALPHA_FATIGUE: 1 - Math.exp(-1 / 7),
  }
};
```

### Service Architecture

#### 1. Social Service (Refactored)
```
src/services/social/
├── friends.service.js    # Friend relationships
├── groups.service.js     # User groups
├── feed.service.js       # Social feed
└── index.js             # Unified exports
```

#### 2. Cache Service
```javascript
// Hybrid Redis + LRU fallback
class CacheService {
  async init() {
    try {
      this.redis = await redisClient.connect();
    } catch {
      this.useRedis = false; // Fallback to LRU
    }
  }
}
```

## Data Flow

### 1. Authentication Flow
```
Frontend → Backend → main.db (users table)
           ↓
    JWT + Refresh Token → SessionStorage
           ↓
    Auto-refresh on expiry
```

### 2. Activity Sync Flow
```
Strava/Garmin → Backend → user_{email}.db
           ↓
    Metrics Calculation → PMC/VDOT updates
           ↓
    Real-time dashboard updates
```

### 3. Social Features Flow
```
User Action → Social Service → main.db (friends/groups)
           ↓
    Feed updates → Push notifications
           ↓
    Real-time timeline updates
```

## Security Architecture

### 1. Data Encryption
```javascript
// AES-256-GCM for third-party credentials
function encrypt(text) {
  const key = getEncryptionKey(); // PBKDF2 derived
  const iv = crypto.randomBytes(16);
  // ... encryption logic
}
```

### 2. Authentication Layers
- **Password**: bcrypt with 12 rounds
- **Session**: JWT (15min) + Refresh (7 days)
- **2FA**: TOTP with backup codes
- **API**: Rate limiting by endpoint type

### 3. Audit Trail
```javascript
function auditLog(action, userId, details) {
  logger.info(`AUDIT: ${action}`, {
    action, userId, timestamp, ip, userAgent, ...details
  });
}
```

## Performance Architecture

### 1. Database Optimization
- **Connection Pooling**: LRU cache with 100 max connections
- **Query Optimization**: Prepared statements
- **Index Strategy**: Primary keys on user_id + timestamps

### 2. Caching Strategy
- **Redis**: Production cache for sessions/frequent data
- **LRU**: Development fallback
- **Browser**: Service Worker for API responses

### 3. Frontend Optimization
- **Code Splitting**: Per-route chunks
- **Bundle Analysis**: Webpack optimization
- **Image Optimization**: Next.js Image component

## Monitoring & Observability

### 1. OpenTelemetry Integration
```javascript
// Distributed tracing
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'drawrun-backend',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});
```

### 2. Metrics Collection
- **Prometheus**: Application metrics
- **Jaeger**: Distributed tracing
- **Winston**: Structured logging

### 3. Health Checks
```javascript
app.get('/health', async (req, res) => {
  const status = await checkDatabaseHealth();
  res.json({ status, timestamp: new Date().toISOString() });
});
```

## Testing Architecture

### 1. Backend Testing (Jest)
- **Unit Tests**: 107 tests covering core algorithms
- **Integration Tests**: API endpoints with mocked dependencies
- **Property-Based**: FastCheck for edge cases

### 2. Frontend Testing (Vitest)
- **Unit Tests**: Component testing with Testing Library
- **Integration Tests**: API client testing
- **E2E Tests**: Playwright for critical user flows

### 3. Test Coverage
- **Backend**: 95%+ coverage on core modules
- **Frontend**: 90%+ coverage on business logic
- **E2E**: Critical paths (auth, dashboard, activities)

## Deployment Architecture

### 1. Production Setup
```
Nginx (Reverse Proxy) → Node.js (PM2) → SQLite (Per-user)
                      ↓
                Prometheus + Grafana
                      ↓
                    Jaeger
```

### 2. Process Management
```javascript
// PM2 ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'drawrun-backend',
      script: './backend/index.js',
      max_memory_restart: '512M',
      restart_delay: 3000,
    }
  ]
};
```

### 3. CI/CD Pipeline
- **GitHub Webhook**: Auto-deploy on main branch
- **Health Checks**: Post-deployment verification
- **Rollback**: Automatic on failure

## Scalability Considerations

### 1. Database Scaling
- **Vertical**: More memory for LRU cache
- **Horizontal**: Shard users across multiple servers
- **Migration Path**: PostgreSQL for high-scale scenarios

### 2. Frontend Scaling
- **CDN**: Static asset delivery
- **Edge Computing**: Geographic distribution
- **Micro-Frontends**: Feature-based splitting

### 3. API Scaling
- **Rate Limiting**: Per-user throttling
- **Caching**: Multi-layer strategy
- **Load Balancing**: Multiple backend instances

## Development Workflow

### 1. Local Development
```bash
# Backend
cd backend && npm run dev

# Frontend  
cd frontend && npm run dev

# Tests
npm run test:all
```

### 2. Code Quality
- **ESLint**: Security + node plugins
- **Prettier**: Code formatting
- **TypeScript**: Strict mode
- **Husky**: Pre-commit hooks

### 3. Documentation
- **API Docs**: Swagger/OpenAPI
- **Code Comments**: JSDoc for functions
- **Architecture**: This documentation

## Future Enhancements

### 1. Technology Upgrades
- **Database**: PostgreSQL migration path
- **Frontend**: React Server Components
- **Monitoring**: Custom dashboards

### 2. Feature Expansion
- **Real-time**: WebSocket integration
- **Mobile**: React Native app
- **AI**: Machine learning recommendations

### 3. Performance Optimizations
- **Caching**: Redis Cluster
- **Database**: Read replicas
- **CDN**: Global distribution

---

This architecture documentation serves as the authoritative guide for understanding DrawRun's technical foundation and design decisions.
