/**
 * ============================================================
 * DATABASE QUERY OPTIMIZER
 * ============================================================
 * 
 * Service pour optimiser les requêtes et éviter les problèmes N+1
 * 
 * Patterns:
 * - Batch loading
 * - DataLoader pattern
 * - Query optimization
 */

'use strict';

const { dbGetMain, dbAllMain } = require('../database');
const { logger } = require('../utils/logger');

/**
 * Batch loader pour éviter les requêtes N+1
 * Charge les données par lots pour plusieurs IDs
 */
class BatchLoader {
  constructor(fetchFn, options = {}) {
    this.fetchFn = fetchFn;
    this.batch = [];
    this.cache = new Map();
    this.batchSize = options.batchSize || 100;
    this.debounceMs = options.debounceMs || 10;
    this.timer = null;
  }

  /**
   * Charge un item par ID (utilise le batch loading)
   */
  async load(id) {
    // Vérifier le cache
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }

    // Ajouter au batch
    return new Promise((resolve, reject) => {
      this.batch.push({ id, resolve, reject });
      this.scheduleBatch();
    });
  }

  /**
   * Charge plusieurs items par IDs
   */
  async loadMany(ids) {
    const results = await Promise.all(ids.map(id => this.load(id)));
    return results;
  }

  /**
   * Programme l'exécution du batch
   */
  scheduleBatch() {
    if (this.timer) return;

    this.timer = setTimeout(() => {
      this.executeBatch();
    }, this.debounceMs);
  }

  /**
   * Exécute le batch de requêtes
   */
  async executeBatch() {
    if (this.batch.length === 0) return;

    const currentBatch = this.batch.splice(0, this.batchSize);
    const ids = currentBatch.map(item => item.id);

    try {
      const results = await this.fetchFn(ids);
      const resultsMap = new Map(results.map(r => [r.id, r]));

      currentBatch.forEach(({ id, resolve }) => {
        const result = resultsMap.get(id);
        this.cache.set(id, result);
        resolve(result);
      });
    } catch (error) {
      currentBatch.forEach(({ reject }) => reject(error));
      logger.error('Batch loading error:', error);
    }

    this.timer = null;

    // S'il reste des items, programmer un nouveau batch
    if (this.batch.length > 0) {
      this.scheduleBatch();
    }
  }

  /**
   * Vide le cache
   */
  clearCache() {
    this.cache.clear();
  }
}

/**
 * Charge les draws pour plusieurs activités en une seule requête
 */
async function batchLoadActivityDraws(activityIds, userId) {
  if (!activityIds.length) return [];

  if (!userId) return [];

  const placeholders = activityIds.map(() => '?').join(',');
  
  // Récupérer tous les counts en une seule requête (scope par activity_owner_id)
  const counts = await dbAllMain(`
    SELECT activity_id, COUNT(*) as count
    FROM activity_draws
    WHERE activity_id IN (${placeholders})
    AND activity_owner_id = ?
    GROUP BY activity_id
  `, [...activityIds, userId]);

  // Récupérer les draws de l'utilisateur courant
  const userDraws = await dbAllMain(`
    SELECT activity_id
    FROM activity_draws
    WHERE activity_id IN (${placeholders})
    AND activity_owner_id = ?
    AND from_user_id = ?
  `, [...activityIds, userId, userId]);

  const userDrawnIds = new Set(userDraws.map(d => d.activity_id));

  return activityIds.map(id => ({
    activity_id: id,
    draw_count: counts.find(c => c.activity_id === id)?.count || 0,
    has_drawn: userDrawnIds.has(id),
  }));
}

/**
 * Charge les utilisateurs pour plusieurs IDs en une seule requête
 */
async function batchLoadUsers(userIds) {
  if (!userIds.length) return [];

  const placeholders = userIds.map(() => '?').join(',');
  return await dbAllMain(`
    SELECT id, email, json_extract(profile_data, '$.name') as name
    FROM users
    WHERE id IN (${placeholders})
  `, userIds);
}

/**
 * Enrichit les activités avec les données de draws (optimisé)
 */
async function enrichActivitiesWithDraws(activities, userId) {
  if (!activities.length) return activities;

  const activityIds = activities.map(a => a.id);
  const drawsData = await batchLoadActivityDraws(activityIds, userId);
  const drawsMap = new Map(drawsData.map(d => [d.activity_id, d]));

  return activities.map(activity => {
    const drawData = drawsMap.get(activity.id);
    return {
      ...activity,
      user_id: userId,
      draw_count: drawData?.draw_count || 0,
      has_drawn: drawData?.has_drawn || false,
    };
  });
}

/**
 * Crée un index sur les tables fréquemment requêtées
 */
async function optimizeDatabaseIndexes() {
  try {
    logger.info('Optimizing database indexes...');

    // Index sur activity_draws pour les requêtes par activity_id
    await dbGetMain(`
      CREATE INDEX IF NOT EXISTS idx_activity_draws_activity_user 
      ON activity_draws(activity_id, from_user_id)
    `);

    // Index sur activities pour les requêtes par user_id
    await dbGetMain(`
      CREATE INDEX IF NOT EXISTS idx_activities_user_date 
      ON activities(user_id, start_date DESC)
    `);

    // Index sur segment_efforts
    await dbGetMain(`
      CREATE INDEX IF NOT EXISTS idx_efforts_segment_user_time 
      ON segment_efforts(segment_id, user_id, elapsed_time)
    `);

    logger.info('Database indexes optimized');
  } catch (error) {
    logger.error('Error optimizing indexes:', error);
  }
}

module.exports = {
  BatchLoader,
  batchLoadActivityDraws,
  batchLoadUsers,
  enrichActivitiesWithDraws,
  optimizeDatabaseIndexes,
};
