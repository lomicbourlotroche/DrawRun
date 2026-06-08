# Guide de Prise en Main et de Développement — DrawRun (pour les Humains)

Bienvenue dans le code de **DrawRun** ! Ce projet a été développé en collaboration avec un agent d'Intelligence Artificielle. Ce guide est conçu pour vous expliquer le fonctionnement du code de façon simple, claire et pédagogique, afin que vous puissiez **continuer à développer l'application vous-même** en toute confiance.

---

## 1. Vue d'Ensemble du Projet

DrawRun est une application de suivi des performances sportives (course à pied, vélo, trail). Elle permet d'analyser les entraînements avec des indicateurs scientifiques et de générer des plans de coaching adaptés.

Le projet est divisé en deux parties principales (une architecture **Monorepo**) :
- 📁 **`backend/`** : L'API construite avec **Node.js** et **Express 5**. Elle gère les calculs, la base de données et la sécurité. Elle tourne sur le port **3000** en local.
- 📁 **`frontend/`** : L'interface utilisateur construite avec **Next.js 16** (App Router) et **TypeScript**. Elle tourne sur le port **3001** en local.
- 📁 **`DrawRun-Data/`** : Un dossier (créé automatiquement en dehors du dépôt Git) qui contient toutes les bases de données locales au format **SQLite**.

---

## 2. Les Concepts Clés (Expliqués Simplement)

L'IA a implémenté plusieurs choix architecturaux spécifiques pour assurer la performance et la sécurité. Voici les 3 concepts les plus importants :

### A. Une base de données SQLite par utilisateur
Pour isoler les données de chacun et simplifier les sauvegardes, le projet n'utilise pas une seule grosse base de données contenant tout le monde. À la place :
- **`main.db`** : Contient uniquement les informations de connexion globale des utilisateurs (email, mot de passe chiffré, tokens de session, etc.).
- **`user_<email_sanitisé>.db`** : Chaque utilisateur a son propre fichier de base de données. Ce fichier contient ses activités, ses séances de coaching, son matériel, etc. Personne d'autre ne peut y accéder.

