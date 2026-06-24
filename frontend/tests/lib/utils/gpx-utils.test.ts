import { describe, it, expect } from 'vitest';
import {
  calculateHaversineDistance,
  parseGpx,
  parseGpxProfile,
  countGpxPoints,
  type GpxPoint,
  type GpxProfile,
} from '@/lib/utils/gpx-utils';

// Sample GPX data for testing
const MINIMAL_GPX = `<?xml version="1.0"?>
<gpx version="1.1">
  <trk><trkseg>
    <trkpt lat="48.8566" lon="2.3522"><ele>100</ele></trkpt>
    <trkpt lat="48.8666" lon="2.3622"><ele>110</ele></trkpt>
  </trkseg></trk>
</gpx>`;

const THREE_POINT_GPX = `<?xml version="1.0"?>
<gpx version="1.1">
  <trk><trkseg>
    <trkpt lat="48.8566" lon="2.3522"><ele>100</ele></trkpt>
    <trkpt lat="48.8600" lon="2.3550"><ele>105</ele></trkpt>
    <trkpt lat="48.8666" lon="2.3622"><ele>110</ele></trkpt>
  </trkseg></trk>
</gpx>`;

const ELEVATION_GPX = `<?xml version="1.0"?>
<gpx version="1.1">
  <trk><trkseg>
    <trkpt lat="48.8566" lon="2.3522"><ele>50</ele></trkpt>
    <trkpt lat="48.8600" lon="2.3550"><ele>150</ele></trkpt>
    <trkpt lat="48.8633" lon="2.3588"><ele>100</ele></trkpt>
    <trkpt lat="48.8666" lon="2.3622"><ele>200</ele></trkpt>
  </trkseg></trk>
</gpx>`;

const LARGE_ELEVATION_GPX = `<?xml version="1.0"?>
<gpx version="1.1">
  <trk><trkseg>
    <trkpt lat="48.8500" lon="2.3500"><ele>0</ele></trkpt>
    <trkpt lat="48.8600" lon="2.3600"><ele>100</ele></trkpt>
    <trkpt lat="48.8700" lon="2.3700"><ele>50</ele></trkpt>
    <trkpt lat="48.8800" lon="2.3800"><ele>200</ele></trkpt>
    <trkpt lat="48.8900" lon="2.3900"><ele>150</ele></trkpt>
  </trkseg></trk>
</gpx>`;

const MULTIPLE_TRACKS_GPX = `<?xml version="1.0"?>
<gpx version="1.1">
  <trk><trkseg>
    <trkpt lat="48.8566" lon="2.3522"><ele>100</ele></trkpt>
    <trkpt lat="48.8666" lon="2.3622"><ele>110</ele></trkpt>
  </trkseg></trk>
  <trk><trkseg>
    <trkpt lat="48.8766" lon="2.3722"><ele>120</ele></trkpt>
    <trkpt lat="48.8866" lon="2.3822"><ele>130</ele></trkpt>
  </trkseg></trk>
</gpx>`;

const NO_ELE_GPX = `<?xml version="1.0"?>
<gpx version="1.1">
  <trk><trkseg>
    <trkpt lat="48.8566" lon="2.3522"></trkpt>
    <trkpt lat="48.8666" lon="2.3622"></trkpt>
  </trkseg></trk>
</gpx>`;

describe('calculateHaversineDistance', () => {
  it('should return 0 for the same point', () => {
    const dist = calculateHaversineDistance(48.8566, 2.3522, 48.8566, 2.3522);
    expect(dist).toBe(0);
  });

  it('should calculate approximate distance between two close points', () => {
    // Distance between these points is ~1.33 km
    const dist = calculateHaversineDistance(48.8566, 2.3522, 48.8666, 2.3622);
    expect(dist).toBeGreaterThan(1100);
    expect(dist).toBeLessThan(1400);
  });

  it('should be commutative (order-independent)', () => {
    const d1 = calculateHaversineDistance(48.8566, 2.3522, 48.8666, 2.3622);
    const d2 = calculateHaversineDistance(48.8666, 2.3622, 48.8566, 2.3522);
    expect(d1).toBeCloseTo(d2, 5);
  });

  it('should handle negative coordinates (southern hemisphere)', () => {
    const dist = calculateHaversineDistance(-33.8566, 151.2153, -33.8666, 151.2253);
    expect(dist).toBeGreaterThan(0);
  });

  it('should handle coordinates crossing the equator', () => {
    const dist = calculateHaversineDistance(0, 0, 0.01, 0.01);
    expect(dist).toBeGreaterThan(0);
    expect(dist).toBeLessThan(2000);
  });

  it('should handle points near the poles', () => {
    const dist = calculateHaversineDistance(89.9, 0, 90, 0);
    expect(dist).toBeGreaterThan(0);
    expect(dist).toBeLessThan(20000);
  });

  it('should handle antipodal points (opposite sides of globe)', () => {
    const dist = calculateHaversineDistance(0, 0, 0, 180);
    // Half Earth circumference ~20,000 km
    expect(dist).toBeGreaterThan(19000000);
    expect(dist).toBeLessThan(21000000);
  });

  it('should always return positive distance', () => {
    const dist = calculateHaversineDistance(48.8566, 2.3522, 48.8666, 2.3622);
    expect(dist).toBeGreaterThan(0);
  });
});

