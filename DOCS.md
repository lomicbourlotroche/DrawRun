# DrawRun — Documentation Technique Complète

> **Version :** 4.1.0 | **Stack :** Node.js 18+ / Express 5 / SQLite (sql.js) / Next.js 16 / TypeScript 5 / Tailwind CSS  
> **Ports :** Backend 3000, Frontend 3001

---

## 1. Présentation

DrawRun est une application complète de **suivi de performance sportive** combinant méthodologies d'entraînement scientifiques et technologies web modernes.

**Objectifs :**
- Importer automatiquement les activités depuis Garmin, Strava, Suunto, Decathlon
- Analyser les performances avec des algorithmes scientifiques (VDOT, PMC, TSS, HRV...)
- Générer des plans d'entraînement adaptatifs avec coaching IA
- Connecter les athlètes via un réseau social intégré
- Planifier les courses avec stratégies km par km

---

## 2. Architecture

```
Frontend (Next.js 16 :3001) ←→ Backend (Express 5 :3000) ←→ SQLite (sql.js)
                                  ↕
                            WebSocket (stats temps réel)
```

**Principes architecturaux :**
- **Bases de données par utilisateur** : isolation complète (`user_<email>.db`)
- **Cache LRU** : max 100 connexions DB ouvertes, éviction persistée
- **JWT + Refresh Token** : access 15 min, refresh 7 jours avec rotation
- **AES-256-GCM** : chiffrement des credentials tiers au repos
- **Migrations formelles** : table `schema_migrations` dans `main.db`

---

## 3. Backend — Express 5

### 3.1 Démarrage

`backend/index.js` initialise dans l'ordre :
1. `dotenv` + vérification `JWT_SECRET`
2. Tests Jest (sauf en production)
3. `initMainDb()` + migrations
4. Cache service + VAPID keys
5. Middleware (Helmet, CORS, Rate Limiting)
6. Montage des routes
7. WebSocket pour compteur utilisateurs
8. Démarrage serveur HTTP

### 3.2 Routes API (62+ endpoints)

#### Auth (`/api/auth`)
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/login` | Connexion (email+password+TOTP) |
| POST | `/register` | Inscription |
| POST | `/refresh` | Rotation refresh token |
| POST | `/logout` | Déconnexion |
| POST | `/change-password` | Changement mot de passe |
| POST | `/forgot-password/request` | OTP email |
| POST | `/forgot-password/confirm` | Réinitialisation |
| POST | `/credentials/garmin` | Credentials Garmin (chiffrés) |
| POST | `/credentials/suunto` | Credentials Suunto |
| POST | `/credentials/strava` | Credentials Strava |
| POST | `/2fa/setup` | Génération secret TOTP |
| POST | `/2fa/enable` | Activation 2FA |
| POST | `/2fa/disable` | Désactivation 2FA |
| POST | `/delete_account` | Suppression compte |

#### Activités (`/api/activities`)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/` | Liste paginée (filtres : type, date) |
| POST | `/create` | Création manuelle |
| GET | `/:id` | Détail activité |
| GET | `/:id/streams` | Données temps réel (FC, GPS, puissance...) |
| GET | `/:id/splits` | Splits km/mile |
| POST | `/:id/upload` | Upload GPX/TCX/FIT/CSV/ZIP |
| GET | `/:id/weather` | Météo activité |
| GET | `/:id/share-image` | Image de partage |
| GET | `/supported-formats` | Formats supportés |

#### Algorithmes (`/api/algo`)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/zones` | Zones FC (Karvonen, %FCM), allures |
| GET | `/vdot` | VDOT + prédictions course |
| GET | `/pmc` | CTL/ATL/TSB/ACWR/Monotonie/Strain |
| GET | `/recommendations` | Recommandation personnalisée |
| GET | `/polarization` | Distribution 80/20 |
| GET | `/hrv` | Analyse HRV récupération |
| GET | `/taper` | Plan de tapering optimal |
| GET | `/overtraining` | Risque surentraînement |
| GET | `/critical-power` | CP/W' + FTP |
| GET | `/tss` | TSS (Coggan) + TRIMP (Edwards) |
| GET | `/readiness` | Score de forme |
| GET | `/health` | Statut santé global |
| GET | `/constants` | Constantes scientifiques |
| GET | `/sports` | Sports supportés |
| POST | `/analyze` | Analyse complète activité |

