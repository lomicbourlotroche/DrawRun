# DEPLOYMENT.md — DrawRun VPS

> Documentation de référence pour le déploiement et la maintenance de DrawRun en production.
> **Mise à jour : 1er juin 2026** (après déploiement du redesign complet)

---

## 1. Informations du VPS

| Paramètre | Valeur |
|-----------|--------|
| **IP** | `37.69.94.253` |
| **Port SSH** | `20708` |
| **Utilisateur** | `drawrun` |
| **Mot de passe** | `0708` |
| **OS** | Ubuntu 24.04.4 LTS (Noble Numbat) |
| **RAM** | 7.7 Go |
| **Disque** | 98 Go (LVM) |
| **Domaine** | `drawrun.fr` / `www.drawrun.fr` |
| **SSL** | Let's Encrypt (Certbot) |

### Connexion SSH

```bash
ssh drawrun@37.69.94.253 -p 20708
# Mot de passe: 0708
```

---

## 2. Stack installée sur le VPS

| Outil | Version | Statut |
|-------|---------|--------|
| Node.js | 20.20.2 | ✅ |
| npm | 11.13.0 | ✅ |
| PM2 | 6.0.14 | ✅ |
| Nginx | 1.24.0 | ✅ |
| Git | 2.43.0 | ✅ |
| Python | 3.12.3 | ✅ (pour Garmin sync) |

---

## 3. Structure des fichiers sur le VPS

```
/home/drawrun/
├── app/                          # Repo git cloné
│   ├── backend/
│   │   ├── index.js
│   │   ├── .env                  # Variables d'environnement (ne pas committer)
│   │   ├── node_modules/        # Dépendances backend (installées avec npm install --omit=dev)
│   │   ├── package.json          # Inclut: compression, xmldom, fit-file-parser, multer
│   │   └── src/
│   │       └── middleware/
│   │           └── performance.js # Utilise require('compression')
│   │       └── services/
│   │           └── activityParser.service.js # Utilise xmldom, fit-file-parser
│   │       └── routes/
│   │           └── activities.js  # Utilise multer
│   │
│   ├── frontend/
│   │   ├── .next/                # Build Next.js (généré par npm run build)
│   │   ├── .env.local            # NEXT_PUBLIC_API_URL=https://drawrun.fr
│   │   ├── node_modules/        # Dépendances frontend
│   │   └── ...
│   │
│   ├── ecosystem.config.js       # Config PM2 (MIS A JOUR: cwd = backend/)
│   └── logs/                     # Logs de déploiement
│
└── DrawRun-Data/                 # Bases SQLite (hors git, persistantes)
    ├── main.db                   # Users, refresh_tokens, migrations
    └── user_*.db                 # Données par utilisateur
```

> ⚠️ **IMPORTANT** : 
> - `DrawRun-Data/` est **hors du repo git** — ne JAMAIS supprimer ce dossier
> - `ecosystem.config.js` a été modifié : `cwd: '/home/drawrun/app/backend'` (pas `/home/drawrun/app`)

---

## 4. Configuration PM2 — CORRIGÉE

**Problème résolu (juin 2026)** : Le backend crashait au démarrage avec `Cannot find module 'compression'` car le working directory était incorrect.

### Ancienne configuration (❌ PROBLÉMATIQUE)
```javascript
{
  name: 'drawrun-backend',
  script: './backend/index.js',  // Requiert compression depuis backend/src/middleware/performance.js
  cwd: '/home/drawrun/app',      // ❌ Working directory = /home/drawrun/app
  // Node.js ne trouvait pas node_modules/compression car il cherchait dans /home/drawrun/app/node_modules/
}
```

### Nouvelle configuration (✅ CORRIGÉE)
```javascript
module.exports = {
  apps: [
    {
      name: 'drawrun-backend',
      script: 'index.js',              // Script relatif au cwd
      cwd: '/home/drawrun/app/backend', // ✅ Working directory = /home/drawrun/app/backend
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      max_memory_restart: '512M',
      restart_delay: 3000,
      max_restarts: 5,
      watch: false,
    },
    {
      name: 'drawrun-frontend',
      script: './node_modules/.bin/next',
      cwd: '/home/drawrun/app/frontend',
      args: 'start --port 3001',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      max_memory_restart: '512M',
      restart_delay: 3000,
      max_restarts: 5,
      watch: false,
    },
  ],
};
```

> **Pourquoi ça marche maintenant** :
> - Le backend démarre depuis `/home/drawrun/app/backend/` 
> - `require('compression')` trouve `/home/drawrun/app/backend/node_modules/compression/`
> - Tous les modules natifs (xmldom, fit-file-parser, multer) sont accessibles

