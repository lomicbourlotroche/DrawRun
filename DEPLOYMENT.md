# Guide de Déploiement VPS

Guide pour déployer DrawRun sur un VPS sans CI/CD automatisée.

## Prérequis

- VPS avec Ubuntu 22.04+
- Node.js 18+ installé
- Git installé
- Nginx (pour reverse proxy)
- PM2 (pour gestion des processus)

## Installation Initiale sur le VPS

### 1. Connectez-vous au VPS

```bash
ssh user@votre-vps-ip
```

### 2. Cloner le projet

```bash
cd /var/www
git clone https://github.com/votre-compte/DrawRun-New.git
cd DrawRun-New
```

### 3. Installer les dépendances

```bash
# Backend
cd backend
npm install --production

# Frontend
cd ../frontend
npm install
npm run build
cd ..
```

### 4. Configurer l'environnement

```bash
cp .env.example .env
nano .env  # Éditez avec vos valeurs
```

**Variables importantes:**
```env
JWT_SECRET=votre-secret-tres-securise-min-32-caracteres
CORS_ORIGINS=https://votre-domaine.com
NODE_ENV=production
PORT=3000
```

### 5. Démarrer avec PM2

```bash
# Backend
pm2 start backend/index.js --name "drawrun-backend" -- --port 3000

# Frontend (Next.js en mode production)
pm2 start frontend/node_modules/.bin/next --name "drawrun-frontend" -- start --port 3001

# Sauvegarder la configuration PM2
pm2 save
pm2 startup
```

### 6. Configurer Nginx

```bash
sudo nano /etc/nginx/sites-available/drawrun
```

**Configuration:**
```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activer la configuration:
```bash
sudo ln -s /etc/nginx/sites-available/drawrun /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. SSL avec Certbot (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com
```

## Mise à Jour (Update)

Pour mettre à jour le code:

```bash
cd /var/www/DrawRun-New
git pull origin main

# Mettre à jour le backend
cd backend
npm install --production
pm2 restart drawrun-backend

# Mettre à jour le frontend
cd ../frontend
npm install
npm run build
pm2 restart drawrun-frontend
```

## Commandes Utiles

```bash
# Voir les logs
pm2 logs drawrun-backend
pm2 logs drawrun-frontend

# Redémarrer
pm2 restart all

# Arrêter
pm2 stop all

# Voir le statut
pm2 status

# Monitorer en temps réel
pm2 monit
```

## Structure sur le VPS

```
/var/www/DrawRun-New/
├── backend/          # Code backend
│   ├── index.js
│   ├── node_modules/
│   └── ...
├── frontend/         # Code frontend
│   ├── .next/        # Build Next.js
│   ├── node_modules/
│   └── ...
├── DrawRun-Data/     # Données SQLite (monté ou copié)
│   └── main.db
├── .env              # Variables d'environnement
└── ...
```

## Script de déploiement rapide

Créez un script `deploy.sh` sur le VPS:

```bash
#!/bin/bash
set -e

cd /var/www/DrawRun-New

echo "📥 Pulling latest code..."
git pull origin main

echo "🔧 Updating backend..."
cd backend
npm install --production
cd ..

echo "🎨 Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "🚀 Restarting services..."
pm2 restart drawrun-backend drawrun-frontend

echo "✅ Deployment complete!"
```

Rendre exécutable:
```bash
chmod +x deploy.sh
./deploy.sh
```

## Backup des données

```bash
# Backup quotidien avec cron
crontab -e

# Ajoutez:
0 2 * * * cp /var/www/DrawRun-New/DrawRun-Data/main.db /var/backups/drawrun-$(date +\%Y\%m\%d).db
```

## Dépannage

### Le backend ne démarre pas
```bash
pm2 logs drawrun-backend
# Vérifier les permissions sur DrawRun-Data/
```

### Le frontend affiche des erreurs
```bash
pm2 logs drawrun-frontend
# Rebuilder: cd frontend && npm run build
```

### Nginx erreur 502
```bash
sudo nginx -t
sudo systemctl status nginx
# Vérifier que les ports 3000/3001 sont libres
```

## Sécurité

- Utilisez `ufw` pour le firewall:
  ```bash
  sudo ufw allow 22
  sudo ufw allow 80
  sudo ufw allow 443
  sudo ufw enable
  ```

- Mettre à jour régulièrement:
  ```bash
  sudo apt update && sudo apt upgrade -y
  ```

- Changer les permissions:
  ```bash
  chmod 600 .env
  chmod 700 DrawRun-Data/
  ```
