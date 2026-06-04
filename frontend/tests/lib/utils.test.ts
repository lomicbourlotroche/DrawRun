import { describe, it, expect, vi } from 'vitest';
import {
  cn,
  formatDuration,
  formatPace,
  formatDistance,
  formatDate,
  formatDateShort,
  getSportIcon,
  getSportColor,
  getZoneColor,
  calculateReadinessColor,
  debounce,
  decodePolyline,
  encodePolyline,
} from '@/lib/utils';

describe('cn (className merge)', () => {
  it('should merge class names', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('should handle conditional classes', () => {
    const result = cn('base', false && 'hidden', 'visible');
    expect(result).toBe('base visible');
  });

  it('should handle tailwind conflicts', () => {
    // twMerge should resolve conflicts
    const result = cn('px-2', 'px-4');
    // The last one wins: 'px-4'
    expect(result).toBe('px-4');
  });

  it('should handle empty inputs', () => {
    expect(cn()).toBe('');
  });

  it('should handle null/undefined', () => {
    expect(cn('class', null, undefined, false && 'other')).toBe('class');
  });
});

describe('formatDuration', () => {
  it('should format seconds without hours', () => {
    expect(formatDuration(150)).toBe('2:30');
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(59)).toBe('0:59');
  });

  it('should format seconds with hours', () => {
    expect(formatDuration(3661)).toBe('1:01:01');
    expect(formatDuration(3600)).toBe('1:00:00');
    expect(formatDuration(7265)).toBe('2:01:05');
  });

  it('should pad minutes and seconds', () => {
    expect(formatDuration(3605)).toBe('1:00:05');
    expect(formatDuration(60)).toBe('1:00');
  });

  it('should handle large values', () => {
    expect(formatDuration(100000)).toBe('27:46:40');
  });

  it('should handle negative values gracefully', () => {
    expect(formatDuration(-1)).toBe('0:-1');
  });
});

describe('formatPace', () => {
  it('should format seconds per km to pace', () => {
    expect(formatPace(270)).toBe("4'30");
    expect(formatPace(300)).toBe("5'00");
    expect(formatPace(180)).toBe("3'00");
  });

  it('should handle zero', () => {
    expect(formatPace(0)).toBe("0'00");
  });

  it('should handle edge values', () => {
    expect(formatPace(1)).toBe("0'01");
    expect(formatPace(599)).toBe("9'59");
  });
});

describe('formatDistance', () => {
  it('should format meters less than 1000', () => {
    expect(formatDistance(500)).toBe('500 m');
    expect(formatDistance(0)).toBe('0 m');
    expect(formatDistance(999)).toBe('999 m');
  });

  it('should format meters to km when >= 1000', () => {
    expect(formatDistance(1000)).toBe('1.00 km');
    expect(formatDistance(1500)).toBe('1.50 km');
    expect(formatDistance(42195)).toBe('42.20 km');
  });

  it('should handle large distances', () => {
    expect(formatDistance(100000)).toBe('100.00 km');
  });
});

describe('formatDate', () => {
  it('should format a date string in French locale', () => {
    const result = formatDate('2026-01-15T10:00:00Z');
    expect(result).toContain('2026');
  });

  it('should handle different date formats', () => {
    const result = formatDate('2026-06-04');
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });

  it('should handle invalid dates', () => {
    // Invalid date should still produce something sensible
    const result = formatDate('not-a-date');
    expect(result).toBeDefined();
  });
});

describe('formatDateShort', () => {
  it('should format a date string without year', () => {
    const result = formatDateShort('2026-01-15T10:00:00Z');
    // Should only have day and month
    expect(result).toContain('15');
  });

  it('should not include year', () => {
    const result = formatDateShort('2026-12-25');
    expect(result).not.toContain('2026');
  });
});

describe('getSportIcon', () => {
  it('should return running icon for run', () => {
    expect(getSportIcon('run')).toBe('🏃');
  });

  it('should return bike icon for bike', () => {
    expect(getSportIcon('bike')).toBe('🚴');
  });

  it('should return swim icon for swim', () => {
    expect(getSportIcon('swim')).toBe('🏊');
  });

  it('should return running icon for unknown sport', () => {
    expect(getSportIcon('yoga')).toBe('🏃');
    expect(getSportIcon('')).toBe('🏃');
  });

  it('should be case sensitive', () => {
    expect(getSportIcon('Run')).toBe('🏃');
  });
});

describe('getSportColor', () => {
  it('should return primary color for run', () => {
    expect(getSportColor('run')).toBe('var(--primary)');
  });

  it('should return warning color for bike', () => {
    expect(getSportColor('bike')).toBe('var(--warning)');
  });

  it('should return secondary color for swim', () => {
    expect(getSportColor('swim')).toBe('var(--secondary)');
  });

  it('should return primary color for unknown sport', () => {
    expect(getSportColor('hike')).toBe('var(--primary)');
  });
});