#### Coach (`/api/coach`)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/profile` | Profil coach |
| GET | `/wizard-defaults` | Pré-remplissage wizard |
| POST | `/start-plan` | Création plan adaptatif |
| POST | `/plan` | Génération plan (legacy) |
| POST | `/generate-plan` | Génération plan (frontend) |
| GET | `/plan` | Plan actif |
| GET | `/plan/today` | Séance du jour |
| GET | `/plan/:id` | Détail plan |
| GET | `/progress/:id` | Progression plan |
| POST | `/plan-feedback` | Feedback séance |
| POST | `/session-missed` | Séance manquée |
| POST | `/schedule-test` | Planification test VMA |
| POST | `/submit-test-results` | Résultats test |
| POST | `/external-event` | Événement externe |
| POST | `/match-activity` | Associer activité à séance |
| GET | `/pending-sessions` | Séances en attente |
| GET | `/sessions/upcoming` | Séances à venir |
| GET | `/plan/weekly-summary` | Résumé hebdomadaire |
| GET | `/gamification/:id` | XP, badges, niveaux |

#### Social (`/api/social`)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/friends` | Liste amis |
| POST | `/friends/request` | Demande d'ami |
| POST | `/friends/accept` | Accepter |
| POST | `/friends/reject` | Refuser |
| POST | `/friends/remove` | Supprimer |
| GET | `/friends/pending` | Demandes en attente |
| GET | `/friends/suggestions` | Suggestions |
| GET | `/feed` | Fil d'actualité |
| GET | `/leaderboard` | Classement |
| POST | `/groups` | Créer groupe |
| GET | `/groups` | Liste groupes |
| GET | `/groups/:id` | Détail groupe |
| POST | `/groups/:id/join` | Rejoindre |
| POST | `/groups/:id/leave` | Quitter |
| POST | `/groups/:id/events` | Créer événement |
| POST | `/challenges` | Créer défi |
| GET | `/challenges/public` | Défis publics |
| POST | `/challenges/:id/join` | Rejoindre défi |
| POST | `/activities/:id/like` | Like |
| POST | `/activities/:id/comments` | Commentaire |
| POST | `/conversations` | Créer conversation |
| GET | `/conversations/:id/messages` | Messages |

#### Explore (`/api/explore`)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/segments` | Segments à proximité |
| POST | `/segments` | Créer segment |
| GET | `/segments/:id` | Détail segment |
| GET | `/segments/:id/leaderboard` | Classement |
| POST | `/segments/:id/efforts` | Effort segment |
| GET | `/routes` | Routes publiques |
| POST | `/routes` | Créer route |
| GET | `/routes/:id` | Détail route |
| POST | `/routes/:id/favorite` | Favori |
| GET | `/heatmap` | Données heatmap |
| GET | `/heatmap/popular` | Segments populaires |
| POST | `/community/traces` | Partager trace |
| GET | `/elevation` | Profil élévation |

