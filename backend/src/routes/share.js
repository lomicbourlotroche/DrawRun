'use strict';

const express = require('express');
const router = express.Router({ mergeParams: true });
const { verifyToken } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const { getUserDb, dbGetUser, dbRunMain } = require('../database');
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const CACHE_DIR = path.join(__dirname, '../../tmp/share-images');
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Available image sizes
const IMAGE_SIZES = {
  small: { width: 512, height: 512 },
  medium: { width: 1080, height: 1080 },
  large: { width: 2048, height: 2048 },
};

// Default size
const DEFAULT_SIZE = 'medium';

// Lazy initialization — defer filesystem ops from module load time
let _cacheInitialized = false;
let _cleanupTimer = null;

function ensureCacheInit() {
  if (_cacheInitialized) return;
  _cacheInitialized = true;

  // Ensure cache directory exists
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  // Setup periodic cleanup (every hour)
  _cleanupTimer = setInterval(cleanupCache, CACHE_TTL_MS);

  // Initial cleanup on first use
  cleanupCache();
}

/**
 * Clean up expired cache files
 */
function cleanupCache() {
  if (!_cacheInitialized) return;
  try {
    const files = fs.readdirSync(CACHE_DIR);
    const now = Date.now();
    let deletedCount = 0;

    files.forEach(file => {
      try {
        const filePath = path.join(CACHE_DIR, file);
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        const stats = fs.statSync(filePath);
        const age = now - stats.mtime.getTime();

        if (age > CACHE_TTL_MS) {
          // eslint-disable-next-line security/detect-non-literal-fs-filename
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      } catch (err) {
        // File may have been deleted or inaccessible
        logger.warn('Cache cleanup error for file:', { file, error: err.message });
      }
    });

    if (deletedCount > 0) {
      logger.info('Cache cleanup completed', { deletedFiles: deletedCount });
    }
  } catch (err) {
    logger.error('Cache cleanup failed:', { error: err.message });
  }
}

/**
 * Log an activity share event to the database
 */
async function logShareEvent(userId, activityId, shareType, metadata = {}) {
  try {
    await dbRunMain(`
      INSERT INTO activity_shares (user_id, activity_id, share_type, metadata, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [userId, activityId, shareType, JSON.stringify(metadata)]);
    logger.info('Activity share logged', { userId, activityId, shareType });
  } catch (err) {
    logger.error('Failed to log share event:', { error: err.message });
  }
}

/**
 * Generate share image canvas
 * @param {Object} activity - Activity data (object with named properties)
 * @param {string} size - 'small', 'medium', 'large'
 * @returns {canvas} Canvas object
 */
function generateShareCanvas(activity, size = DEFAULT_SIZE) {
  const dimensions = IMAGE_SIZES[size] || IMAGE_SIZES[DEFAULT_SIZE];
  const canvas = createCanvas(dimensions.width, dimensions.height);
  const ctx = canvas.getContext('2d');

  // Extract named properties from activity object
  const { name, distance, moving_time, elapsed_time, total_elevation_gain, average_speed, average_heartrate, start_date, type, athleteName } = activity;

  // Determine gradient colors based on activity type
  const typeColors = {
    'Run': { start: '#3b82f6', end: '#1d4ed8' },
    'Ride': { start: '#f97316', end: '#c2410c' },
    'Swim': { start: '#06b6d4', end: '#0e7490' },
    'Hike': { start: '#10b981', end: '#059669' },
    'Walk': { start: '#8b5cf6', end: '#6d28d9' },
    'default': { start: '#8b5cf6', end: '#6d28d9' },
  };

  const colors = typeColors[type] || typeColors.default;

  // Draw gradient background
  const gradient = ctx.createLinearGradient(0, 0, dimensions.width, dimensions.height);
  gradient.addColorStop(0, colors.start);
  gradient.addColorStop(1, colors.end);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, dimensions.width, dimensions.height);

  // Draw decorative circles (scaled)
  const circleScale = dimensions.width / 1080;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.arc(dimensions.width, 0, 400 * circleScale, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, dimensions.height, 300 * circleScale, 0, Math.PI * 2);
  ctx.fill();

  // Draw logo/header (scaled)
  const logoScale = dimensions.width / 1080;
  ctx.fillStyle = 'white';
  ctx.font = `bold ${40 * logoScale}px Arial`;
  ctx.textAlign = 'left';
  ctx.fillText('DR', 60 * logoScale, 80 * logoScale);

  ctx.font = `${24 * logoScale}px Arial`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillText('DrawRun', 120 * logoScale, 80 * logoScale);

  // Draw activity name (scaled)
  const textScale = dimensions.width / 1080;
  ctx.font = `bold ${56 * textScale}px Arial`;
  ctx.fillStyle = 'white';
  ctx.textAlign = 'left';

  // Truncate long names
  let displayName = name || 'Activité';
  const maxWidth = dimensions.width - (120 * textScale);
  if (ctx.measureText(displayName).width > maxWidth) {
    while (ctx.measureText(displayName + '...').width > maxWidth && displayName.length > 0) {
      displayName = displayName.slice(0, -1);
    }
    displayName += '...';
  }
  ctx.fillText(displayName, 60 * textScale, 200 * textScale);

  // Draw date
  const date = new Date(start_date);
  const dateStr = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  ctx.font = `${28 * textScale}px Arial`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillText(dateStr, 60 * textScale, 250 * textScale);

  // Draw main stats (scaled)
  const statsY = 400 * textScale;
  const statSpacing = (dimensions.width - 120 * textScale) / 3;

  // Helper function to draw stat
  const drawStat = (value, label, xOffset, yOffset) => {
    ctx.textAlign = 'center';
    ctx.font = `bold ${72 * textScale}px Arial`;
    ctx.fillStyle = 'white';
    ctx.fillText(value, 60 * textScale + xOffset * statSpacing, yOffset);
    
    ctx.font = `${24 * textScale}px Arial`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(label, 60 * textScale + xOffset * statSpacing, yOffset + 40 * textScale);
    ctx.textAlign = 'left';
  };

  // Distance
  const distanceKm = (distance / 1000).toFixed(2);
  drawStat(distanceKm, 'km', 0, statsY);

  // Duration
  const duration = moving_time || elapsed_time || 0;
  const hours = Math.floor(duration / 3600);
  const mins = Math.floor((duration % 3600) / 60);
  const secs = duration % 60;
  const timeStr = hours > 0
    ? `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    : `${mins}:${secs.toString().padStart(2, '0')}`;
  drawStat(timeStr, 'durée', 1, statsY);

  // Pace
  let paceStr = '--';
  if (average_speed) {
    const paceSecPerKm = 3600 / average_speed;
    const paceMins = Math.floor(paceSecPerKm / 60);
    const paceSecs = Math.round(paceSecPerKm % 60);
    paceStr = `${paceMins}:${paceSecs.toString().padStart(2, '0')}`;
  }
  drawStat(paceStr, '/km', 2, statsY);

  // Draw divider line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2 * textScale;
  ctx.beginPath();
  ctx.moveTo(60 * textScale, 500 * textScale);
  ctx.lineTo(dimensions.width - 60 * textScale, 500 * textScale);
  ctx.stroke();

  // Draw additional stats
  const addStatsY = 600 * textScale;

  // Elevation
  if (total_elevation_gain) {
    ctx.textAlign = 'left';
    ctx.font = `${36 * textScale}px Arial`;
    ctx.fillStyle = 'white';
      ctx.fillText(`+${Math.round(total_elevation_gain)} m`, 60 * textScale, addStatsY);
    ctx.font = `${20 * textScale}px Arial`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('Dénivelé', 60 * textScale, addStatsY + 30 * textScale);
  }

  // Heart rate
  if (average_heartrate) {
    ctx.textAlign = 'right';
    ctx.font = `${36 * textScale}px Arial`;
    ctx.fillStyle = 'white';
      ctx.fillText(`${Math.round(average_heartrate)} bpm`, dimensions.width - 60 * textScale, addStatsY);
    ctx.font = `${20 * textScale}px Arial`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('FC moyenne', dimensions.width - 60 * textScale, addStatsY + 30 * textScale);
  }

  // Draw athlete name
  if (athleteName) {
    ctx.textAlign = 'center';
    ctx.font = `${32 * textScale}px Arial`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(athleteName, dimensions.width / 2, dimensions.height - 180 * textScale);
  }

  // Draw footer
  ctx.textAlign = 'center';
  ctx.font = `${24 * textScale}px Arial`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fillText('drawrun.fr', dimensions.width / 2, dimensions.height - 80 * textScale);

  return canvas;
}

/**
 * Generate cache filename based on parameters
 */
function getCacheFilename(activityId, userId, size) {
  return `activity-${activityId}-user-${userId}-${size}.png`;
}

/**
 * GET /api/activities/:id/share-image
 * Generate a shareable image for an activity
 * @route GET /api/activities/:id/share-image
 * @query {string} size - 'small' (512x512), 'medium' (1080x1080), 'large' (2048x2048)
 * @query {boolean} download - If true, force download (default: true)
 * @returns {image/png} Generated activity summary image
 */
router.get('/share-image', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const activityId = parseInt(req.params.id);
    const { size = DEFAULT_SIZE, download = true } = req.query;

    // Validate size
    const validSizes = Object.keys(IMAGE_SIZES);
    const actualSize = validSizes.includes(size) ? size : DEFAULT_SIZE;

    if (!activityId || isNaN(activityId)) {
      return res.status(400).json({ error: 'Invalid activity ID' });
    }

    const userDb = await getUserDb(userId);

    // Get activity details
    const activityRow = await dbGetUser(userDb, `
      SELECT 
        a.id,
        a.name,
        a.distance,
        a.moving_time,
        a.elapsed_time,
        a.total_elevation_gain,
        a.average_speed,
        a.average_heartrate,
        a.start_date,
        a.type
      FROM activities a
      WHERE a.id = ?
    `, [activityId]);

    if (!activityRow) {
      return res.status(404).json({ error: 'Activité non trouvée' });
    }

    const dbMain = require('../database/database').dbGetMain();
    // Get athlete name from main DB
    const userRow = await dbMain.prepare('SELECT profile_data FROM users WHERE id = ?').get(userId);
    let athleteName = null;
    if (userRow?.profile_data) {
      try { athleteName = JSON.parse(userRow.profile_data).name || null; } catch { /* ignore */ }
    }

    // Build activity object with named properties (no array-index access)
    const activity = { ...activityRow, athleteName };

    // Ensure cache directory is initialized (lazy, not at module load)
    ensureCacheInit();

    // Check cache
    const cacheFileName = getCacheFilename(activityId, userId, actualSize);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- cacheFileName is internal
    const cachePath = path.join(CACHE_DIR, cacheFileName);
    
    let useCache = false;
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const stats = fs.statSync(cachePath);
      const age = Date.now() - stats.mtime.getTime();
      if (age < CACHE_TTL_MS) {
        useCache = true;
        logger.info('[ShareImage] Cache hit', { activityId, size: actualSize });
      }
    } catch {
      // Cache miss or file doesn't exist
    }

    if (useCache) {
      res.setHeader('Content-Type', 'image/png');
      if (download !== 'false') {
        res.setHeader('Content-Disposition', `attachment; filename="drawrun-activity-${activityId}-${actualSize}.png"`);
      }
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      return fs.createReadStream(cachePath).pipe(res);
    }

    // Generate new image
    const canvas = generateShareCanvas(activity, actualSize);
    const buffer = canvas.toBuffer('image/png');
    
    // Cache the image
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(cachePath, buffer);

    // Log the share event
    await logShareEvent(userId, activityId, 'image_generation', {
      size: actualSize,
      download: download !== 'false',
    });

    // Send response
    res.setHeader('Content-Type', 'image/png');
    if (download !== 'false') {
      res.setHeader('Content-Disposition', `attachment; filename="drawrun-activity-${activityId}-${actualSize}.png"`);
    }

    res.send(buffer);

    logger.info('[ShareImage] Generated image', { activityId, userId, size: actualSize });

  } catch (error) {
    logger.error('[ShareImage] Error generating image', { error: error.message });
    res.status(500).json({ error: 'Failed to generate share image' });
  }
});

