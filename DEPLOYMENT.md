# DEPLOYMENT.md — DrawRun VPS

> Documentation de référence pour le déploiement et la maintenance de DrawRun en production.
> Mise à jour : mai 2026

---

## 1. Informations du VPS

| Paramètre | Valeur |
|-----------|--------|
| **IP** | `37.69.94.253` |
| **Port SSH** | `20708` |
| **Utilisateur** | `drawrun` |
| **OS** | Ubuntu 24.04.4 LTS (Noble Numbat) |
| **RAM** | 7.7 Go |
| **Disque** | 98 Go (LVM) |
| **Domaine** | `drawrun.fr` / `www.drawrun.fr` |
| **SSL** | Let's Encrypt (Certbot) |

### Connexion SSH

```bash
ssh drawrun@37.69.94.253 -p 20708
# Utiliser la clé SSH ou demander le mot de passe à l'administrateur
```

---

## 2. Stack installée sur le VPS

| Outil | Version |
|-------|---------|
| Node.js | 20.20.2 |
| npm | 11.13.0 |
| PM2 | 6.0.14 |
| Nginx | 1.24.0 |
| Git | 2.43.0 |

---

## 3. Structure des fichiers sur le VPS

```
/home/drawrun/
├── app/                          # Repo git cloné
│   ├── backend/
│   │   ├── index.js
│   │   ├── .env                  # Variables d'environnement (ne pas committer)
│   │   ├── node_modules/
│   │   └── src/
│   ├── frontend/
│   │   ├── .next/                # Build Next.js (généré par npm run build)
│   │   ├── .env.local            # NEXT_PUBLIC_API_URL=https://drawrun.fr
│   │   ├── node_modules/
│   │   └── ...
│   ├── ecosystem.config.js       # Config PM2
│   └── logs/                     # Logs de déploiement
└── DrawRun-Data/                 # Bases SQLite (hors git, persistantes)
    ├── main.db                   # Users, refresh_tokens, migrations
    └── user_*.db                 # Données par utilisateur
```

> ⚠️ `DrawRun-Data/` est **hors du repo git** — ne jamais supprimer ce dossier.

---

## 4. Processus PM2

Deux processus gérés par PM2 via `ecosystem.config.js` :

| Nom | Script | Port | Mode |
|-----|--------|------|------|
| `drawrun-backend` | `./backend/index.js` | 3000 | fork |
| `drawrun-frontend` | `next start --port 3001` | 3001 | fork |

```bash
# Voir le statut
pm2 list

# Logs en temps réel
pm2 logs drawrun-backend
pm2 logs drawrun-frontend

# Redémarrer
pm2 restart drawrun-backend
pm2 restart drawrun-frontend
pm2 restart all

# Monitorer CPU/RAM
pm2 monit
```

Logs PM2 stockés dans `/home/drawrun/.pm2/logs/`.

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

## 6. Déploiement — Mise à jour du code

Après un `git push` depuis la machine locale, se connecter au VPS et exécuter :

```bash
ssh drawrun@37.69.94.253 -p 20708
cd /home/drawrun/app

# 1. Récupérer le code
git stash          # si des fichiers locaux ont été modifiés (ex: next-env.d.ts)
git pull origin main

# 2. Dépendances backend
cd backend
npm install --omit=dev
cd ..

# 3. Dépendances + build frontend
# Note: package-lock.json est gitignored → utiliser npm install (pas npm ci)
cd frontend
npm install
npm run build
cd ..

# 4. Redémarrer les services
pm2 restart all

# 5. Vérifier
pm2 list
curl http://localhost:3000/health
```

> ⚠️ `npm ci` échoue sur le VPS car `frontend/package-lock.json` est dans `.gitignore`.
> Toujours utiliser `npm install` pour le frontend sur le VPS.

---

## 7. Dépendances des scripts de synchronisation

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

## 8. Variables d'environnement

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
```

### Frontend — `/home/drawrun/app/frontend/.env.local`

```bash
NEXT_PUBLIC_API_URL=https://drawrun.fr
```

---

## 9. Logs applicatifs

Les logs Winston du backend sont dans `/home/drawrun/app/backend/logs/` :

| Fichier | Contenu |
|---------|---------|
| `combined.log` | Tous les niveaux |
| `error.log` | Erreurs uniquement |
| `security.log` | Événements sécurité (warn+) |
| `auth.log` | Authentification |

```bash
# Suivre les erreurs en temps réel
tail -f /home/drawrun/app/backend/logs/error.log

# Logs PM2
pm2 logs drawrun-backend --lines 100
```

---

## 10. Erreurs connues (mai 2026)

| Erreur | Cause | Statut |
|--------|-------|--------|
| ~~`totp.toURI is not a function`~~ | ~~Bug dans `auth2fa.js` — mauvaise API de la lib TOTP~~ | ✅ Corrigé (`toString()` dans `2fa.service.js`) |
| CORS bloqué sur `https://37.69.94.253:80` | Accès par IP directe au lieu du domaine | Normal (ignoré) |
| `Create activity error` | Erreur non détaillée dans les logs | À investiguer |
| Brute force depuis `159.223.110.59` | Tentatives de login bloquées par rate limiter | Rate limiter fonctionne ✅ |

---

## 11. Santé du système

```bash
# Health check API
curl https://drawrun.fr/health

# Réponse attendue
{
  "status": "running",
  "message": "DrawRun API Server is running. 🚀",
  "version": "4.1.0",
  "cache": { "type": "memory", "status": "ok" }
}

# Ressources système
free -h          # RAM
df -h            # Disque
uptime           # Load average
```

---

## 12. Installation initiale (référence)

Si jamais le VPS doit être réinstallé from scratch :

```bash
# 1. Installer Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Installer PM2
npm install -g pm2

# 3. Installer Nginx
sudo apt install -y nginx

# 4. Cloner le repo
cd /home/drawrun
git clone https://github.com/lomicbourlotroche/DrawRun.git app
cd app

# 5. Créer le dossier de données
mkdir -p /home/drawrun/DrawRun-Data

# 6. Configurer les .env
cp backend/.env.example backend/.env
nano backend/.env
echo "NEXT_PUBLIC_API_URL=https://drawrun.fr" > frontend/.env.local

# 7. Installer les dépendances
cd backend && npm ci --production && cd ..
cd frontend && npm ci && npm run build && cd ..

# 8. Démarrer avec PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # suivre les instructions affichées

# 9. Configurer Nginx + SSL
sudo cp /home/drawrun/app/nginx.conf /etc/nginx/sites-available/drawrun
sudo ln -s /etc/nginx/sites-available/drawrun /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d drawrun.fr -d www.drawrun.fr
```

---

## 13. Backup des données

```bash
# Backup manuel
cp -r /home/drawrun/DrawRun-Data /home/drawrun/DrawRun-Data-backup-$(date +%Y%m%d)

# Backup automatique via cron (quotidien à 2h)
crontab -e
# Ajouter :
0 2 * * * cp /home/drawrun/DrawRun-Data/main.db /home/drawrun/backups/main-$(date +\%Y\%m\%d).db
```