#### Synchronisation (`/api/sync`)
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/` | Déclencher sync (Garmin+Decathlon+Suunto) |
| GET | `/job/:id` | Statut job |
| GET | `/status` | Statut intégrations |
| POST | `/garmin/clear-tokens` | Supprimer tokens Garmin |
| POST | `/decathlon/clear-tokens` | Supprimer tokens Decathlon |
| POST | `/suunto/clear-tokens` | Supprimer tokens Suunto |

#### Autres
| Méthode | Route | Description |
|---------|-------|-------------|
| GET/PUT | `/api/profile` | Profil utilisateur |
| POST | `/api/profile/avatar` | Upload avatar |
| GET | `/api/pmc` | PMC historique |
| GET | `/api/metrics` | Métriques (CTL/ATL/TSB) |
| POST | `/api/metrics/recalculate` | Recalcul |
| POST | `/api/metrics/hrv` | Enregistrer HRV |
| POST | `/api/metrics/sleep` | Enregistrer sommeil |
| GET/PUT | `/api/preferences` | Préférences |
| POST | `/api/preferences/widgets` | Widgets dashboard |
| GET | `/api/onboarding/status` | Statut onboarding |
| POST | `/api/onboarding/complete` | Étape complète |
| GET | `/api/overtraining/check` | Vérification surentraînement |
| GET | `/api/user/constants` | Constantes unifiées |
| CRUD | `/api/gear` | Gestion matériel |
| POST | `/api/race-planning/calculate` | Stratégie course |
| POST | `/api/race-planning/save` | Sauvegarder plan |
| GET | `/api/notifications/vapid-key` | Clé VAPID publique |
| POST | `/api/notifications/subscribe` | S'abonner push |
| GET | `/api/stats/users` | Utilisateurs actifs |
| GET | `/api/user-counter` | Compteur public |
| GET | `/health` | Health check |

### 3.3 Middleware

| Module | Rôle |
|--------|------|
| `auth.js` | `verifyToken` — validation JWT |
| `validation.js` | Validation entrées |
| `cache.js` | Cache in-memory/Redis |
| `performance.js` | Compression gzip, métriques |
| `security/helmet.js` | Helmet CSP |
| `security/cors.js` | CORS fail-closed |
| `security/headers.js` | Headers sécurité |
| `security/rateLimit.js` | Rate limiting (5-100 req/min) |

### 3.4 Algorithmes (21 modules)

| Module | Fonction | Référence |
|--------|----------|-----------|
| Cardiovascular | FC max (Tanaka), zones Karvonen | Tanaka 2001 |
| RunningPerformance | VDOT, allures Daniels, prédictions | Daniels 2021 |
| TrainingLoad | TSS (Coggan), TRIMP (Edwards) | Coggan 2006 |
| PMC | CTL/ATL/TSB, ACWR, readiness | Banister 1975, Gabbett 2016 |
| Polarization | Indice polarisation 80/20 | Seiler 2006 |
| HRV | Récupération, stress score | Esco 2025 |
| CriticalPower | CP/W', FTP | Poole 2016 |
| Overtraining | Détection OTS (7 indicateurs) | Meeusen 2013 |
| Taper | 4 styles de tapering | Mujika 2003 |
| RaceStrategy | Stratégie course, splits | — |
| Biomechanics | Oscillation, temps contact, raideur | — |
| RunningPower | Puissance en course | Støren 2008 |
| SleepOptimization | Optimisation sommeil | — |
| AltitudeTraining | LHTH, effet altitude | — |
| Nutrition | Stratégie nutrition compétition | — |
| EnvironmentalImpact | Correction météo | — |

---

## 4. Frontend — Next.js 16

### 4.1 Pages

**Publiques :** `/`, `/login`, `/garmin`, `/auth/decathlon/callback`, `/guides/*`

**Authentifiées (`/app`) :**
- `/dashboard` — PMC, readiness, activités récentes
- `/activities` — Liste + détail + création
- `/coach` — Plans adaptatifs + race planner
- `/explore` — Carte, segments, routes
- `/performance` — Métriques + analyse puissance
- `/social` — Fil, amis, groupes, défis, classement
- `/profile` — Profil + paramètres
- `/record` — Enregistrement activité
- `/gear` — Gestion matériel
- `/race-planning` — Planification course

### 4.2 Composants Principaux

**UI :** Button, Card, Input, Modal, Skeleton, Badge, Avatar, Dialog, GlassCard

**Dashboard :** ModernDashboard, PmcChart, QuickStats, ReadinessCard, OvertrainingAlert, InjuryRiskCard

**Activités :** ActivityList, MobileActivityRecorder, LiveMap, SportPicker, 5 analyse cards (Run/Ride/Swim/Trail/Simple)

**Coach :** AdaptivePlanWizard (6 étapes), SessionFeedback, GamificationWidget, TaperingChart, TestScheduler

**Social :** SocialHub (5 onglets), ChallengeWizard, Chat, CommentModal

**Explore :** ExploreMap (Leaflet), ElevationProfile, RoutePlanner, HeatmapLayer, Segments

### 4.3 API Client

`frontend/src/lib/api/` — 21 modules spécialisés :
- `client.ts` : gestion tokens, refresh queue, intercepteurs
- Modules domaine : auth, activities, algo, coach, social, explore, sync, gear, metrics, notifications, race-planning, profile, share, weather, user-constants, user-counter, onboarding

### 4.4 Stores (Zustand)

- `useAuthStore` : token, refreshToken, user, login/logout
- `useDashboardStore` : readiness, pmcData, activities, loading
- Stockage : sessionStorage via `createJSONStorage`

---

## 5. Fonctionnalités Détaillées

### 5.1 Authentification
- **JWT** : 15 min access + 7 jours refresh (rotation)
- **2FA** : TOTP avec QR code
- **OTP** : email pour réinitialisation (lockout DB)
- **Credentials tiers** : AES-256-GCM
- **Stockage** : sessionStorage uniquement

### 5.2 PMC (Performance Management Chart)
- Modèle Banister : CTL (42j), ATL (7j), TSB = CTL - ATL
- ACWR : rapport charge aiguë/chronique (risque blessure)
- Readiness : combinaison TSB + HRV + sommeil + FC repos
- Monotonie + Strain

### 5.3 Coaching Adaptatif
- Plan personnalisé via wizard (objectif, niveau, volume, jours, temps)
- Périodisation : base → développement → spécifique → affûtage
- Adaptation selon feedback séance
- Gestion événements externes
- Gamification : XP, badges (4), niveaux (5), streaks
- Tests VMA/VO2max programmés

### 5.4 Synchronisation
- **Garmin** : bridge Python (garth), credentials chiffrés, sync incrémentale, métriques santé (HRV, sommeil, stress, SpO2, poids, VO2max)
- **Decathlon** : OAuth2
- **Suunto** : API reverse-engineered v1&v2
- **Strava** : OAuth2 via Playwright
- Job asynchrone avec polling

### 5.5 Social
- **Amis** : demandes, acceptation, suggestions
- **Groupes** : publics/privés, invitations, événements
- **Défis** : personnalisés, équipes, progression
- **Engagement** : likes, commentaires, réactions
- **Messagerie** : conversations individuelles et de groupe
- **Badges/XP** : gamification sociale

### 5.6 Explore
- **Segments** : création, proximité, efforts, leaderboard
- **Routes** : création, favoris, notation, profil élévation
- **Carte** : Leaflet, heatmap, traces communautaires, localisation

### 5.7 Race Planning
- Stratégie km par km avec import GPX
- Correction environnementale (température, vent, altitude)
- Strategy Bias (negative ↔ positive split)
- Prédictions multi-modèles (VDOT, Riegel, dynamique)
- Analyse TSB + fatigue
- Nutrition + zones FC

### 5.8 Météo
- Open-Meteo API, cache local, 30 codes WMO
- Impact allure calculé

### 5.9 Share Image
- Génération Canvas (Node.js), 3 tailles, dégradés par sport
- Cache 1h, nettoyage périodique

### 5.10 Compteur Temps Réel
- WebSocket, utilisateurs actifs 30 min, mise à jour 30s

---

## 6. Base de Données

**main.db :** users, refresh_tokens, user_credentials, schema_migrations, activity_shares

**user_<email>.db :** 30+ tables :
- Activités : activities, activity_streams, activity_splits, weather_cache
- Coach : training_plans, training_sessions, training_weeks
- Métriques : pmc_history, performance_metrics
- Explore : segments, segment_efforts, routes, route_favorites, community_traces
- Social : friends, social_groups, challenges, activity_likes, conversations, messages
- Autres : gear, user_preferences, push_subscriptions, user_badges, user_xp

---

## 7. Sécurité

| Mesure | Implémentation |
|--------|---------------|
| Mots de passe | bcryptjs 12 rounds |
| Tokens JWT | 15 min access + 7 jours refresh + rotation |
| Stockage | sessionStorage uniquement |
| Chiffrement | AES-256-GCM (credentials tiers) |
| 2FA | TOTP (OTPAuth) |
| Rate limiting | 5-100 req/min selon endpoint |
| CORS | Fail-closed en production |
| CSP | Helmet avec reporting |
| SQLi | Requêtes paramétrées uniquement |
| Validation | Zod backend + types stricts |
| Logs | Winston (security.log, auth.log) |

---

## 8. Tests

**Backend (Jest) :** 210+ tests, 13 suites
- Algorithmes (55), Extended (13), Auth (14), Crypto (5), Database (12)
- Validators (21), Routes (3), Activities (7), Explore (9), Sync (12)
- Performance (15), Race Planning (14), Metrics Calculator (30)
- Property-based : fast-check (LRU, tokens, crypto, migrations)

**Frontend (Vitest) :** 421+ tests
- API client, stores, composants UI/features, hooks, E2E (Playwright)

---

## 9. Déploiement

```bash
# Développement
cd backend && npm run dev    # Port 3000
cd frontend && npm run dev   # Port 3001

# Production
cd backend && npm start
cd frontend && npm run build && npm start

# Docker
cd backend && npm run docker:build && npm run docker:run

# PM2
pm2 start backend/index.js --name drawrun-backend
```

**CI/CD :** GitHub Actions (ci.yml, deploy.yml)

**Sauvegarde :** `npm run backup` / `npm run restore`

---

> **Généré le :** 4 juin 2026 | **Source :** Analyse exhaustive du code DrawRun v4.1.0
