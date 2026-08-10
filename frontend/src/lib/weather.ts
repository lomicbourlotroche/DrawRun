'use client';

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  icon: string;
}

export async function fetchWeather(lat: number, lng: number): Promise<WeatherData | null> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const current = data.current;
    if (!current) return null;

    const conditionMap: Record<number, { label: string; icon: string }> = {
      0: { label: 'Dégagé', icon: 'sun' },
      1: { label: 'Peu nuageux', icon: 'cloud-sun' },
      2: { label: 'Nuageux', icon: 'cloud' },
      3: { label: 'Couvert', icon: 'clouds' },
      45: { label: 'Brouillard', icon: 'fog' },
      48: { label: 'Brouillard givrant', icon: 'fog' },
      51: { label: 'Bruine légère', icon: 'drizzle' },
      53: { label: 'Bruine modérée', icon: 'drizzle' },
      55: { label: 'Bruine intense', icon: 'drizzle' },
      61: { label: 'Pluie légère', icon: 'rain' },
      63: { label: 'Pluie modérée', icon: 'rain' },
      65: { label: 'Pluie intense', icon: 'rain-heavy' },
      66: { label: 'Pluie verglaçante', icon: 'sleet' },
      71: { label: 'Neige légère', icon: 'snow' },
      73: { label: 'Neige modérée', icon: 'snow' },
      75: { label: 'Neige intense', icon: 'snow' },
      80: { label: 'Averses légères', icon: 'rain' },
      81: { label: 'Averses modérées', icon: 'rain' },
      82: { label: 'Averses violentes', icon: 'rain-heavy' },
      95: { label: 'Orage', icon: 'thunderstorm' },
      96: { label: 'Orage avec grêle', icon: 'thunderstorm' },
    };

    const condition = conditionMap[current.weather_code] || { label: 'Inconnu', icon: 'question' };

    return {
      temperature: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      condition: condition.label,
      icon: condition.icon,
    };
  } catch {
    return null;
  }
}
