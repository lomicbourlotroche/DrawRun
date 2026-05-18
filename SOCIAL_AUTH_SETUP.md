# 🔐 Configuration de l'Authentification Sociale (Google/Apple) et du Compteur Utilisateurs

Ce guide explique comment configurer et activer les nouvelles fonctionnalités ajoutées à DrawRun :
- **Authentification Google/Apple** via Firebase
- **Compteur d'utilisateurs en temps réel** via WebSocket

---

## 📋 Prérequis

1. **Node.js** v18+ et **npm** v8+
2. **Firebase Project** (pour l'authentification sociale)
3. **Accès au dépôt** DrawRun

---

## 🚀 Configuration de l'Authentification Sociale

### Étape 1 : Créer un projet Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquez sur **"Ajouter un projet"** et suivez les instructions
3. Dans votre projet Firebase :
   - Allez dans **Paramètres du projet** > **Comptes de service**
   - Cliquez sur **"Créer un compte de service"**
   - Générez une nouvelle clé privée et téléchargez le fichier JSON

### Étape 2 : Configurer les fournisseurs d'authentification

#### Pour Google :
1. Dans Firebase Console, allez dans **Authentification** > **Méthodes de connexion**
2. Activez **Google** comme fournisseur
3. Enregistrez votre application dans [Google Cloud Console](https://console.cloud.google.com/)
4. Ajoutez vos domaines autorisés (ex: `localhost`, `drawrun.fr`)

#### Pour Apple :
1. Dans Firebase Console, allez dans **Authentification** > **Méthodes de connexion**
2. Activez **Apple** comme fournisseur
3. Configurez votre **Service ID** (ex: `com.your.app`)
4. Activez **Sign in with Apple** dans votre compte développeur Apple

### Étape 3 : Configurer les variables d'environnement

#### Backend (`.env` dans `/backend`) :
```env
# Firebase Admin (REQUIRED pour l'auth sociale)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
```

#### Frontend (`.env.local` dans `/frontend`) :
```env
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_APP_ID=your-firebase-app-id
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id

# Optionnel: Google Client ID (si vous n'utilisez pas Firebase)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

# Optionnel: Apple Service ID
NEXT_PUBLIC_APPLE_SERVICE_ID=com.your.app
```

### Étape 4 : Installer les dépendances

#### Dans le dossier `/frontend` :
```bash
npm install
```

#### Dans le dossier `/backend` :
```bash
npm install
```

---

## 📊 Configuration du Compteur Utilisateurs en Temps Réel

Le compteur utilisateurs utilise **WebSocket** pour diffuser les mises à jour en temps réel.

### Configuration requise :

1. **Aucune configuration supplémentaire** n'est nécessaire pour le backend
2. Le compteur utilise automatiquement la base de données existante
3. Les utilisateurs sont considérés comme "actifs" s'ils se sont connectés dans les **30 dernières minutes**

### Personnalisation :

Pour modifier la durée d'inactivité avant qu'un utilisateur ne soit considéré comme hors ligne :

Dans `/backend/src/routes/stats.js`, modifiez la requête SQL :
```javascript
// Actuellement : 30 minutes
SELECT COUNT(*) as count FROM users WHERE last_login > datetime("now", "-30 minutes")

// Pour 60 minutes :
SELECT COUNT(*) as count FROM users WHERE last_login > datetime("now", "-60 minutes")
```

---

## 🔧 Intégration dans l'Application

### Authentification Sociale

Les boutons Google et Apple sont automatiquement intégrés dans :
- `frontend/components/features/auth/SocialAuthButtons.tsx`
- `frontend/components/features/auth/LoginForm.tsx`

Pour utiliser l'authentification sociale dans un autre composant :

```tsx
import { SocialAuthButtons } from '@/components/features/auth';

function MyComponent() {
  return (
    <div>
      <h2>Se connecter</h2>
      <SocialAuthButtons />
    </div>
  );
}
```

### Compteur Utilisateurs

Le compteur est intégré dans la barre de navigation (`Navbar.tsx`).

Pour l'utiliser ailleurs :

```tsx
import { UserCounter } from '@/components/features/UserCounter';

function MyComponent() {
  return (
    <div>
      <h2>Statistiques</h2>
      <UserCounter showLabel={true} label="utilisateurs en ligne" />
    </div>
  );
}
```

Ou via l'API directement :

```tsx
import { userCounterApi } from '@/lib/api';

// Récupérer le compteur une fois
const { count } = await userCounterApi.getUserCount();

// Ou s'abonner aux mises à jour en temps réel
const unsubscribe = userCounterApi.subscribeToUserCount((count) => {
  console.log('Nouveau compteur:', count);
});

// N'oubliez pas de vous désabonner
unsubscribe();
```

---

## 🧪 Test des Fonctionnalités

### Tester l'Authentification Sociale

1. Démarrez le backend :
   ```bash
   cd backend
   npm run dev
   ```

2. Démarrez le frontend :
   ```bash
   cd frontend
   npm run dev
   ```

3. Allez sur `http://localhost:3001/login`
4. Vous devriez voir les boutons **"Continuer avec Google"** et **"Continuer avec Apple"**
5. Cliquez sur un bouton et connectez-vous avec votre compte

### Tester le Compteur Utilisateurs

1. Connectez-vous avec plusieurs appareils/navigateurs
2. Observez le compteur dans la barre de navigation
3. Le compteur doit se mettre à jour automatiquement

---

## 🛡️ Sécurité

### Bonnes pratiques :

1. **Ne jamais commiter les clés privées** dans le dépôt Git
2. Utilisez des **variables d'environnement** pour toutes les clés sensibles
3. Activez **2FA** pour votre compte Firebase
4. Limitez les **domaines autorisés** dans Firebase
5. Configurez des **règles de sécurité Firebase** appropriées

### Configuration Firebase recommandée :

Dans **Firebase Console** > **Authentification** > **Paramètres** :
- Désactivez l'option **"Autoriser la création de comptes anonymes"**
- Activez **reCAPTCHA** pour tous les fournisseurs
- Configurez des **domaines autorisés** (ex: `localhost`, `drawrun.fr`)

---

## 📝 Dépannage

### Problèmes courants :

#### 1. "Firebase non initialisé"
**Cause** : Les variables d'environnement Firebase ne sont pas configurées.
**Solution** : Vérifiez que toutes les variables Firebase sont définies dans `.env`.

#### 2. "Token Firebase invalide"
**Cause** : Le token a expiré ou est mal formé.
**Solution** : Vérifiez que vous utilisez le bon projet Firebase et que l'URL de l'auth domaine est correcte.

#### 3. Le compteur ne se met pas à jour
**Cause** : Le WebSocket n'est pas connecté.
**Solution** : 
- Vérifiez que le backend est démarré
- Vérifiez que l'URL du WebSocket est correcte (par défaut: `ws://localhost:3000/api/stats/users/ws`)
- Ouvrez la console du navigateur pour voir les erreurs WebSocket

#### 4. Erreur CORS
**Cause** : Le frontend et le backend ne sont pas sur la même origine.
**Solution** : Configurez `CORS_ORIGINS` dans `.env` du backend :
```env
CORS_ORIGINS=http://localhost:3001,http://localhost:3000
```

---

## 📚 API de Référence

### Endpoints Backend

#### Authentification Sociale
- `POST /api/auth/google` - Authentification avec Google
- `POST /api/auth/apple` - Authentification avec Apple
- `POST /api/auth/link/:provider` - Lier un compte social
- `POST /api/auth/unlink/:provider` - Supprimer la liaison d'un compte social
- `GET /api/auth/linked-accounts` - Lister les comptes sociaux liés

#### Statistiques
- `GET /api/stats/users` - Récupérer le nombre d'utilisateurs actifs
- `GET /api/stats/total-users` - Récupérer le nombre total d'utilisateurs
- `GET /api/stats/activities` - Récupérer le nombre total d'activités (estimation)
- `WebSocket /api/stats/users/ws` - Flux en temps réel du compteur utilisateurs

### API Frontend

#### Social Auth
```typescript
import { socialAuthApi } from '@/lib/api';

// Connexion avec Google
const response = await socialAuthApi.loginWithGoogle();

// Connexion avec Apple
const response = await socialAuthApi.loginWithApple();

// Lier un compte social
const response = await socialAuthApi.linkSocialAccount('google', firebaseToken);

// Supprimer la liaison
const response = await socialAuthApi.unlinkSocialAccount('google');

// Lister les comptes liés
const accounts = await socialAuthApi.getLinkedSocialAccounts();
```

#### User Counter
```typescript
import { userCounterApi } from '@/lib/api';

// Récupérer le compteur
const { count } = await userCounterApi.getUserCount();

// S'abonner aux mises à jour
const unsubscribe = userCounterApi.subscribeToUserCount((count) => {
  console.log('Compteur mis à jour:', count);
});

// Récupérer le compteur et s'abonner en une seule opération
const { count, unsubscribe } = await userCounterApi.getUserCountAndSubscribe((count) => {
  console.log('Compteur:', count);
});
```

---

## 🎯 Prochaines Étapes

1. **Configurer Firebase** comme décrit ci-dessus
2. **Tester en local** avant de déployer
3. **Déployer** les modifications sur votre serveur
4. **Surveiller** les logs pour détecter les erreurs
5. **Personnaliser** l'interface utilisateur si nécessaire

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les **logs** du backend (`npm run dev`)
2. Consultez la **console du navigateur** (F12)
3. Vérifiez que toutes les **variables d'environnement** sont correctement configurées
4. Consultez la [documentation Firebase](https://firebase.google.com/docs)

---

**Dernière mise à jour** : 18 mai 2026  
**Version** : 4.1.0  
**Auteur** : DrawRun Team
