/**
 * ============================================================
 * SOCIAL AUTH ROUTES - Authentification Google/Apple
 * ============================================================
 *
 * Ce fichier contient les endpoints pour l'authentification
 * via Google et Apple en utilisant Firebase Admin SDK.
 *
 * @module routes/social-auth
 */

const express = require('express');
const admin = require('firebase-admin');
const { dbGetMain, dbRunMain, dbAllMain } = require('../database');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const { auditLog, securityLog, logger } = require('../utils/logger');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Initialiser Firebase Admin si ce n'est pas déjà fait
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    logger.info('Firebase Admin initialisé avec succès');
  } catch (error) {
    logger.error('Erreur lors de l\'initialisation de Firebase Admin:', error);
  }
}

const dbGet = (query, params = []) => dbGetMain(query, params);
const dbRun = (query, params = []) => dbRunMain(query, params);
const dbAll = (query, params = []) => dbAllMain(query, params);

/**
 * Authentification via Google
 * Vérifie le token Firebase et crée une session DrawRun
 */
router.post('/google', async (req, res) => {
  const { token, uid, email, name, avatar } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token Firebase requis' });
  }

  try {
    // Vérifier le token Firebase
    const decodedToken = await admin.auth().verifyIdToken(token);
    const firebaseUid = decodedToken.uid;

    if (firebaseUid !== uid) {
      return res.status(400).json({ error: 'UID du token ne correspond pas' });
    }

    // Vérifier si l'utilisateur existe déjà dans DrawRun
    let user = await dbGet('SELECT id, email, profile_data FROM users WHERE email = ?', [email]);

    if (!user) {
      // Créer un nouvel utilisateur
      const profileData = JSON.stringify({
        name: name || email.split('@')[0],
        avatar: avatar,
        provider: 'google',
        firebase_uid: firebaseUid,
      });

      const result = await dbRun(
        'INSERT INTO users (email, profile_data, provider, firebase_uid, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
        [email, profileData, 'google', firebaseUid]
      );

      user = { id: result.lastID, email, profile_data: profileData };
      auditLog('SOCIAL_REGISTER', user.id, { provider: 'google', ip: req.ip }, req);
    } else {
      // Mettre à jour les informations Firebase si nécessaire
      const profileData = user.profile_data ? JSON.parse(user.profile_data) : {};
      profileData.provider = 'google';
      profileData.firebase_uid = firebaseUid;
      if (avatar) profileData.avatar = avatar;
      if (name) profileData.name = name;

      await dbRun(
        'UPDATE users SET profile_data = ?, provider = ?, firebase_uid = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [JSON.stringify(profileData), 'google', firebaseUid, user.id]
      );

      auditLog('SOCIAL_LOGIN', user.id, { provider: 'google', ip: req.ip }, req);
    }

    // Générer les tokens JWT pour DrawRun
    const accessToken = generateAccessToken({ id: user.id, email: user.email });
    const refreshToken = await generateRefreshToken({ id: user.id, email: user.email });

    // Récupérer les données du profil
    let profileData = {};
    try {
      profileData = user.profile_data ? JSON.parse(user.profile_data) : {};
    } catch (e) {
      profileData = {};
    }

    // Vérifier si l'utilisateur a Garmin configuré
    const garminCreds = await dbGet(
      'SELECT id FROM user_credentials WHERE user_id = ? AND provider = ? AND enabled = 1',
      [user.id, 'garmin']
    );
    const hasGarmin = !!garminCreds;

    res.json({
      token: accessToken,
      refreshToken,
      expiresIn: 900,
      userId: user.id,
      has_garmin: hasGarmin,
      message: 'Authentification Google réussie',
      user: {
        id: user.id,
        email: user.email,
        name: profileData.name || user.email.split('@')[0],
        avatar: profileData.avatar,
        provider: 'google',
        garmin_enabled: hasGarmin,
        has_garmin: hasGarmin,
        created_at: user.created_at || new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Erreur d\'authentification Google:', error);
    securityLog('SOCIAL_AUTH_FAILED', 'MEDIUM', { provider: 'google', error: error.message, ip: req.ip });

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token Firebase expiré' });
    }
    if (error.code === 'auth/invalid-user-token') {
      return res.status(401).json({ error: 'Token Firebase invalide' });
    }

    res.status(500).json({ error: 'Échec de l\'authentification Google' });
  }
});

