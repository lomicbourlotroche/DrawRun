'use strict';

/* eslint-disable unused-imports/no-unused-vars, security/detect-non-literal-fs-filename */

const express = require('express');
const router = express.Router({ mergeParams: true });
const { verifyToken } = require('../auth');
const { logger } = require('../logger');
const { getUserDb } = require('../database');
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const CACHE_DIR = path.join(__dirname, '../../tmp/share-images');
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * GET /api/activities/:id/share-image
 * Generate a shareable image for an activity
 * @route GET /api/activities/:id/share-image
 * @returns {image/png} Generated activity summary image
 */
router.get('/share-image', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const activityId = parseInt(req.params.id);

    if (!activityId || isNaN(activityId)) {
      return res.status(400).json({ error: 'Invalid activity ID' });
    }

    const userDb = await getUserDb(userId);

    // Get activity details
    const activityResult = userDb.exec(`
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
        a.type,
        json_extract(u.profile_data, '$.name') as athlete_name
      FROM activities a
      LEFT JOIN users u ON u.id = ?
      WHERE a.id = ?
    `, [userId, activityId]);

    if (!activityResult[0]?.values?.[0]) {
      return res.status(404).json({ error: 'Activité non trouvée' });
    }

    const activity = activityResult[0].values[0];
    const activityUserId = activity[0]; // activity.id
    
    // Verify activity belongs to user (or check ownership)
    // For now, we assume if it's in the user's DB, they own it

    // Check cache
    const cacheFileName = `activity-${activityId}-user-${userId}.png`;
    const cachePath = path.join(CACHE_DIR, cacheFileName);
    
    let useCache = false;
    try {
      const stats = fs.statSync(cachePath);
      const age = Date.now() - stats.mtime.getTime();
      if (age < CACHE_TTL_MS) {
        useCache = true;
        logger.info('[ShareImage] Cache hit', { activityId });
      }
    } catch {
      // Cache miss or file doesn't exist
    }

    if (useCache) {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="drawrun-activity-${activityId}.png"`);
      return fs.createReadStream(cachePath).pipe(res);
    }

    // Generate new image
    const canvas = createCanvas(1080, 1080);
    const ctx = canvas.getContext('2d');

    // Determine gradient colors based on activity type
    const typeColors = {
      'Run': { start: '#3b82f6', end: '#1d4ed8' },
      'Ride': { start: '#f97316', end: '#c2410c' },
      'Swim': { start: '#06b6d4', end: '#0e7490' },
      'default': { start: '#8b5cf6', end: '#6d28d9' },
    };
    
    const colors = typeColors[activity[9]] || typeColors.default;

    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
    gradient.addColorStop(0, colors.start);
    gradient.addColorStop(1, colors.end);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1080);

    // Draw decorative circles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(1080, 0, 400, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(0, 1080, 300, 0, Math.PI * 2);
    ctx.fill();

    // Draw logo/header
    ctx.fillStyle = 'white';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('DR', 60, 80);
    
    ctx.font = '24px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText('DrawRun', 120, 80);

    // Draw activity name
    ctx.font = 'bold 56px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    
    // Truncate long names
    let displayName = activity[1];
    if (ctx.measureText(displayName).width > 960) {
      while (ctx.measureText(displayName + '...').width > 960 && displayName.length > 0) {
        displayName = displayName.slice(0, -1);
      }
      displayName += '...';
    }
    ctx.fillText(displayName, 60, 200);

    // Draw date
    const date = new Date(activity[8]);
    const dateStr = date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    
    ctx.font = '28px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(dateStr, 60, 250);

    // Draw main stats
    const statsY = 400;
    const statSpacing = 320;
    
    // Distance
    ctx.textAlign = 'center';
    ctx.font = 'bold 72px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText((activity[2] / 1000).toFixed(2), 60 + statSpacing * 0, statsY);
    ctx.font = '24px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('km', 60 + statSpacing * 0, statsY + 40);

    // Duration
    const duration = activity[3] || activity[4] || 0;
    const hours = Math.floor(duration / 3600);
    const mins = Math.floor((duration % 3600) / 60);
    const secs = duration % 60;
    const timeStr = hours > 0 
      ? `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${mins}:${secs.toString().padStart(2, '0')}`;
    
    ctx.font = 'bold 72px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText(timeStr, 60 + statSpacing * 1, statsY);
    ctx.font = '24px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('durée', 60 + statSpacing * 1, statsY + 40);

    // Pace
    let paceStr = '--';
    if (activity[6]) {
      const paceSecPerKm = 3600 / activity[6];
      const paceMins = Math.floor(paceSecPerKm / 60);
      const paceSecs = Math.round(paceSecPerKm % 60);
      paceStr = `${paceMins}:${paceSecs.toString().padStart(2, '0')}`;
    }
    
    ctx.font = 'bold 72px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText(paceStr, 60 + statSpacing * 2, statsY);
    ctx.font = '24px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('/km', 60 + statSpacing * 2, statsY + 40);

    // Draw divider line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 500);
    ctx.lineTo(1020, 500);
    ctx.stroke();

    // Draw additional stats
    const addStatsY = 600;
    
    // Elevation
    if (activity[5]) {
      ctx.textAlign = 'left';
      ctx.font = '36px Arial';
      ctx.fillStyle = 'white';
      ctx.fillText(`+${Math.round(activity[5])} m`, 60, addStatsY);
      ctx.font = '20px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('Dénivelé', 60, addStatsY + 30);
    }

    // Heart rate
    if (activity[7]) {
      ctx.textAlign = 'right';
      ctx.font = '36px Arial';
      ctx.fillStyle = 'white';
      ctx.fillText(`${Math.round(activity[7])} bpm`, 1020, addStatsY);
      ctx.font = '20px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('FC moyenne', 1020, addStatsY + 30);
    }

    // Draw athlete name
    if (activity[10]) {
      ctx.textAlign = 'center';
      ctx.font = '32px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText(activity[10], 540, 900);
    }

    // Draw footer
    ctx.textAlign = 'center';
    ctx.font = '24px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('drawrun.fr', 540, 1000);

    // Export to PNG
    const buffer = canvas.toBuffer('image/png');
    
    // Cache the image
    fs.writeFileSync(cachePath, buffer);

    // Send response
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="drawrun-activity-${activityId}.png"`);
    res.send(buffer);

    logger.info('[ShareImage] Generated image', { activityId, userId });

  } catch (error) {
    logger.error('[ShareImage] Error generating image', { error: error.message });
    res.status(500).json({ error: 'Failed to generate share image' });
  }
});

module.exports = router;