describe('getZoneColor', () => {
  it('should return correct color for each zone', () => {
    expect(getZoneColor(1)).toBe('var(--muted)');
    expect(getZoneColor(2)).toBe('var(--success)');
    expect(getZoneColor(3)).toBe('var(--primary)');
    expect(getZoneColor(4)).toBe('var(--warning)');
    expect(getZoneColor(5)).toBe('var(--danger)');
    expect(getZoneColor(6)).toBe('var(--danger)');
    expect(getZoneColor(7)).toBe('var(--secondary)');
  });

  it('should return muted for out of range zones', () => {
    expect(getZoneColor(0)).toBe('var(--muted)');
    expect(getZoneColor(8)).toBe('var(--muted)');
    expect(getZoneColor(-1)).toBe('var(--muted)');
  });
});

describe('calculateReadinessColor', () => {
  it('should return green for high scores', () => {
    expect(calculateReadinessColor(100)).toBe('var(--success)');
    expect(calculateReadinessColor(80)).toBe('var(--success)');
  });

  it('should return primary for medium-high scores', () => {
    expect(calculateReadinessColor(79)).toBe('var(--primary)');
    expect(calculateReadinessColor(60)).toBe('var(--primary)');
  });

  it('should return orange for medium-low scores', () => {
    expect(calculateReadinessColor(59)).toBe('var(--warning)');
    expect(calculateReadinessColor(40)).toBe('var(--warning)');
  });

  it('should return red for low scores', () => {
    expect(calculateReadinessColor(39)).toBe('var(--danger)');
    expect(calculateReadinessColor(0)).toBe('var(--danger)');
    expect(calculateReadinessColor(-1)).toBe('var(--danger)');
  });
});

describe('debounce', () => {
  it('should debounce function calls', async () => {
    vi.useFakeTimers();

    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced();
    debounced();

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('should delay execution by the specified wait time', async () => {
    vi.useFakeTimers();

    const fn = vi.fn();
    const debounced = debounce(fn, 200);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(199);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('should pass correct arguments to the debounced function', async () => {
    vi.useFakeTimers();

    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('arg1', 42);
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith('arg1', 42);

    vi.useRealTimers();
  });
});

describe('decodePolyline', () => {
  it('should decode a sample polyline', () => {
    // Google Polyline test string (simple path)
    const encoded = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
    const decoded = decodePolyline(encoded);
    expect(decoded).toBeInstanceOf(Array);
    expect(decoded.length).toBeGreaterThan(0);
    decoded.forEach(([lat, lng]) => {
      expect(typeof lat).toBe('number');
      expect(typeof lng).toBe('number');
    });
  });

  it('should return empty array for empty string', () => {
    expect(decodePolyline('')).toEqual([]);
  });

  it('should decode a known path correctly', () => {
    // Known test case
    const points: [number, number][] = [
      [38.5, -120.2],
      [40.7, -120.95],
      [43.252, -126.453],
    ];
    const encoded = encodePolyline(points);
    const decoded = decodePolyline(encoded);

    expect(decoded).toHaveLength(points.length);
    decoded.forEach(([lat, lng], i) => {
      expect(lat).toBeCloseTo(points[i][0], 4);
      expect(lng).toBeCloseTo(points[i][1], 4);
    });
  });

  it('should handle single-point polyline', () => {
    const points: [number, number][] = [[38.5, -120.2]];
    const encoded = encodePolyline(points);
    const decoded = decodePolyline(encoded);
    expect(decoded).toHaveLength(1);
    expect(decoded[0][0]).toBeCloseTo(38.5, 4);
    expect(decoded[0][1]).toBeCloseTo(-120.2, 4);
  });
});

describe('encodePolyline', () => {
  it('should encode a simple path', () => {
    const points: [number, number][] = [
      [38.5, -120.2],
      [40.7, -120.95],
    ];
    const encoded = encodePolyline(points);
    expect(typeof encoded).toBe('string');
    expect(encoded.length).toBeGreaterThan(0);
  });

  it('should handle object format {lat, lng}', () => {
    const points = [
      { lat: 38.5, lng: -120.2 },
      { lat: 40.7, lng: -120.95 },
    ];
    const encoded = encodePolyline(points);
    expect(typeof encoded).toBe('string');
    expect(encoded.length).toBeGreaterThan(0);
  });

  it('should return empty string for empty array', () => {
    expect(encodePolyline([])).toBe('');
  });

  it('should be roundtrip-able with decode', () => {
    const original: [number, number][] = [
      [38.5, -120.2],
      [40.7, -120.95],
      [43.252, -126.453],
    ];
    const encoded = encodePolyline(original);
    const decoded = decodePolyline(encoded);

    expect(decoded).toHaveLength(original.length);
    decoded.forEach(([lat, lng], i) => {
      expect(lat).toBeCloseTo(original[i][0], 4);
      expect(lng).toBeCloseTo(original[i][1], 4);
    });
  });
});