### B. Le Cache LRU pour les bases de données
Comme il y a beaucoup de bases de données individuelles, ouvrir et fermer les fichiers SQLite à chaque clic ralentirait l'application. 
Pour éviter cela, le backend garde en mémoire les **100 dernières bases de données utilisées** (c'est le cache **LRU** - *Least Recently Used*). Si une 101ème base est ouverte, la plus ancienne qui n'a pas été consultée est automatiquement enregistrée sur le disque dur, puis fermée pour libérer de la mémoire.

### C. La gestion automatique des Tokens (Sécurité)
Pour que vous n'ayez pas à vous reconnecter sans cesse, l'application utilise des jetons (Tokens) :
1. **Access Token** : Un jeton de sécurité très court (durée de vie : 15 minutes) envoyé avec chaque requête.
2. **Refresh Token** : Un jeton plus long (durée de vie : 7 jours) conservé dans le navigateur.
> **Magie du Frontend :** Si le jeton de 15 minutes expire, le client API du frontend (situé dans `frontend/src/lib/api/client.ts`) intercepte l'erreur, demande discrètement un nouveau jeton d'accès au backend, puis rejoue votre action initiale sans que l'utilisateur ne s'en rende compte.

---

## 3. Cartographie du Code : "Où se trouve quoi ?"

Voici un plan pour retrouver rapidement les fichiers importants selon ce que vous souhaitez modifier.

### 💻 Côté Frontend (Interface Utilisateur)
Tout le code visuel est dans le dossier `frontend/` :
- **Les pages de l'application** : Situées dans `frontend/app/app/`. Par exemple :
  - Le tableau de bord : `app/app/page.tsx` (Dashboard)
  - La liste des activités : `app/app/activities/page.tsx`
  - La page du coach : `app/app/coach/page.tsx`
- **Les composants réutilisables** : Situés dans `frontend/components/`.
  - `components/ui/` : Les boutons, cartes, fenêtres modales de base.
  - `components/features/` : Les widgets complexes (ex: le graphique PMC, l'enregistreur d'activité mobile).
- **Les appels à l'API (Backend)** : Situés dans `frontend/src/lib/api/`. 
  - ⚠️ **Règle d'or** : Ne faites jamais de `fetch()` brut dans un composant React. Utilisez toujours les fonctions définies dans ce dossier (ex: `profile.api.ts` pour modifier le profil).
- **Le stockage d'état (Zustand)** : Situé dans `frontend/src/stores/index.ts`. C'est là que sont stockées les informations globales comme le fait que l'utilisateur soit connecté ou non.

### ⚙️ Côté Backend (Logique & API)
Tout le code serveur est dans le dossier `backend/` :
- **Le point d'entrée** : `backend/index.js`. Il démarre le serveur, charge les configurations et monte les routes API.
- **Les routes API (Endpoints)** : Situées dans `backend/src/routes/`.
  - Les routes d'authentification : `routes/auth.js`
  - Les calculs d'allures et de zones : `routes/algo/`
  - La gestion des activités : `routes/activities.js`
- **Les algorithmes scientifiques** : Situés dans `backend/src/algorithms/`. Si vous devez modifier la formule du calcul de la fatigue, des zones cardiaques ou des allures de course, c'est ici.
- **Les services** : Situés dans `backend/src/services/`. C'est le code qui fait le travail complexe (comme le moteur de coaching adaptatif dans `services/coach/` ou la synchronisation Garmin dans `services/sync/`).
- **La base de données** : Située dans `backend/src/database/`.
  - `mainDb.js` : Gère `main.db`.
  - `userDb.js` : Gère les bases individuelles et leurs tables.
  - `migrations.js` : Permet de modifier la structure des tables (ajouter des colonnes) de façon sécurisée au démarrage de l'application.

---

## 4. Exemple pas-à-pas : "Comment ajouter un champ ?"

Imaginons que vous vouliez ajouter un champ **"Surnom"** (`nickname`) dans le profil de l'utilisateur. Voici le cheminement complet dans le code.

### Étape 1 : Mettre à jour la Base de Données
Dans `backend/src/database/migrations.js`, nous devons ajouter une migration pour que la table `users` de `main.db` ait une colonne `nickname`.
Ajoutez ceci à la fin du tableau `MIGRATIONS` :
```javascript
{
    version: '028_add_nickname_to_users', // Le numéro doit suivre le précédent lexicographiquement
    description: 'Ajoute la colonne nickname à la table users',
    up: (db) => {
        try { db.run('ALTER TABLE users ADD COLUMN nickname TEXT DEFAULT ""'); } catch (_) {}
    }
}
```
*Note : Cette migration s'exécutera automatiquement au prochain démarrage du serveur.*

### Étape 2 : Mettre à jour l'API Backend
Dans `backend/src/routes/auth.js`, modifiez la route de sauvegarde du profil (ou créez-en une nouvelle) pour enregistrer et renvoyer ce surnom.
Par exemple, dans le `GET /profile` :
```javascript
// Récupérer le nickname depuis la base de données
const user = await dbGet('SELECT nickname, ... FROM users WHERE id = ?', [req.user.id]);
```
Et dans le `POST /profile` ou équivalent, enregistrez-le :
```javascript
await dbRun('UPDATE users SET nickname = ? WHERE id = ?', [nickname, req.user.id]);
```

### Étape 3 : Mettre à jour le Client API Frontend
Dans `frontend/src/lib/api/types.ts` ou dans le fichier API approprié, modifiez l'interface TypeScript pour déclarer le nouveau champ :
```typescript
export interface UserProfile {
    id: number;
    email: string;
    nickname?: string; // Notre nouveau champ !
    // ... rest of fields
}
```

### Étape 4 : L'afficher et le modifier dans l'interface React
Allez dans le composant de profil `frontend/app/app/profile/page.tsx` (ou le formulaire correspondant dans `components/features/profile/`), puis ajoutez un champ de saisie :
```tsx
<input 
  type="text" 
  value={profile.nickname || ''} 
  onChange={(e) => updateNickname(e.target.value)} 
  className="input-class" 
/>
```

---

## 5. Les Règles d'Or à Respecter (Pour éviter les bugs)

Le projet utilise des outils de vérification stricts. Si vous ne respectez pas ces règles, l'application pourrait planter ou refuser de démarrer :

1. 🚫 **Pas de `console.log()` dans le backend**
   - Utilisez toujours le logger Winston : `logger.info("Mon message")` ou `logger.error("Une erreur", err)`.
2. 🚫 **Pas d'appels HTTP `fetch()` bruts dans vos composants React**
   - Utilisez toujours l'objet exporté `api` de `@/lib/api`.
3. 🚫 **Pas de stockage de tokens dans le `localStorage`**
   - Utilisez exclusivement le `sessionStorage` (ceci est géré automatiquement par le store d'authentification Zustand).
4. 🔒 **Pas de requêtes SQL construites par concaténation de chaînes**
   - Utilisez des requêtes paramétrées avec des points d'interrogation `?` pour éviter les failles de sécurité.
   - *Exemple correct* : `dbGet('SELECT * FROM users WHERE email = ?', [email])`
   - *Exemple interdit* : `dbGet('SELECT * FROM users WHERE email = "' + email + '"')`

---

## 6. Outil Magique : L'Assistant Interactif

Pour vous simplifier la vie, lancez cette commande à la racine du projet :
```bash
npm run assistant
```
Elle ouvre un outil en français dans votre terminal qui vous permet de :
- Diagnostiquer si votre installation est correcte.
- Démarrer tous les serveurs en un seul clic.
- **Créer instantanément un compte de test** pré-rempli avec des fausses activités et des statistiques de forme physique pour explorer l'interface de DrawRun directement sans configuration laborieuse.
- Inspecter le contenu de vos bases de données locales.
