'use strict';

/**
 * ============================================================
 * GPX UTILS TESTS
 * ============================================================
 * Tests for GPX parsing and Haversine distance calculation
 */

const GpxUtils = require('../../src/utils/gpx_utils');

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

describe('GpxUtils.parse', () => {
    // Happy path
    test('should parse minimal GPX with two points', () => {
        const result = GpxUtils.parse(MINIMAL_GPX);
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(2);
    });

    test('should extract lat/lon correctly', () => {
        const result = GpxUtils.parse(MINIMAL_GPX);
        expect(result[0].lat).toBeCloseTo(48.8566, 4);
        expect(result[0].lon).toBeCloseTo(2.3522, 4);
        expect(result[1].lat).toBeCloseTo(48.8666, 4);
        expect(result[1].lon).toBeCloseTo(2.3622, 4);
    });

    test('should extract elevation data', () => {
        const result = GpxUtils.parse(MINIMAL_GPX);
        expect(result[0].ele).toBe(100);
        expect(result[1].ele).toBe(110);
    });

    test('should calculate cumulative distance', () => {
        const result = GpxUtils.parse(MINIMAL_GPX);
        expect(result[0].dist).toBe(0);
        expect(result[1].dist).toBeGreaterThan(0);
        // Distance between these points should be ~1.2km
        expect(result[1].dist).toBeGreaterThan(1000);
        expect(result[1].dist).toBeLessThan(1500);
    });

    test('should accumulate distance across three points', () => {
        const result = GpxUtils.parse(THREE_POINT_GPX);
        expect(result.length).toBe(3);
        expect(result[0].dist).toBe(0);
        expect(result[1].dist).toBeGreaterThan(0);
        expect(result[2].dist).toBeGreaterThan(result[1].dist);
    });

    test('should parse GPX with varying elevations and compute distances', () => {
        const result = GpxUtils.parse(ELEVATION_GPX);
        expect(result.length).toBe(4);
        expect(result[0].ele).toBe(50);
        expect(result[1].ele).toBe(150);
        expect(result[2].ele).toBe(100);
        expect(result[3].ele).toBe(200);
    });

    // Edge cases
    test('should return null for empty string', () => {
        expect(GpxUtils.parse('')).toBeNull();
    });

    test('should return null for null input', () => {
        expect(GpxUtils.parse(null)).toBeNull();
    });

    test('should return null for undefined input', () => {
        expect(GpxUtils.parse(undefined)).toBeNull();
    });

    test('should return null for GPX with only one trackpoint', () => {
        const singlePointGPX = `<?xml version="1.0"?>
<gpx version="1.1">
  <trk><trkseg>
    <trkpt lat="48.8566" lon="2.3522"><ele>100</ele></trkpt>
  </trkseg></trk>
</gpx>`;
        expect(GpxUtils.parse(singlePointGPX)).toBeNull();
    });

    test('should return null for GPX with no trackpoints', () => {
        const noPointsGPX = `<?xml version="1.0"?>
<gpx version="1.1">
  <trk><trkseg>
  </trkseg></trk>
</gpx>`;
        expect(GpxUtils.parse(noPointsGPX)).toBeNull();
    });

    test('should handle invalid lat/lon values gracefully', () => {
        const invalidGPX = `<?xml version="1.0"?>
<gpx version="1.1">
  <trk><trkseg>
    <trkpt lat="invalid" lon="2.3522"><ele>100</ele></trkpt>
    <trkpt lat="48.8666" lon="2.3622"><ele>110</ele></trkpt>
  </trkseg></trk>
</gpx>`;
        // One invalid point is skipped, but we still have 1 valid point (need 2)
        expect(GpxUtils.parse(invalidGPX)).toBeNull();
    });

    test('should handle missing elevation', () => {
        const noEleGPX = `<?xml version="1.0"?>
<gpx version="1.1">
  <trk><trkseg>
    <trkpt lat="48.8566" lon="2.3522"></trkpt>
    <trkpt lat="48.8666" lon="2.3622"></trkpt>
  </trkseg></trk>
</gpx>`;
        const result = GpxUtils.parse(noEleGPX);
        expect(result).toBeDefined();
        expect(result[0].ele).toBe(0);
        expect(result[1].ele).toBe(0);
    });

    test('should parse multiple tracks', () => {
        const result = GpxUtils.parse(MULTIPLE_TRACKS_GPX);
        expect(result).toBeDefined();
        // Should extract points from all tracks
        expect(result.length).toBe(4);
    });
});

describe('GpxUtils.calculateDistance (Haversine)', () => {
    test('should return 0 for same point', () => {
        const dist = GpxUtils.calculateDistance(48.8566, 2.3522, 48.8566, 2.3522);
        expect(dist).toBe(0);
    });

    test('should calculate known approximate distance', () => {
        // Distance between two close points (~1.33km apart)
        const dist = GpxUtils.calculateDistance(48.8566, 2.3522, 48.8666, 2.3622);
        expect(dist).toBeGreaterThan(1250);
        expect(dist).toBeLessThan(1400);
    });

    test('should be commutative', () => {
        const d1 = GpxUtils.calculateDistance(48.8566, 2.3522, 48.8666, 2.3622);
        const d2 = GpxUtils.calculateDistance(48.8666, 2.3622, 48.8566, 2.3522);
        expect(d1).toBeCloseTo(d2, 5);
    });

    test('should handle negative coordinates (southern hemisphere)', () => {
        const dist = GpxUtils.calculateDistance(-33.8566, 151.2153, -33.8666, 151.2253);
        expect(dist).toBeGreaterThan(0);
    });

    test('should handle coordinates crossing the equator', () => {
        const dist = GpxUtils.calculateDistance(0, 0, 0.01, 0.01);
        expect(dist).toBeGreaterThan(0);
        expect(dist).toBeLessThan(2000);
    });

    test('should handle poles', () => {
        const dist = GpxUtils.calculateDistance(89.9, 0, 90, 0);
        expect(dist).toBeGreaterThan(0);
        expect(dist).toBeLessThan(20000);
    });

    test('should handle antipodal points', () => {
        const dist = GpxUtils.calculateDistance(0, 0, 0, 180);
        // Half the Earth's circumference ~20,000km
        expect(dist).toBeGreaterThan(19000000);
        expect(dist).toBeLessThan(21000000);
    });

    test('should return positive distance', () => {
        const dist = GpxUtils.calculateDistance(48.8566, 2.3522, 48.8666, 2.3622);
        expect(dist).toBeGreaterThan(0);
    });
});
