# Guide de Déploiement VPS

Guide pour déployer DrawRun sur un VPS sans CI/CD automatisée.

**Dépôt GitHub :** https://github.com/lomicbourlotroche/DrawRun

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
git clone https://github.com/lomicbourlotroche/DrawRun.git
cd DrawRun
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

Pour mettre à jour le code après un `git push` depuis votre machine :

```bash
ssh drawrun@37.69.94.253 -p 20708
cd /home/drawrun/app

# 1. Récupérer le code
git pull origin main

# 2. Mettre à jour le backend
cd backend
npm install
cd ..

# 3. Rebuilder et mettre à jour le frontend
cd frontend
npm install --legacy-peer-deps
npm run build
cd ..

# 4. Redémarrer les services
pm2 restart all

# 5. Vérifier que tout tourne
pm2 list
curl http://localhost:3000/health
```

### Script de mise à jour rapide

Copiez ce script sur le VPS (`/home/drawrun/update.sh`) :

```bash
#!/bin/bash
set -e
cd /home/drawrun/app

echo "📥 Pull du code..."
git pull origin main

echo "🔧 Backend..."
cd backend && npm install && cd ..

echo "🎨 Frontend..."
cd frontend && npm install --legacy-peer-deps && npm run build && cd ..

echo "🚀 Redémarrage..."
pm2 restart all

echo "✅ Mise à jour terminée !"
pm2 list
```

```bash
chmod +x /home/drawrun/update.sh
# Utilisation :
/home/drawrun/update.sh
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
/home/drawrun/
├── app/                      # Code source (git clone)
│   ├── backend/
│   │   ├── index.js
│   │   ├── .env              # Variables d'environnement (ne pas committer)
│   │   ├── node_modules/
│   │   └── ...
│   ├── frontend/
│   │   ├── .next/            # Build Next.js
│   │   ├── .env.local        # NEXT_PUBLIC_API_URL
│   │   ├── node_modules/
│   │   └── ...
│   └── ecosystem.config.js   # Config PM2
├── DrawRun-Data/             # Bases SQLite (hors git)
│   ├── main.db
│   └── user_*.db
└── update.sh                 # Script de mise à jour
```

## Script de déploiement rapide

Voir la section **Mise à Jour** ci-dessus pour le script `update.sh`.

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