### Commandes PM2

```bash
# Voir le statut
pm2 list

# Logs en temps réel
pm2 logs drawrun-backend --lines 50
pm2 logs drawrun-frontend --lines 50

# Redémarrer (après un git pull)
pm2 delete all
pm2 start ecosystem.config.js
pm2 save

# Redémarrer rapide (si déjà configuré)
pm2 restart all

# Monitorer CPU/RAM
pm2 monit
```

**Logs PM2** stockés dans `/home/drawrun/.pm2/logs/`.

---

## 5. Configuration Nginx

Fichier : `/etc/nginx/sites-enabled/drawrun`

```nginx
server {
    listen 80;
    server_name drawrun.fr www.drawrun.fr;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name drawrun.fr www.drawrun.fr;

    ssl_certificate /etc/letsencrypt/live/drawrun.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/drawrun.fr/privkey.pem;

    # Health check
    location = /health {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Webhook
    location = /webhook {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API Backend
    location ~ ^/(api|auth)/ {
        add_header 'Access-Control-Allow-Origin' '$http_origin' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend Next.js
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
    }
}
```

```bash
# Tester la config
sudo nginx -t

# Recharger sans coupure
sudo systemctl reload nginx
```

---

## 6. Déploiement — Procédure complète

### ⚠️ **PRÉ-REQUIS LOCAUX**
Avant tout push, vérifier que :
1. **Aucun fichier temporaire** dans le repo (`.zip`, `.tgz`, fichiers de build)
2. **Toutes les dépendances** sont dans `backend/package.json`
3. **Le .gitignore** est à jour (voir section 13)

### Étapes à exécuter

#### Phase 1 : Préparation locale (sur ta machine Windows)
```bash
cd C:\Users\lomic\Dev\DrawRun-New

# Vérifier les changes
git status

# Si des fichiers temporaires sont présents (ex: *.zip, *.tgz)
# Les supprimer et les ajouter au .gitignore
echo "*.zip" >> .gitignore
echo "*.tgz" >> .gitignore
git rm --cached <fichier-temporaire>
git add .gitignore
git commit -m "chore: clean temp files"

# Commit et push
git add .
git commit -m "<description des changes>"
git push origin main
```

#### Phase 2 : Connexion au VPS
```bash
ssh drawrun@37.69.94.253 -p 20708
# Mot de passe: 0708
```

#### Phase 3 : Mise à jour du code
```bash
cd /home/drawrun/app

# Sauvegarder les modifications locales (ex: next-env.d.ts)
git stash

# Récupérer le code
git pull origin main
```

#### Phase 4 : Backend
```bash
cd backend

# Installer les dépendances (production only)
npm install --omit=dev

# Vérifier que les nouveaux modules sont installés
ls node_modules | grep -E 'xmldom|fit-file-parser|multer|compression'

cd ..
```

#### Phase 5 : Frontend
```bash
cd frontend

# Installer les dépendances (PAS npm ci, car package-lock.json est gitignored)
npm install

# Builder le frontend (Next.js)
npm run build

cd ..
```

#### Phase 6 : Redémarrage des services
```bash
# Supprimer les anciens processus (nécessaire si ecosystem.config.js a changé)
pm2 delete all

# Démarrer avec la nouvelle configuration
pm2 start ecosystem.config.js
pm2 save

# Vérifier le statut
pm2 list
```

#### Phase 7 : Vérification
```bash
# Health check backend
curl http://localhost:3000/health

# Réponse attendue:
# {"status":"running","message":"DrawRun API Server is running. 🚀","version":"4.1.0",...}

# Vérifier le frontend
curl -I http://localhost:3001
# Réponse attendue: HTTP/1.1 200 OK
```

---

## 7. 📦 Dépendances ajoutées (juin 2026)

Le commit `625400c` (redesign complet) a ajouté de nouveaux fichiers qui nécessitaient des dépendances manquantes :

| Fichier | Module manquant | Solution | Commit |
|--------|-----------------|----------|--------|
| `backend/src/middleware/performance.js` | `compression` | Déjà dans package.json, mais NODE_PATH incorrect | - |
| `backend/src/services/activityParser.service.js` | `xmldom` | Ajouté dans package.json | `dd112ee` |
| `backend/src/services/activityParser.service.js` | `fit-file-parser` | Ajouté dans package.json | `dd112ee` |
| `backend/src/routes/activities.js` | `multer` | Ajouté dans package.json | `f4d2fae` |

