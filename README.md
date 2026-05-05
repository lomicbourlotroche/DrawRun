# DrawRun — Application de Performance Sportive

DrawRun est une application complète de suivi et d'analyse de performances sportives, propulsée par des algorithmes scientifiques avancés. Elle permet la synchronisation avec les principales plateformes sportives et offre un coaching adaptatif personnalisé.

---

## 🚀 Démarrage rapide

```bash
# 1. Backend (API)
cd backend
cp .env.example .env          # Remplir JWT_SECRET et CREDENTIALS_SECRET
npm install
npm run dev                   # http://localhost:3000
                              # Lance les tests automatiquement au démarrage

# 2. Frontend (nouveau terminal)
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                   # http://localhost:3001
```

> **Note** : En développement, le backend exécute automatiquement la suite de tests Jest avant de démarrer. Si un test échoue, le serveur ne démarre pas.

---

## 📋 Prérequis

- Node.js 18+
- npm 8+
- (Optionnel) Redis pour le cache en production

---

## 🏗 Architecture

```
DrawRun-New/
├── backend/          # API Node.js/Express 5 — port 3000
├── frontend/         # Next.js 14 App Router — port 3001
└── DrawRun-Data/     # Bases SQLite (générées automatiquement)
    ├── main.db       # Utilisateurs, tokens, migrations
    └── user_*.db     # Base par utilisateur
```

**Décisions architecturales clés :**
- **Base de données par utilisateur** — isolation complète des données
- **Cache LRU** — max 100 connexions SQLite ouvertes simultanément
- **JWT + Refresh Token** — access token 15 min, refresh token 7 jours avec rotation
- **Chiffrement AES-256-GCM** — tous les credentials tiers chiffrés au repos
- **Migrations formelles** — table `schema_migrations` versionnée

---

## 🎯 Fonctionnalités

### Authentification & Sécurité
- ✅ JWT sécurisé avec refresh token automatique
- ✅ Authentification 2FA (TOTP + QR code)
- ✅ Chiffrement des credentials OAuth (AES-256-GCM)
- ✅ Protection Helmet, Rate Limiting, CORS
- ✅ Conformité RGPD (export/suppression des données)
- ✅ Verrouillage OTP après 3 tentatives échouées

### Gestion des Activités
- ✅ CRUD complet des activités sportives
- ✅ Saisie manuelle d'activités
- ✅ Enregistrement mobile avec GPS et capteurs natifs
- ✅ Import GPX
- ✅ Analyse détaillée (splits, streams, zones)
- ✅ Visualisation cartographique (Leaflet)

### Synchronisation Multi-Plateformes
- ✅ Strava (OAuth2)
- ✅ Garmin Connect
- ✅ Suunto
- ✅ Polar
- ✅ Samsung Health
- ✅ Apple Health
- ✅ Adidas Running

### Algorithmes Scientifiques
- ✅ VDOT (Jack Daniels) — prédictions de course
- ✅ PMC (Performance Management Chart) — CTL, ATL, TSB
- ✅ TSS / TRIMP — charge d'entraînement
- ✅ Zones cardiaques (Karvonen)
- ✅ HRV (Heart Rate Variability)
- ✅ Critical Power (Monod & Scherrer)
- ✅ Détection sur-entraînement
- ✅ Algorithme de Taper
- ✅ Recommandations personnalisées

### Coaching Adaptatif
- ✅ Plans d'entraînement personnalisés (8 à 16 semaines)
- ✅ Ajustement automatique selon les performances
- ✅ Gestion des événements externes (compétitions, vacances)
- ✅ Feedback post-séance avec RPE
- ✅ Tests VMA/VDOT planifiés
- ✅ Gamification (badges, XP, niveaux)

### Fonctionnalités Sociales
- ✅ Système d'amis et demandes
- ✅ Groupes d'entraînement
- ✅ Leaderboards (distance, durée, TSS)
- ✅ Fil d'actualité social
- ✅ Réactions et commentaires
- ✅ Défis et challenges
- ✅ Messagerie entre utilisateurs

### Enregistrement Mobile
- ✅ GPS temps réel (position, vitesse, distance, altitude)
- ✅ Détection automatique de la cadence (pas/min)
- ✅ Baromètre pour dénivelé précis
- ✅ Suivi batterie
- ✅ Pause/Reprise

---

## 🛠 Commandes

### Backend

| Commande | Description |
|----------|-------------|
| `npm run dev` | Développement avec nodemon (tests au démarrage) |
| `npm start` | Production (sans tests au démarrage) |
| `npm test` | Suite complète Jest (107 tests) |
| `npm run test:watch` | Tests en mode watch |
| `npm run test:coverage` | Rapport de couverture |
| `npm run backup` | Sauvegarde des bases SQLite |
| `npm run restore` | Restauration depuis sauvegarde |
| `npm run lint` | ESLint |

### Frontend