/**
 * Authentification via Apple
 * Vérifie le token Firebase et crée une session DrawRun
 */
router.post('/apple', async (req, res) => {
  const { token, uid, email, name, avatar } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token Firebase requis' });
  }

  try {
    // Vérifier le token Firebase
    const decodedToken = await admin.auth().verifyIdToken(token);
    const firebaseUid = decodedToken.uid;

    if (firebaseUid !== uid) {
      return res.status(400).json({ error: 'UID du token ne correspond pas' });
    }

    // Vérifier si l'utilisateur existe déjà dans DrawRun
    let user = await dbGet('SELECT id, email, profile_data FROM users WHERE email = ?', [email]);

    if (!user) {
      // Créer un nouvel utilisateur
      const profileData = JSON.stringify({
        name: name || email.split('@')[0],
        avatar: avatar,
        provider: 'apple',
        firebase_uid: firebaseUid,
      });

      const result = await dbRun(
        'INSERT INTO users (email, profile_data, provider, firebase_uid, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
        [email, profileData, 'apple', firebaseUid]
      );

      user = { id: result.lastID, email, profile_data: profileData };
      auditLog('SOCIAL_REGISTER', user.id, { provider: 'apple', ip: req.ip }, req);
    } else {
      // Mettre à jour les informations Firebase si nécessaire
      const profileData = user.profile_data ? JSON.parse(user.profile_data) : {};
      profileData.provider = 'apple';
      profileData.firebase_uid = firebaseUid;
      if (avatar) profileData.avatar = avatar;
      if (name) profileData.name = name;

      await dbRun(
        'UPDATE users SET profile_data = ?, provider = ?, firebase_uid = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [JSON.stringify(profileData), 'apple', firebaseUid, user.id]
      );

      auditLog('SOCIAL_LOGIN', user.id, { provider: 'apple', ip: req.ip }, req);
    }

    // Générer les tokens JWT pour DrawRun
    const accessToken = generateAccessToken({ id: user.id, email: user.email });
    const refreshToken = await generateRefreshToken({ id: user.id, email: user.email });

    // Récupérer les données du profil
    let profileData = {};
    try {
      profileData = user.profile_data ? JSON.parse(user.profile_data) : {};
    } catch (e) {
      profileData = {};
    }

    // Vérifier si l'utilisateur a Garmin configuré
    const garminCreds = await dbGet(
      'SELECT id FROM user_credentials WHERE user_id = ? AND provider = ? AND enabled = 1',
      [user.id, 'garmin']
    );
    const hasGarmin = !!garminCreds;

    res.json({
      token: accessToken,
      refreshToken,
      expiresIn: 900,
      userId: user.id,
      has_garmin: hasGarmin,
      message: 'Authentification Apple réussie',
      user: {
        id: user.id,
        email: user.email,
        name: profileData.name || user.email.split('@')[0],
        avatar: profileData.avatar,
        provider: 'apple',
        garmin_enabled: hasGarmin,
        has_garmin: hasGarmin,
        created_at: user.created_at || new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Erreur d\'authentification Apple:', error);
    securityLog('SOCIAL_AUTH_FAILED', 'MEDIUM', { provider: 'apple', error: error.message, ip: req.ip });

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token Firebase expiré' });
    }
    if (error.code === 'auth/invalid-user-token') {
      return res.status(401).json({ error: 'Token Firebase invalide' });
    }

    res.status(500).json({ error: 'Échec de l\'authentification Apple' });
  }
});

