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
    run: '#007AFF',
    bike: '#FF9500',
    swim: '#5856D6',
  };
  return colors[sport] || '#007AFF';
}

export function getZoneColor(zone: number): string {
  const colors = [
    '#64748B', // Zone 1 - Recovery
    '#34C759', // Zone 2 - Endurance
    '#007AFF', // Zone 3 - Tempo
    '#FF9500', // Zone 4 - Threshold
    '#FF3B30', // Zone 5 - VO2max
    '#FF2D55', // Zone 6 - Anaerobic
    '#AF52DE', // Zone 7 - Neuromuscular
  ];
  return colors[zone - 1] || '#64748B';
}

export function calculateReadinessColor(score: number): string {
  if (score >= 80) return '#34C759';
  if (score >= 60) return '#007AFF';
  if (score >= 40) return '#FF9500';
  return '#FF3B30';
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
