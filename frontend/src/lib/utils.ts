/* eslint-disable unused-imports/no-unused-vars */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function formatPace(secondsPerKm: number): string {
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60);
  return `${minutes}'${seconds.toString().padStart(2, '0')}`;
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${meters} m`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

export function getSportIcon(sport: string): string {
  const icons: Record<string, string> = {
    run: '🏃',
    bike: '🚴',
    swim: '🏊',
  };
  return icons[sport] || '🏃';
}

export function getSportColor(sport: string): string {
  const colors: Record<string, string> = {
    run: 'var(--primary)',
    bike: 'var(--warning)',
    swim: 'var(--secondary)',
  };
  return colors[sport] || 'var(--primary)';
}

export function getZoneColor(zone: number): string {
  const colors = [
    'var(--muted)', // Zone 1 - Recovery
    'var(--success)', // Zone 2 - Endurance
    'var(--primary)', // Zone 3 - Tempo
    'var(--warning)', // Zone 4 - Threshold
    'var(--danger)', // Zone 5 - VO2max
    'var(--danger)', // Zone 6 - Anaerobic
    'var(--secondary)', // Zone 7 - Neuromuscular
  ];
  return colors[zone - 1] || 'var(--muted)';
}

export function calculateReadinessColor(score: number): string {
  if (score >= 80) return 'var(--success)';
  if (score >= 60) return 'var(--primary)';
  if (score >= 40) return 'var(--warning)';
  return 'var(--danger)';
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

export function encodePolyline(
  points: ([number, number] | { lat: number; lng: number })[]
): string {
  if (!points || points.length === 0) return '';

  let result = '';
  let lat = 0;
  let lng = 0;

  const encodeValue = (v: number): string => {
    v = v < 0 ? ~(v << 1) : v << 1;
    let str = '';
    while (v >= 0x20) {
      str += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
      v >>= 5;
    }
    str += String.fromCharCode(v + 63);
    return str;
  };

  for (const point of points) {
    const pLat = Array.isArray(point) ? point[0] : point.lat;
    const pLng = Array.isArray(point) ? point[1] : point.lng;

    const dLat = Math.round((pLat - lat) * 1e5);
    const dLng = Math.round((pLng - lng) * 1e5);

    lat += dLat / 1e5;
    lng += dLng / 1e5;

    result += encodeValue(dLat);
    result += encodeValue(dLng);
  }

  return result;
}