### backend/package.json — Dépendances critiques
```json
{
  "dependencies": {
    "compression": "^1.8.1",      // Utilisé dans performance.js
    "xmldom": "^0.6.0",          // Utilisé dans activityParser.service.js (GPX/TCX)
    "fit-file-parser": "^2.2.0", // Utilisé dans activityParser.service.js (FIT files)
    "multer": "^1.4.5-lts.1",     // Utilisé dans activities.js (upload de fichiers)
    // ... autres dépendances
  }
}
```

---

## 8. Dépendances des scripts de synchronisation

DrawRun synchronise les activités depuis 4 sources externes. Chacune a ses propres dépendances.

---

### 7.1 Garmin — Python + garminconnect + garth

**Mécanisme :** script Python `backend/scripts/garmin_api.py` appelé via `child_process.spawn`.

| Dépendance | Type | Statut VPS |
|-----------|------|-----------|
| `python3` | Système | ✅ Python 3.12.3 |
| `garminconnect` | pip | ✅ v0.3.3 |
| `garth` | pip | ✅ v0.8.0 (installé mai 2026) |
| `requests` | pip | ✅ v2.31.0 |

**Installation (si réinstallation) :**
```bash
pip3 install garminconnect garth requests --break-system-packages
```

> `--break-system-packages` est nécessaire sur Ubuntu 24.04 (PEP 668).

**Tokens stockés dans :** `/home/drawrun/app/backend/data/garmin_tokens/<userId>/`

---

### 7.2 Strava — Playwright (scraping web)