describe('parseGpx', () => {
  it('should parse a minimal GPX with two points', () => {
    const result = parseGpx(MINIMAL_GPX);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(2);
  });

  it('should extract lat/lon correctly', () => {
    const result = parseGpx(MINIMAL_GPX)!;
    expect(result[0].lat).toBeCloseTo(48.8566, 4);
    expect(result[0].lon).toBeCloseTo(2.3522, 4);
    expect(result[1].lat).toBeCloseTo(48.8666, 4);
    expect(result[1].lon).toBeCloseTo(2.3622, 4);
  });

  it('should extract elevation', () => {
    const result = parseGpx(MINIMAL_GPX)!;
    expect(result[0].ele).toBe(100);
    expect(result[1].ele).toBe(110);
  });

  it('should compute cumulative distances', () => {
    const result = parseGpx(MINIMAL_GPX)!;
    expect(result[0].dist).toBe(0);
    expect(result[1].dist).toBeGreaterThan(0);
  });

  it('should accumulate distances across multiple points', () => {
    const result = parseGpx(THREE_POINT_GPX)!;
    expect(result).toHaveLength(3);
    expect(result[0].dist).toBe(0);
    expect(result[1].dist).toBeGreaterThan(0);
    expect(result[2].dist).toBeGreaterThan(result[1].dist);
  });

  it('should parse GPX with varying elevations', () => {
    const result = parseGpx(ELEVATION_GPX)!;
    expect(result).toHaveLength(4);
    expect(result[0].ele).toBe(50);
    expect(result[1].ele).toBe(150);
    expect(result[2].ele).toBe(100);
    expect(result[3].ele).toBe(200);
  });

  it('should parse points from all tracks in multi-track GPX', () => {
    const result = parseGpx(MULTIPLE_TRACKS_GPX);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(4);
  });

  // Edge cases
  it('should return null for empty string', () => {
    expect(parseGpx('')).toBeNull();
  });

  it('should return null for null/undefined', () => {
    expect(parseGpx(null as unknown as string)).toBeNull();
    expect(parseGpx(undefined as unknown as string)).toBeNull();
  });

  it('should return null for GPX with only one trackpoint', () => {
    const singleGPX = `<?xml version="1.0"?>
<gpx version="1.1">
  <trk><trkseg>
    <trkpt lat="48.8566" lon="2.3522"><ele>100</ele></trkpt>
  </trkseg></trk>
</gpx>`;
    expect(parseGpx(singleGPX)).toBeNull();
  });

  it('should return null for GPX with no trackpoints', () => {
    const emptyGPX = `<?xml version="1.0"?>
<gpx version="1.1">
  <trk><trkseg>
  </trkseg></trk>
</gpx>`;
    expect(parseGpx(emptyGPX)).toBeNull();
  });

  it('should handle missing elevation by defaulting to 0', () => {
    const result = parseGpx(NO_ELE_GPX);
    expect(result).not.toBeNull();
    expect(result![0].ele).toBe(0);
    expect(result![1].ele).toBe(0);
  });

  it('should handle non-numeric elevation gracefully', () => {
    const badEleGPX = `<?xml version="1.0"?>
<gpx version="1.1">
  <trk><trkseg>
    <trkpt lat="48.8566" lon="2.3522"><ele>notanumber</ele></trkpt>
    <trkpt lat="48.8666" lon="2.3622"><ele>110</ele></trkpt>
  </trkseg></trk>
</gpx>`;
    const result = parseGpx(badEleGPX);
    expect(result).not.toBeNull();
    expect(result![0].ele).toBe(0); // NaN treated as 0
  });

  it('should skip invalid lat/lon and return null if fewer than 2 valid remain', () => {
    const invalidLatGPX = `<?xml version="1.0"?>
<gpx version="1.1">
  <trk><trkseg>
    <trkpt lat="invalid" lon="2.3522"><ele>100</ele></trkpt>
    <trkpt lat="48.8666" lon="2.3622"><ele>110</ele></trkpt>
  </trkseg></trk>
</gpx>`;
    expect(parseGpx(invalidLatGPX)).toBeNull(); // Only 1 valid point remains
  });

  it('should round distances to 0.1m precision', () => {
    const result = parseGpx(MINIMAL_GPX)!;
    const distStr = String(result[1].dist);
    expect(distStr).not.toContain('.');
    // Actually check by verifying it's a multiple of 0.1
    expect(result[1].dist * 10 % 1).toBe(0);
  });
});