/**
 * GET /api/activities/:id/share-image/preview
 * Get share image URL for preview (no download header)
 * @route GET /api/activities/:id/share-image/preview
 * @query {string} size - 'small', 'medium', 'large'
 * @returns {image/png} Image for preview
 */
router.get('/share-image/preview', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const activityId = parseInt(req.params.id);
    const { size = DEFAULT_SIZE } = req.query;

    // Validate size
    const validSizes = Object.keys(IMAGE_SIZES);
    const actualSize = validSizes.includes(size) ? size : DEFAULT_SIZE;

    if (!activityId || isNaN(activityId)) {
      return res.status(400).json({ error: 'Invalid activity ID' });
    }

    // Reuse the main share-image endpoint logic but without download header
    const userDb = await getUserDb(userId);

    const activityRow = await dbGetUser(userDb, `
      SELECT 
        a.id,
        a.name,
        a.distance,
        a.moving_time,
        a.elapsed_time,
        a.total_elevation_gain,
        a.average_speed,
        a.average_heartrate,
        a.start_date,
        a.type
      FROM activities a
      WHERE a.id = ?
    `, [activityId]);

    if (!activityRow) {
      return res.status(404).json({ error: 'Activité non trouvée' });
    }

    const dbMain = require('../database/database').dbGetMain();
    const userRow = await dbMain.prepare('SELECT profile_data FROM users WHERE id = ?').get(userId);
    let athleteName = null;
    if (userRow?.profile_data) {
      try { athleteName = JSON.parse(userRow.profile_data).name || null; } catch { /* ignore */ }
    }

    // Build activity object with named properties
    const activity = { ...activityRow, athleteName };

    // Ensure cache directory is initialized (lazy, not at module load)
    ensureCacheInit();

    // Check cache
    const cacheFileName = getCacheFilename(activityId, userId, actualSize);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- cacheFileName is internal
    const cachePath = path.join(CACHE_DIR, cacheFileName);
    
    let useCache = false;
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const stats = fs.statSync(cachePath);
      const age = Date.now() - stats.mtime.getTime();
      if (age < CACHE_TTL_MS) {
        useCache = true;
      }
    } catch {
      // Cache miss
    }

    if (useCache) {
      res.setHeader('Content-Type', 'image/png');
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      return fs.createReadStream(cachePath).pipe(res);
    }

    // Generate new image
    const canvas = generateShareCanvas(activity, actualSize);
    const buffer = canvas.toBuffer('image/png');
    
    // Cache the image
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(cachePath, buffer);

    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);

  } catch (error) {
    logger.error('[ShareImage] Preview error', { error: error.message });
    res.status(500).json({ error: 'Failed to generate preview' });
  }
});