| Commande | Description |
|----------|-------------|
| `npm run dev` | Développement (port 3001) |
| `npm run build` | Build production |
| `npm run start` | Serveur production |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (run once) |
| `npm run test:watch` | Vitest watch |
| `npm run storybook` | Storybook (port 6006) |

---

## 🧪 Tests

### Backend — 107 tests, 7 suites

```bash
cd backend
npm test
```

| Suite | Tests | Couverture |
|-------|-------|-----------|
| `algorithms.test.js` | 55 | Algorithmes scientifiques |
| `auth.test.js` | 14 | Auth, refresh endpoint, chiffrement |
| `crypto.test.js` | 5 | AES-256-GCM round-trip |
| `database.test.js` | 12 | Cache LRU, migrations |
| `validators.test.js` | 21 | Validation des entrées |
| `routes.test.js` | 3 | Structure des routes |
| `routes/activities.test.js` | 7 | Endpoints activités |

**13 propriétés de correction formelle** vérifiées par property-based testing (fast-check) :
- Cache LRU : taille, ordre d'éviction, persistance disque
- Refresh token : stockage, retry, logout, concurrence
- Auth store : sessionStorage uniquement, logout complet
- ErrorBoundary : callback onError
- Chiffrement : credentials jamais en clair, round-trip

### Frontend — Vitest

```bash
cd frontend
npm run test
```

Tests : `api.test.ts`, `stores/index.test.ts`, `ErrorBoundary.test.tsx`

---

## 🔒 Sécurité

### Variables d'environnement critiques

```bash
# Générer des secrets sécurisés
openssl rand -base64 64   # → JWT_SECRET
openssl rand -base64 32   # → CREDENTIALS_SECRET
```

### Flux d'authentification

```
Login → { token (15min), refreshToken (7j) }
     → stockés dans sessionStorage (pas localStorage)
     → refresh automatique transparent sur 401
     → rotation du refresh token à chaque utilisation
```

### Logs (Winston)

```
backend/logs/
├── combined.log    # Tous les niveaux
├── error.log       # Erreurs uniquement
├── auth.log        # Événements d'authentification
└── security.log    # Événements de sécurité
```

### Health check

```bash
curl http://localhost:3000/health
```

```json
{
  "status": "running",
  "version": "4.1.0",
  "timestamp": "2026-05-02T...",
  "cache": { "type": "memory", "status": "ok" }
}
```

---

## 📦 Stack Technique

### Backend
| Catégorie | Package | Version |
|-----------|---------|---------|
| Framework | Express | 5.2.1 |
| Base de données | sql.js (SQLite) | 1.10.2 |
| Auth | jsonwebtoken + bcryptjs | 9.0.3 / 2.4.3 |
| 2FA | otpauth | 9.5.0 |
| Sécurité | helmet + express-rate-limit | 8.1.0 / 8.4.0 |
| Logs | winston | 3.19.0 |
| Email | nodemailer | 8.0.1 |
| Tests | jest + @fast-check/jest | 29.7.0 / 2.2.0 |
| Cache | ioredis (optionnel) | 5.3.2 |

### Frontend
| Catégorie | Package | Version |
|-----------|---------|---------|
| Framework | Next.js | 16.2.4 |
| Language | TypeScript (strict) | 5.4.5 |
| Styling | Tailwind CSS | 3.4.3 |
| State global | Zustand | 4.5.2 |
| State serveur | TanStack Query | 5.32.0 |
| Forms | React Hook Form + Zod | 7.51.4 / 3.23.4 |
| Charts | Recharts | 2.12.6 |
| Maps | Leaflet + React Leaflet | 1.9.4 / 4.2.1 |
| Toast | Sonner | 1.4.41 |
| Tests | Vitest + Testing Library | — |

---

## 🗂 Variables d'environnement

Voir `backend/.env.example` pour la liste complète.

Fichiers à créer :
- `backend/.env` (copier depuis `.env.example`)
- `frontend/.env.local` (copier depuis `.env.local.example`)

---

## 📝 Changelog

### v4.1.0 (Backend)
- Architecture per-user database avec cache LRU (100 connexions max)
- Refresh token flow avec rotation automatique
- Système de migrations de schéma formel
- Playwright déplacé en devDependencies
- Tests au démarrage du serveur (développement)
- 107 tests Jest avec 13 propriétés formelles (fast-check)
- Logging unifié via Winston (plus de console.log)

### v1.0.0 (Frontend)
- Next.js 14 App Router avec TypeScript strict
- Intercepteur 401 avec refresh automatique
- Zustand persist sur sessionStorage (plus localStorage)
- ErrorBoundary avec retry et callback onError
- 25 interfaces TypeScript pour coach et social (plus de `any`)
- Enregistreur mobile avec capteurs natifs

---

## 📄 Licence

ISC — DrawRun Team

---

> Pour les guidelines de développement IA, voir [AGENTS.md](./AGENTS.md).
> Pour le déploiement en production, voir [DEPLOYMENT.md](./DEPLOYMENT.md).
