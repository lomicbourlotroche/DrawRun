/**
 * ============================================================
 * WEATHER API
 * ============================================================
 * 
 * Récupération des données météo pour les activités
 * depuis l'API Open-Meteo (gratuit, pas de clé requise)
 * 
 * @module lib/api/weather.api
 */

import { client } from './client';
import type { WeatherData } from '@/types';

/**
 * Get weather data for an activity
 * @param activityId Activity ID
 * @returns Weather data with temperature, humidity, wind, and pace impact
 */
async function getActivityWeather(activityId: number): Promise<WeatherData> {
  return client.get<WeatherData>(`/api/activities/${activityId}/weather`);
}

/**
 * Get weather icon based on WMO weather code
 * @param code WMO weather code
 * @returns Icon name for lucide-react
 */
function getWeatherIcon(code: number): string {
  const iconMap: Record<number, string> = {
    0: 'sun',
    1: 'sun',
    2: 'cloud-sun',
    3: 'cloud',
    45: 'fog',
    48: 'fog',
    51: 'cloud-drizzle',
    53: 'cloud-drizzle',
    55: 'cloud-drizzle',
    61: 'cloud-rain',
    63: 'cloud-rain',
    65: 'cloud-rain',
    71: 'snowflake',
    73: 'snowflake',
    75: 'snowflake',
    77: 'snowflake',
    80: 'cloud-rain',
    81: 'cloud-rain',
    82: 'cloud-rain',
    85: 'snowflake',
    86: 'snowflake',
    95: 'cloud-lightning',
    96: 'cloud-lightning',
    99: 'cloud-lightning',
  };
  
  return iconMap[code] || 'cloud';
}

/**
 * Format pace impact for display
 * @param impact Pace impact percentage
 * @returns Formatted string
 */
function formatPaceImpact(impact: number): string {
  if (impact === 0) return 'Conditions idéales';
  if (impact <= 5) return `Impact léger (+${impact}%)`;
  if (impact <= 10) return `Impact modéré (+${impact}%)`;
  return `Impact significatif (+${impact}%)`;
}

/**
 * Get color for pace impact
 * @param impact Pace impact percentage
 * @returns Tailwind color class
 */
function getPaceImpactColor(impact: number): string {
  if (impact === 0) return 'text-success';
  if (impact <= 5) return 'text-warning';
  if (impact <= 10) return 'text-orange-500';
  return 'text-danger';
}

export const weatherApi = {
  getActivityWeather,
  getWeatherIcon,
  formatPaceImpact,
  getPaceImpactColor,
};
