/**
 * ============================================================
 * STATS ROUTES - Statistiques et compteur utilisateurs
 * ============================================================
 *
 * Ce fichier contient les endpoints pour les statistiques,
 * y compris le compteur d'utilisateurs en temps réel.
 *
 * @module routes/stats
 */

const express = require('express');
const WebSocket = require('ws');
const { dbGetMain } = require('../database');
const { logger } = require('../utils/logger');

const router = express.Router();

const dbGet = (query, params = []) => dbGetMain(query, params);


// Stocker les connexions WebSocket actives
let activeConnections = new Set();
let userCount = 0;

// Mettre à jour le compteur périodiquement
const updateUserCount = async () => {
  try {
    const result = await dbGet('SELECT COUNT(*) as count FROM users WHERE last_login > datetime("now", "-30 minutes")');
    userCount = result.count || 0;
    logger.debug(`Compteur utilisateurs mis à jour: ${userCount}`);
    
    // Envoyer à tous les clients connectés
    broadcastUserCount();
  } catch (error) {
    logger.error('Erreur lors de la mise à jour du compteur utilisateurs:', error);
  }
};

// Envoyer le compteur à tous les clients WebSocket
const broadcastUserCount = () => {
  const message = JSON.stringify({
    type: 'user_count_update',
    data: {
      count: userCount,
      lastUpdated: new Date().toISOString(),
    },
  });

  activeConnections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
};

// Démarrer la mise à jour périodique (toutes les 30 secondes)
setInterval(updateUserCount, 30000);

// Mise à jour initiale
updateUserCount().catch(logger.error);

/**
 * GET /api/stats/users
 * Récupère le nombre d'utilisateurs actifs (dernière connexion dans les 30 dernières minutes)
 */
router.get('/users', async (req, res) => {
  try {
    const result = await dbGet('SELECT COUNT(*) as count FROM users WHERE last_login > datetime("now", "-30 minutes")');
    
    res.json({
      count: result.count || 0,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération du compteur utilisateurs:', error);
    res.status(500).json({ error: 'Échec de la récupération du compteur utilisateurs' });
  }
});

/**
 * GET /api/stats/total-users
 * Récupère le nombre total d'utilisateurs (tous les temps)
 */
router.get('/total-users', async (req, res) => {
  try {
    const result = await dbGet('SELECT COUNT(*) as count FROM users');
    
    res.json({
      count: result.count || 0,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération du nombre total d\'utilisateurs:', error);
    res.status(500).json({ error: 'Échec de la récupération du nombre total d\'utilisateurs' });
  }
});

/**
 * GET /api/stats/activities
 * Récupère le nombre total d'activités
 */
router.get('/activities', async (req, res) => {
  try {
    // Compter les activités dans toutes les bases utilisateurs
    // Note: Cela nécessite une approche différente car chaque utilisateur a sa propre base
    // Pour l'instant, on retourne une estimation
    const result = await dbGet('SELECT COUNT(*) as count FROM users');
    const estimatedActivities = result.count * 10; // Estimation: 10 activités par utilisateur
    
    res.json({
      count: estimatedActivities || 0,
      lastUpdated: new Date().toISOString(),
      note: 'Estimation basée sur le nombre d\'utilisateurs',
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération du compteur d\'activités:', error);
    res.status(500).json({ error: 'Échec de la récupération du compteur d\'activités' });
  }
});

/**
 * Configuration du WebSocket pour les mises à jour en temps réel
 */
const setupWebSocket = (server) => {
  const wss = new WebSocket.Server({ server, path: '/api/stats/users/ws' });

  wss.on('connection', (ws) => {
    logger.info('Nouvelle connexion WebSocket pour le compteur utilisateurs');
    activeConnections.add(ws);

    // Envoyer le compteur actuel au nouveau client
    ws.send(JSON.stringify({
      type: 'user_count_update',
      data: {
        count: userCount,
        lastUpdated: new Date().toISOString(),
      },
    }));

    ws.on('close', () => {
      logger.info('Connexion WebSocket fermée');
      activeConnections.delete(ws);
    });

    ws.on('error', (error) => {
      logger.error('Erreur WebSocket:', error);
      activeConnections.delete(ws);
    });
  });

  // Nettoyer les connexions fermées
  setInterval(() => {
    activeConnections.forEach((ws) => {
      if (ws.readyState !== WebSocket.OPEN) {
        activeConnections.delete(ws);
      }
    });
  }, 60000);

  return wss;
};

/**
 * Middleware pour attacher le WebSocket au serveur
 */
router.setupWebSocket = setupWebSocket;

module.exports = router;