describe('parseGpxProfile', () => {
  it('should return null for null input', () => {
    expect(parseGpxProfile(null as unknown as string)).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(parseGpxProfile('')).toBeNull();
  });

  it('should return a valid profile for a GPX with 2+ points', () => {
    const result = parseGpxProfile(MINIMAL_GPX);
    expect(result).not.toBeNull();
    expect(result!.pointCount).toBe(2);
    expect(result!.totalDistanceKm).toBeGreaterThan(0);
    expect(result!.elevationGain).toBe(10); // 110 - 100
    expect(result!.elevationLoss).toBe(0);
  });

  it('should include points in profile', () => {
    const result = parseGpxProfile(MINIMAL_GPX)!;
    expect(result.points).toHaveLength(2);
    expect(result.points[0].lat).toBeCloseTo(48.8566, 4);
  });

  it('should compute elevation stats correctly', () => {
    const result = parseGpxProfile(LARGE_ELEVATION_GPX)!;
    expect(result.minElevation).toBe(0);
    expect(result.maxElevation).toBe(200);
    // Gain: 100 + (-50 absolute is 0 for gain,... let me compute:
    // 0→100 = +100 gain
    // 100→50 = -50 = 50 loss
    // 50→200 = +150 gain
    // 200→150 = -50 = 50 loss
    // Total gain: 100 + 150 = 250
    // Total loss: 50 + 50 = 100
    expect(result.elevationGain).toBe(250);
    expect(result.elevationLoss).toBe(100);
  });

  it('should return total distance in kilometers', () => {
    const result = parseGpxProfile(THREE_POINT_GPX)!;
    expect(result.totalDistanceKm).toBeGreaterThan(0);
    // Three points with small separation should be < 5km
    expect(result.totalDistanceKm).toBeLessThan(5);
  });

  it('should calculate average elevation', () => {
    const result = parseGpxProfile(ELEVATION_GPX)!;
    // Elevations: 50, 150, 100, 200 => average = 125
    expect(result.avgElevation).toBe(125);
  });

  it('should handle all same elevations', () => {
    const flatGPX = `<?xml version="1.0"?>
<gpx version="1.1">
  <trk><trkseg>
    <trkpt lat="48.8566" lon="2.3522"><ele>100</ele></trkpt>
    <trkpt lat="48.8666" lon="2.3622"><ele>100</ele></trkpt>
  </trkseg></trk>
</gpx>`;
    const result = parseGpxProfile(flatGPX)!;
    expect(result.elevationGain).toBe(0);
    expect(result.elevationLoss).toBe(0);
    expect(result.minElevation).toBe(100);
    expect(result.maxElevation).toBe(100);
    expect(result.avgElevation).toBe(100);
  });

  it('should round totalDistanceKm to 2 decimal places', () => {
    const result = parseGpxProfile(MINIMAL_GPX)!;
    const decimals = result.totalDistanceKm.toString().split('.')[1];
    if (decimals) {
      expect(decimals.length).toBeLessThanOrEqual(2);
    }
  });
});

describe('countGpxPoints', () => {
  it('should count trackpoints in GPX', () => {
    expect(countGpxPoints(MINIMAL_GPX)).toBe(2);
    expect(countGpxPoints(THREE_POINT_GPX)).toBe(3);
    expect(countGpxPoints(ELEVATION_GPX)).toBe(4);
  });

  it('should return 0 for empty string', () => {
    expect(countGpxPoints('')).toBe(0);
  });

  it('should return 0 for null/undefined', () => {
    expect(countGpxPoints(null as unknown as string)).toBe(0);
    expect(countGpxPoints(undefined as unknown as string)).toBe(0);
  });

  it('should return 0 for non-GPX content (no trkpt tags)', () => {
    expect(countGpxPoints('<foo><bar></bar></foo>')).toBe(0);
  });

  it('should count points across multiple tracks', () => {
    expect(countGpxPoints(MULTIPLE_TRACKS_GPX)).toBe(4);
  });
});
