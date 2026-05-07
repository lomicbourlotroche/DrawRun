import { client } from './client';

export const weatherApi = {
  async getActivityWeather(activityId: string): Promise<Record<string, unknown>> {
    return client.get(`/api/weather/activity/${activityId}`);
  },

  async getCurrentWeather(lat: number, lon: number): Promise<Record<string, unknown>> {
    return client.get(`/api/weather/current?lat=${lat}&lon=${lon}`);
  },
};