**Mécanisme :** Playwright Node.js avec Chromium headless — scrape le site web Strava avec email/password (pas d'API officielle).

| Dépendance | Type | Statut VPS |
|-----------|------|-----------|
| `playwright` | npm (backend) | ✅ installé dans `node_modules` |
| Chromium headless | Playwright browser | ✅ téléchargé dans `/home/drawrun/.playwright/` |
| `PLAYWRIGHT_BROWSERS_PATH` | env var | ✅ `/home/drawrun/.playwright` dans `.env` |

**Installation (si réinstallation) :**
```bash
cd /home/drawrun/app/backend
npm install playwright

# Télécharger Chromium dans le home (sans sudo)
PLAYWRIGHT_BROWSERS_PATH=/home/drawrun/.playwright npx playwright install chromium

# Ajouter dans backend/.env
echo "PLAYWRIGHT_BROWSERS_PATH=/home/drawrun/.playwright" >> .env
```

> Playwright est dans les `dependencies` du `backend/package.json` (pas devDependencies) car il est utilisé en production pour le sync Strava.

**Cookies de session stockés dans :** `/home/drawrun/app/backend/data/strava_cookies/<userId>.json`

---

### 7.3 Suunto — axios (API reverse-engineered)

**Mécanisme :** Appels HTTP directs à `cloud.suunto.com` avec les credentials OAuth2 de l'app mobile Suunto (reverse-engineered).

| Dépendance | Type | Statut VPS |
|-----------|------|-----------|
| `axios` | npm (backend) | ✅ installé |

Aucune installation supplémentaire requise.

**Tokens stockés dans :** `/home/drawrun/app/backend/data/suunto_tokens/<userId>.json`

---

### 7.4 Decathlon — axios (API officielle OAuth2 PKCE)

**Mécanisme :** API officielle Decathlon Sports Tracking Data avec OAuth2 PKCE flow.

| Dépendance | Type | Statut VPS |
|-----------|------|-----------|
| `axios` | npm (backend) | ✅ installé |

**Variables d'environnement requises :**
```bash
DECATHLON_CLIENT_ID=<votre_client_id>
DECATHLON_API_KEY=<votre_api_key>
DECATHLON_REDIRECT_URI=https://drawrun.fr/auth/decathlon/callback
```

**Tokens stockés dans :** `/home/drawrun/app/backend/data/decathlon_tokens/<userId>.json`

---

### 7.5 Résumé des dépendances par source

| Source | Technologie | Dépendances à installer |
|--------|------------|------------------------|
| **Garmin** | Python script | `pip3 install garminconnect garth requests --break-system-packages` |
| **Strava** | Playwright/Chromium | `npm install playwright` + `npx playwright install chromium` |
| **Suunto** | axios HTTP | Rien (inclus dans `npm install`) |
| **Decathlon** | axios HTTP | Rien (inclus dans `npm install`) |

---

## 9. Variables d'environnement

### Backend — `/home/drawrun/app/backend/.env`

```bash
NODE_ENV=production
PORT=3000
DATA_DIR=/home/drawrun/DrawRun-Data
JWT_SECRET=<secret>
CREDENTIALS_SECRET=<secret>
BCRYPT_ROUNDS=12
CORS_ORIGINS=https://drawrun.fr,https://www.drawrun.fr
LOG_LEVEL=info
LOG_DIR=./logs
TOTP_ISSUER=DrawRun
PLAYWRIGHT_BROWSERS_PATH=/home/drawrun/.playwright
```

### Frontend — `/home/drawrun/app/frontend/.env.local`

```bash
NEXT_PUBLIC_API_URL=https://drawrun.fr
```

---

## 10. 🔍 Dépannage — Problèmes courants et solutions

### ❌ Problème : `Cannot find module 'compression'` (ou autre module)

**Cause :** Le working directory de PM2 n'est pas `/home/drawrun/app/backend/`

**Solution 1 (recommandée) :**
```javascript
// Dans ecosystem.config.js
{
  name: 'drawrun-backend',
  script: 'index.js',           // Relatif au cwd
  cwd: '/home/drawrun/app/backend', // ✅ Working directory correct
  // ...
}
```

**Solution 2 (alternative) :**
```javascript
{
  name: 'drawrun-backend',
  script: './backend/index.js',
  cwd: '/home/drawrun/app',
  env: {
    NODE_ENV: 'production',
    NODE_PATH: '/home/drawrun/app/backend/node_modules', // Force le chemin
  }
}
```

**Vérification :**
```bash
# Tester le require depuis le bon répertoire
cd /home/drawrun/app/backend
node -e "require('compression'); console.log('OK')"
# Doit afficher: OK
```

---

### ❌ Problème : `Cannot find module 'xmldom'` / `fit-file-parser` / `multer`

**Cause :** Ces dépendances ont été ajoutées dans le code mais pas dans `backend/package.json`

**Solution :**
```bash
# Sur ta machine locale
cd backend
npm install xmldom fit-file-parser multer --save
# Puis commit et push

# Sur le VPS
cd /home/drawrun/app/backend
npm install --omit=dev
pm2 restart drawrun-backend
```

---

### ❌ Problème : Fichiers temporaires bloquent le `git pull`

**Cause :** Des fichiers comme `frontend-deploy.zip` (61 Mo) ont été commités et sont dans le repo.

**Solution :**
```bash
# Sur ta machine locale
git rm --cached frontend/frontend-deploy.zip garmin-streams-fix.zip login-page.yml
echo "*.zip" >> .gitignore
echo "*.tgz" >> .gitignore
git add .gitignore
git commit -m "chore: ignore temp files"
git push origin main

# Sur le VPS
cd /home/drawrun/app
rm -f frontend/frontend-deploy.zip garmin-streams-fix.zip login-page.yml
git pull origin main
```

---

### ❌ Problème : PM2 restart loop (restart count très élevé)

**Cause :** Le backend crash au démarrage et PM2 relance en boucle.

**Solution :**
```bash
# Voir les logs pour identifier l'erreur
pm2 logs drawrun-backend --lines 20

# Exemple d'erreur : Cannot find module 'xxx'
# → Voir les solutions ci-dessus

# Si le problème est résolu, forcer un redémarrage propre
pm2 delete all
pm2 start ecosystem.config.js
pm2 save
```

---

### ❌ Problème : Build frontend échoue

**Cause 1 :** `package-lock.json` est gitignored, donc `npm ci` échoue.

**Solution :** Toujours utiliser `npm install` (pas `npm ci`) pour le frontend sur le VPS.

**Cause 2 :** Problème de mémoire.

**Solution :**
```bash
# Libérer de la mémoire
pm2 delete all
# Puis réessayer le build
cd frontend
npm install
npm run build
```

---

## 11. 📊 Santé du système

```bash
# Health check API
curl http://localhost:3000/health
# ou via le domaine
curl https://drawrun.fr/health

# Réponse attendue (juin 2026)
{
  "status": "running",
  "message": "DrawRun API Server is running. 🚀",
  "timestamp": "2026-06-01T15:35:18.889Z",
  "version": "4.1.0",
  "cache": {
    "redis": {"status":"connected","connected":true,"latency":"1ms"},
    "lru": {"size":0,"maxSize":1000},
    "mode":"redis"
  },
  "features": {"socialAuth":false,"userCounter":true}
}

# Ressources système
free -h          # RAM
# Exemple: 7.7Gi total, 1.2Gi used, 6.5Gi free

df -h            # Disque
# Exemple: 98G total, 24G used, 74G available

uptime           # Load average
# Load average: 0.15, 0.10, 0.05 (OK si < 1.0 par CPU core)
```

---

## 12. 📝 Journal des déploiements

| Date | Version | Actions | Statut | Commits |
|------|---------|---------|--------|---------|
| 1 jun 2026 | 4.1.0 | Déploiement redesign complet | ✅ SUCCESS | 625400c, dd112ee, f4d2fae |
| | | - Fix ecosystem.config.js (cwd) | | |
| | | - Ajout xmldom, fit-file-parser | | |
| | | - Ajout multer | | |
| | | - Nettoyage fichiers temp (.zip) | | |
| mai 2026 | 4.1.0 | Installation initiale | ✅ | - |

---

## 13. .gitignore — Recommandations

**Fichiers à EXCLURE du repo :**

```
# Build outputs
.next/
out/
dist/
build/

# Node modules
node_modules/

# Environment files
.env
.env.*
!.env.example

# Logs
logs/
*.log

# Databases
*.db
*.sqlite
*.sqlite3

# IDE
.idea/
.vscode/
*.swp

# OS
.DS_Store
Thumbs.db

# Archives
*.zip
*.tgz
*.tar.gz

# Temp files
deploy-package/
*.zip
frontend-deploy.zip
garmin-streams-fix.zip
login-page.yml

# Deployment artifacts
ecosystem.config.js  # ⚠️ À discuter: faut-il versionner ce fichier ?
```

> **Note sur ecosystem.config.js** : Ce fichier contient la configuration PM2. Il est actuellement versionné dans le repo. Si vous le modifiez sur le VPS, pensez à le pousser sur GitHub pour synchronisation.

---

## 14. Installation initiale (référence)

Si jamais le VPS doit être réinstallé from scratch :

```bash
# 1. Installer Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Installer PM2
npm install -g pm2

# 3. Installer Nginx
sudo apt install -y nginx

# 4. Installer Git
sudo apt install -y git

# 5. Installer Python (pour Garmin sync)
sudo apt install -y python3 python3-pip
pip3 install garminconnect garth requests --break-system-packages

# 6. Cloner le repo
cd /home/drawrun
mkdir -p DrawRun-Data
git clone https://github.com/lomicbourlotroche/DrawRun.git app
cd app

# 7. Configurer les .env
cp backend/.env.example backend/.env
nano backend/.env  # Editer JWT_SECRET, CREDENTIALS_SECRET, etc.
echo "NEXT_PUBLIC_API_URL=https://drawrun.fr" > frontend/.env.local

# 8. Installer les dépendances
cd backend && npm install --production && cd ..
cd frontend && npm install && npm run build && cd ..

# 9. Configurer ecosystem.config.js (IMPORTANT !)
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'drawrun-backend',
      script: 'index.js',
      cwd: '/home/drawrun/app/backend',  // ✅ CORRECT
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production', PORT: 3000 },
      max_memory_restart: '512M',
      watch: false,
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
      watch: false,
    },
  ],
};
EOF

# 10. Démarrer avec PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Suivre les instructions pour démarrage auto au boot

# 11. Configurer Nginx + SSL
sudo cp /home/drawrun/app/nginx.conf /etc/nginx/sites-available/drawrun
sudo ln -s /etc/nginx/sites-available/drawrun /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d drawrun.fr -d www.drawrun.fr
```

---

## 15. Backup des données

```bash
# Backup manuel
cp -r /home/drawrun/DrawRun-Data /home/drawrun/DrawRun-Data-backup-$(date +%Y%m%d)

# Backup automatique via cron (quotidien à 2h)
crontab -e
# Ajouter :
0 2 * * * cp /home/drawrun/DrawRun-Data/main.db /home/drawrun/backups/main-$(date +\%Y\%m\%d).db

# Backup complet (à faire avant une maj majeure)
tar -czvf drawrun-backup-$(date +%Y%m%d).tar.gz /home/drawrun/DrawRun-Data /home/drawrun/app/backend/.env
```

---

## 16. 🎯 Checklist avant déploiement

- [ ] `git status` est clean (pas de fichiers temporaires)
- [ ] Toutes les nouvelles dépendances sont dans `backend/package.json`
- [ ] `.gitignore` est à jour (exclut node_modules, .env, .zip, etc.)
- [ ] `ecosystem.config.js` a `cwd: '/home/drawrun/app/backend'`
- [ ] Tests passent localement (`npm test`)
- [ ] Build frontend passe localement (`npm run build`)
- [ ] Health check local passe (`curl http://localhost:3000/health`)

---

## 17. 📞 Contact & Support

**Administrateur VPS :** Lomic Bourlot-Roche  
**Email :** (à définir)  
**SSH :** `ssh drawrun@37.69.94.253 -p 20708` (mot de passe: `0708`)

---

> **Dernière mise à jour :** 1er juin 2026 — Après déploiement réussi du redesign complet avec corrections des dépendances manquantes et configuration PM2.