/**
 * POST /api/activities/:id/share
 * Log a share event (for analytics)
 * @route POST /api/activities/:id/share
 * @body {string} share_type - Type of share: 'social', 'link', 'image', 'story'
 * @body {string} platform - Optional platform: 'twitter', 'facebook', 'instagram', 'whatsapp', 'native'
 * @returns {object} Success confirmation
 */
router.post('/share', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const activityId = parseInt(req.params.id);
    const { share_type, platform } = req.body;

    if (!activityId || isNaN(activityId)) {
      return res.status(400).json({ error: 'Invalid activity ID' });
    }

    if (!share_type) {
      return res.status(400).json({ error: 'share_type is required' });
    }

    // Verify activity exists and belongs to user
    const userDb = await getUserDb(userId);
    const activity = await dbGetUser(userDb, 'SELECT id FROM activities WHERE id = ?', [activityId]);
    
    if (!activity) {
      return res.status(404).json({ error: 'Activité non trouvée' });
    }

    // Log the share event
    await logShareEvent(userId, activityId, share_type, {
      platform: platform || null,
      user_agent: req.headers['user-agent'] || null,
    });

    res.json({ success: true, message: 'Share event logged' });
  } catch (error) {
    logger.error('[Share] Error logging share', { error: error.message });
    res.status(500).json({ error: 'Failed to log share event' });
  }
});