/**
 * Lier un compte social à un utilisateur existant
 */
router.post('/link/:provider', verifyToken, async (req, res) => {
  const { provider } = req.params;
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token Firebase requis' });
  }

  if (provider !== 'google' && provider !== 'apple') {
    return res.status(400).json({ error: 'Fournisseur non supporté. Utilisez google ou apple.' });
  }

  try {
    // Vérifier le token Firebase
    const decodedToken = await admin.auth().verifyIdToken(token);
    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email;

    // Vérifier si l'email correspond à l'utilisateur connecté
    const user = await dbGet('SELECT id, email FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    if (user.email !== email) {
      return res.status(400).json({ error: 'L\'email du compte social doit correspondre à votre email DrawRun' });
    }

    // Mettre à jour les informations du fournisseur
    const profileData = user.profile_data ? JSON.parse(user.profile_data) : {};
    profileData[`${provider}_uid`] = firebaseUid;
    profileData.linked_providers = profileData.linked_providers || [];
    if (!profileData.linked_providers.includes(provider)) {
      profileData.linked_providers.push(provider);
    }

    await dbRun(
      'UPDATE users SET profile_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [JSON.stringify(profileData), req.user.id]
    );

    auditLog('SOCIAL_LINK', req.user.id, { provider, ip: req.ip }, req);

    res.json({
      success: true,
      message: `Compte ${provider} lié avec succès`,
      linkedProviders: profileData.linked_providers,
    });
  } catch (error) {
    logger.error(`Erreur lors de la liaison du compte ${provider}:`, error);
    res.status(500).json({ error: `Échec de la liaison du compte ${provider}` });
  }
});

/**
 * Supprimer la liaison d'un compte social
 */
router.post('/unlink/:provider', verifyToken, async (req, res) => {
  const { provider } = req.params;

  if (provider !== 'google' && provider !== 'apple') {
    return res.status(400).json({ error: 'Fournisseur non supporté. Utilisez google ou apple.' });
  }

  try {
    const user = await dbGet('SELECT id, profile_data FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    let profileData = user.profile_data ? JSON.parse(user.profile_data) : {};

    // Supprimer le UID du fournisseur
    delete profileData[`${provider}_uid`];

    // Supprimer du tableau des fournisseurs liés
    if (profileData.linked_providers) {
      profileData.linked_providers = profileData.linked_providers.filter(
        (p: string) => p !== provider
      );
    }

    // Si le fournisseur principal était google ou apple, le conserver
    if (profileData.provider === provider) {
      profileData.provider = 'email';
    }

    await dbRun(
      'UPDATE users SET profile_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [JSON.stringify(profileData), req.user.id]
    );

    auditLog('SOCIAL_UNLINK', req.user.id, { provider, ip: req.ip }, req);

    res.json({
      success: true,
      message: `Compte ${provider} délié avec succès`,
      linkedProviders: profileData.linked_providers || [],
    });
  } catch (error) {
    logger.error(`Erreur lors de la suppression de la liaison du compte ${provider}:`, error);
    res.status(500).json({ error: `Échec de la suppression de la liaison du compte ${provider}` });
  }
});

/**
 * Récupérer les comptes sociaux liés
 */
router.get('/linked-accounts', verifyToken, async (req, res) => {
  try {
    const user = await dbGet('SELECT profile_data FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    let profileData = {};
    try {
      profileData = user.profile_data ? JSON.parse(user.profile_data) : {};
    } catch (e) {
      profileData = {};
    }

    res.json({
      google: !!(profileData.google_uid || profileData.provider === 'google'),
      apple: !!(profileData.apple_uid || profileData.provider === 'apple'),
      linkedProviders: profileData.linked_providers || [],
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des comptes liés:', error);
    res.status(500).json({ error: 'Échec de la récupération des comptes liés' });
  }
});

module.exports = router;
