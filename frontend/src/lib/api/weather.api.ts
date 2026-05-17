import { client } from './client';

/**
 * Weather data for a specific activity
 */
export interface ActivityWeather {
  id: string;
  activityId: string;
  temperature: number; // in Celsius
  humidity: number; // percentage
  windSpeed: number; // in km/h
  windDirection: number; // in degrees
  precipitation: number; // in mm
  pressure: number; // in hPa
  visibility: number; // in meters
  cloudCover: number; // percentage
  dewPoint: number; // in Celsius
  feelsLike: number; // in Celsius
  weatherCondition: string;
  weatherIcon: string;
  timestamp: string;
}

/**
 * Current weather data for a location
 */
export interface CurrentWeather {
  location: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  temperature: number; // in Celsius
  humidity: number; // percentage
  windSpeed: number; // in km/h
  windDirection: number; // in degrees
  precipitation: number; // in mm
  pressure: number; // in hPa
  visibility: number; // in meters
  cloudCover: number; // percentage
  dewPoint: number; // in Celsius
  feelsLike: number; // in Celsius
  weatherCondition: string;
  weatherIcon: string;
  timestamp: string;
  uvIndex: number;
  sunrise?: string;
  sunset?: string;
}

export const weatherApi = {
  /**
   * Get weather data for a specific activity
   * @param activityId The ID of the activity
   * @returns Weather data for the activity
   */
  async getActivityWeather(activityId: string): Promise<ActivityWeather> {
    return client.get(`/api/weather/activity/${activityId}`);
  },

  /**
   * Get current weather data for a location
   * @param lat Latitude of the location
   * @param lon Longitude of the location
   * @returns Current weather data for the location
   */
  async getCurrentWeather(lat: number, lon: number): Promise<CurrentWeather> {
    return client.get(`/api/weather/current?lat=${lat}&lon=${lon}`);
  },
};
