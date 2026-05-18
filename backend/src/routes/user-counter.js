/**
 * ============================================================
 * USER COUNTER ROUTE - Compteur d'utilisateurs simples
 * ============================================================
 *
 * Endpoint simple pour récupérer le nombre d'utilisateurs actifs.
 * Utilise la base de données existante pour compter les utilisateurs
 * connectés dans les 30 dernières minutes.
 *
 * @module routes/user-counter
 */

const express = require('express');
const { dbGetMain } = require('../database');
const { logger } = require('../utils/logger');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
const dbGet = (query, params = []) => dbGetMain(query, params);

/**
 * GET /api/user-counter
 * Récupère le nombre d'utilisateurs actifs (connectés dans les 30 dernières minutes)
 * Accessible publiquement (pas besoin d'être authentifié)
 */
router.get('/', async (req, res) => {
  try {
    // Compter les utilisateurs avec une activité récente (30 dernières minutes)
    const result = await dbGet(
      'SELECT COUNT(*) as count FROM users WHERE last_login > datetime("now", "-30 minutes")'
    );
    
    const count = result.count || 0;
    
    res.json({
      count: count,
      lastUpdated: new Date().toISOString(),
      message: 'Nombre d\'utilisateurs actifs récupéré avec succès'
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération du compteur utilisateurs:', error);
    res.status(500).json({
      error: 'Échec de la récupération du compteur utilisateurs',
      count: 0
    });
  }
});

/**
 * GET /api/user-counter/total
 * Récupère le nombre total d'utilisateurs (tous les temps)
 */
router.get('/total', async (req, res) => {
  try {
    const result = await dbGet('SELECT COUNT(*) as count FROM users');
    
    res.json({
      count: result.count || 0,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération du nombre total d\'utilisateurs:', error);
    res.status(500).json({
      error: 'Échec de la récupération du nombre total d\'utilisateurs',
      count: 0
    });
  }
});

/**
 * POST /api/user-counter/refresh
 * Force le rafraîchissement du cache (si implémenté)
 * Nécessite une authentification admin
 */
router.post('/refresh', verifyToken, async (req, res) => {
  try {
    // Pour l'instant, on ne fait rien de spécial car le compteur est en temps réel
    // Mais on peut ajouter une logique de cache plus tard
    res.json({
      success: true,
      message: 'Compteur rafraîchi'
    });
  } catch (error) {
    logger.error('Erreur lors du rafraîchissement du compteur:', error);
    res.status(500).json({
      error: 'Échec du rafraîchissement du compteur'
    });
  }
});

module.exports = router;
