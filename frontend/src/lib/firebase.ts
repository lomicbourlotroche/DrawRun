/**
 * ============================================================
 * CONFIGURATION FIREBASE - Authentification Sociale
 * ============================================================
 *
 * Ce fichier configure Firebase pour l'authentification Google/Apple.
 * Nécessite les variables d'environnement dans .env.local.
 *
 * @module lib/firebase
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

// Configuration Firebase (à remplir dans .env.local)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialiser Firebase uniquement si la config est valide
let app;
let auth;

try {
  if (
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId
  ) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  }
} catch (error) {
  console.error('Erreur lors de l\'initialisation de Firebase:', error);
}

// Fournisseurs d'authentification
const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider('apple.com');

// Configuration des fournisseurs
if (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
  googleProvider.setCustomParameters({
    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  });
}

if (process.env.NEXT_PUBLIC_APPLE_SERVICE_ID) {
  appleProvider.setCustomParameters({
    serviceId: process.env.NEXT_PUBLIC_APPLE_SERVICE_ID,
  });
}

/**
 * Connexion avec Google
 */
export const signInWithGoogle = async (): Promise<{ user: any; token: string }> => {
  if (!auth) {
    throw new Error('Firebase non initialisé. Vérifiez vos variables d\'environnement.');
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const token = await user.getIdToken();

    // Envoyer le token au backend pour validation et création de session
    const response = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, uid: user.uid, email: user.email, name: user.displayName }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de la connexion avec Google');
    }

    const data = await response.json();
    return { user, token: data.token };
  } catch (error) {
    console.error('Erreur de connexion avec Google:', error);
    throw error;
  }
};

/**
 * Connexion avec Apple
 */
export const signInWithApple = async (): Promise<{ user: any; token: string }> => {
  if (!auth) {
    throw new Error('Firebase non initialisé. Vérifiez vos variables d\'environnement.');
  }

  try {
    const result = await signInWithPopup(auth, appleProvider);
    const user = result.user;
    const token = await user.getIdToken();

    // Envoyer le token au backend pour validation et création de session
    const response = await fetch('/api/auth/apple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, uid: user.uid, email: user.email, name: user.displayName }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de la connexion avec Apple');
    }

    const data = await response.json();
    return { user, token: data.token };
  } catch (error) {
    console.error('Erreur de connexion avec Apple:', error);
    throw error;
  }
};

/**
 * Déconnexion Firebase
 */
export const signOutFromFirebase = async (): Promise<void> => {
  if (auth) {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  }
};

/**
 * Obtenir l'instance Auth de Firebase
 */
export const getFirebaseAuth = () => {
  if (!auth) {
    throw new Error('Firebase non initialisé');
  }
  return auth;
};

/**
 * Vérifier si Firebase est initialisé
 */
export const isFirebaseInitialized = () => {
  return !!auth;
};

export { auth, googleProvider, appleProvider };
