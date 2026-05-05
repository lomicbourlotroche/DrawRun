'use strict';

const express = require('express');
const router = express.Router({ mergeParams: true });
const { verifyToken } = require('../auth');
const { logger } = require('../logger');
const { getUserDb, dbGetMain } = require('../database');
const axios = require('axios');

/**
 * WMO Weather code mapping
 */
const WMO_CODES = {
  0: { label: 'Ensoleillé', icon: 'sun' },
  1: { label: 'Principalement ensoleillé', icon: 'sun' },
  2: { label: 'Partiellement nuageux', icon: 'cloud-sun' },
  3: { label: 'Nuageux', icon: 'cloud' },
  45: { label: 'Brouillard', icon: 'fog' },
  48: { label: 'Brouillard givrant', icon: 'fog' },
  51: { label: 'Bruine légère', icon: 'cloud-drizzle' },
  53: { label: 'Bruine modérée', icon: 'cloud-drizzle' },
  55: { label: 'Bruine dense', icon: 'cloud-drizzle' },
  61: { label: 'Pluie légère', icon: 'cloud-rain' },
  63: { label: 'Pluie modérée', icon: 'cloud-rain' },
  65: { label: 'Pluie forte', icon: 'cloud-rain' },
  71: { label: 'Neige légère', icon: 'snowflake' },
  73: { label: 'Neige modérée', icon: 'snowflake' },
  75: { label: 'Neige forte', icon: 'snowflake' },
  77: { label: 'Grains de neige', icon: 'snowflake' },
  80: { label: 'Averses légères', icon: 'cloud-rain' },
  81: { label: 'Averses modérées', icon: 'cloud-rain' },
  82: { label: 'Averses violentes', icon: 'cloud-rain' },
  85: { label: 'Averses de neige légères', icon: 'snowflake' },
  86: { label: 'Averses de neige fortes', icon: 'snowflake' },
  95: { label: 'Orage', icon: 'cloud-lightning' },
  96: { label: 'Orage avec grêle', icon: 'cloud-lightning' },
  99: { label: 'Orage violent', icon: 'cloud-lightning' },
};

/**
 * GET /api/activities/:id/weather
 * Get weather data for an activity
 * @route GET /api/activities/:id/weather
 * @returns {object} Weather data with temperature, humidity, wind, and pace impact
 */
router.get('/weather', verifyToken, async (req, res) => {
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
        id,
        start_date,
        start_latlng,
        json_extract(start_latlng, '$[0]') as lat,
        json_extract(start_latlng, '$[1]') as lng
      FROM activities 
      WHERE id = ?
    `, [activityId]);

    if (!activityResult[0]?.values?.[0]) {
      return res.status(404).json({ error: 'Activité non trouvée' });
    }

    const activity = activityResult[0].values[0];
    const lat = activity[3];
    const lng = activity[4];

    if (!lat || !lng) {
      return res.status(404).json({ 
        error: 'Aucune coordonnée GPS disponible pour cette activité' 
      });
    }

    const startDate = activity[1];
    const activityDate = new Date(startDate);
    const dateStr = activityDate.toISOString().split('T')[0];

    // Check cache first
    const cacheResult = userDb.exec(`
      SELECT data, fetched_at 
      FROM weather_cache 
      WHERE activity_id = ?
    `, [activityId]);

    if (cacheResult[0]?.values?.[0]) {
      const cachedData = JSON.parse(cacheResult[0].values[0][0]);
      logger.info('[Weather] Cache hit for activity', { activityId });
      return res.json({ ...cachedData, cached: true });
    }

    // Fetch from Open-Meteo API
    try {
      const response = await axios.get('https://archive-api.open-meteo.com/v1/archive', {
        params: {
          latitude: lat,
          longitude: lng,
          start_date: dateStr,
          end_date: dateStr,
          hourly: 'temperature_2m,relativehumidity_2m,windspeed_10m,weathercode',
          timezone: 'auto',
        },
        timeout: 5000,
      });

      if (!response.data?.hourly) {
        throw new Error('Invalid response from Open-Meteo');
      }

      const hourly = response.data.hourly;
      const hour = activityDate.getHours();

      // Find closest hour index
      let closestHourIdx = 0;
      let minDiff = Infinity;
      for (let i = 0; i < hourly.time.length; i++) {
        const dataHour = new Date(hourly.time[i]).getHours();
        const diff = Math.abs(dataHour - hour);
        if (diff < minDiff) {
          minDiff = diff;
          closestHourIdx = i;
        }
      }

      const temperature = hourly.temperature_2m[closestHourIdx];
      const humidity = hourly.relativehumidity_2m[closestHourIdx];
      const windSpeed = hourly.windspeed_10m[closestHourIdx];
      const weatherCode = hourly.weathercode[closestHourIdx];

      // Calculate pace impact
      let paceImpact = 0;

      // Temperature impact
      if (temperature > 25) {
        paceImpact += Math.min((temperature - 25) * 3, 15); // +3% per degree, max +15%
      } else if (temperature < 5) {
        paceImpact += Math.min((5 - temperature) * 1, 5); // +1% per degree, max +5%
      }

      // Wind impact
      if (windSpeed > 20) {
        paceImpact += Math.min(Math.floor((windSpeed - 20) / 10) * 2, 8); // +2% per 10km/h, max +8%
      }

      const weatherInfo = WMO_CODES[weatherCode] || { label: 'Inconnu', icon: 'cloud' };

      const weatherData = {
        temperature,
        humidity,
        windSpeed,
        weatherCode,
        weatherLabel: weatherInfo.label,
        paceImpact: Math.round(paceImpact * 10) / 10,
        cached: false,
      };

      // Cache the result
      userDb.run(`
        INSERT INTO weather_cache (activity_id, data, fetched_at)
        VALUES (?, ?, ?)
      `, [activityId, JSON.stringify(weatherData), new Date().toISOString()]);

      logger.info('[Weather] Fetched and cached weather for activity', { 
        activityId, 
        temperature, 
        weatherCode 
      });

      res.json(weatherData);

    } catch (apiError) {
      logger.error('[Weather] Open-Meteo API error', { 
        error: apiError.message,
        activityId 
      });
      res.status(503).json({ 
        error: 'Service météo temporairement indisponible',
        message: 'Impossible de récupérer les données météo' 
      });
    }

  } catch (error) {
    logger.error('[Weather] Error getting weather', { error: error.message });
    res.status(500).json({ error: 'Failed to get weather data' });
  }
});

module.exports = router;