/**
 * GET /api/activities/:id/share/stats
 * Get share statistics for an activity
 * @route GET /api/activities/:id/share/stats
 * @returns {object} Share statistics
 */
router.get('/share/stats', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const activityId = parseInt(req.params.id);

    if (!activityId || isNaN(activityId)) {
      return res.status(400).json({ error: 'Invalid activity ID' });
    }

    // Verify activity exists
    const userDb = await getUserDb(userId);
    const activity = await dbGetUser(userDb, 'SELECT id FROM activities WHERE id = ?', [activityId]);
    
    if (!activity) {
      return res.status(404).json({ error: 'Activité non trouvée' });
    }

    // Get share stats from main DB
    const { dbAllMain } = require('../database');
    const stats = await dbAllMain(
      'SELECT share_type, platform, COUNT(*) as count, MAX(created_at) as last_shared FROM activity_shares WHERE user_id = ? AND activity_id = ? GROUP BY share_type, platform',
      [userId, activityId]
    );

    const totalShares = stats.reduce((sum, s) => sum + s.count, 0);

    res.json({
      success: true,
      total_shares: totalShares,
      shares_by_type: stats,
      activity_id: activityId,
    });
  } catch (error) {
    logger.error('[Share] Error getting stats', { error: error.message });
    res.status(500).json({ error: 'Failed to get share statistics' });
  }
});

// Export router and cleanup timer for test teardown
module.exports = router;
module.exports._cleanupTimer = _cleanupTimer;
module.exports.ensureCacheInit = ensureCacheInit;
