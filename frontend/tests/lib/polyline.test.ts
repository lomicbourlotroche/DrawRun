/**
 * Unit tests for polyline encoding/decoding utilities
 */

import { describe, it, expect } from 'vitest';
import { decodePolyline, encodePolyline, calculateDistance, calculatePolylineDistance } from '@/lib/polyline';

describe('polyline utilities', () => {
  describe('decodePolyline', () => {
    it('should decode a simple polyline', () => {
      // Simple polyline: San Francisco to San Francisco (single point)
      const encoded = '_p~F~ps|U';
      const decoded = decodePolyline(encoded);

      expect(decoded).toBeInstanceOf(Array);
      expect(decoded.length).toBeGreaterThan(0);
      expect(decoded[0]).toHaveLength(2);
    });

    it('should decode a polyline with multiple points', () => {
      // Polyline with multiple points
      const encoded = '_p~F~ps|U_ulLnnqC_mqNvxq`@';
      const decoded = decodePolyline(encoded);

      expect(decoded.length).toBeGreaterThan(1);
      decoded.forEach((point) => {
        expect(point).toHaveLength(2);
        expect(typeof point[0]).toBe('number');
        expect(typeof point[1]).toBe('number');
      });
    });

    it('should handle empty string', () => {
      const decoded = decodePolyline('');
      expect(decoded).toEqual([]);
    });

    it('should decode polyline with negative coordinates', () => {
      // Polyline that includes negative coordinates
      const encoded = '~tqF~ps|U';
      const decoded = decodePolyline(encoded);

      expect(decoded.length).toBeGreaterThan(0);
      // Check that we have valid coordinates
      decoded.forEach((point) => {
        expect(typeof point[0]).toBe('number');
        expect(typeof point[1]).toBe('number');
      });
    });
  });

  describe('encodePolyline', () => {
    it('should encode a single coordinate', () => {
      const coordinates = [[37.7749, -122.4194]];
      const encoded = encodePolyline(coordinates);

      expect(typeof encoded).toBe('string');
      expect(encoded.length).toBeGreaterThan(0);
    });

    it('should encode multiple coordinates', () => {
      const coordinates = [
        [37.7749, -122.4194],
        [37.775, -122.4195],
        [37.7751, -122.4196],
      ];
      const encoded = encodePolyline(coordinates);

      expect(typeof encoded).toBe('string');
      expect(encoded.length).toBeGreaterThan(0);
    });

    it('should handle empty array', () => {
      const encoded = encodePolyline([]);
      expect(encoded).toBe('');
    });

    it('should encode and decode back to similar coordinates', () => {
      const original = [
        [37.7749, -122.4194],
        [37.775, -122.4195],
        [37.7751, -122.4196],
      ];

      const encoded = encodePolyline(original);
      const decoded = decodePolyline(encoded);

      // Due to precision in encoding/decoding, coordinates might not be exact
      expect(decoded.length).toBe(original.length);

      // Check that coordinates are close (within 0.0001)
      for (let i = 0; i < original.length; i++) {
        expect(Math.abs(decoded[i][0] - original[i][0])).toBeLessThan(0.0001);
        expect(Math.abs(decoded[i][1] - original[i][1])).toBeLessThan(0.0001);
      }
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      // Distance between Paris and a point 1km north
      const paris = [48.8566, 2.3522];
      const northOfParis = [48.8655, 2.3522]; // Approximately 1km north

      const distance = calculateDistance(paris, northOfParis);

      expect(typeof distance).toBe('number');
      expect(distance).toBeGreaterThan(0);
      // Should be approximately 1000 meters (1km)
      expect(distance).toBeCloseTo(1000, -2);
    });

    it('should return 0 for same point', () => {
      const point = [48.8566, 2.3522];
      const distance = calculateDistance(point, point);

      expect(distance).toBe(0);
    });

    it('should calculate distance for points with different longitudes', () => {
      // Two points on the equator, 1 degree apart in longitude
      const point1 = [0, 0];
      const point2 = [0, 1];

      const distance = calculateDistance(point1, point2);

      // At equator, 1 degree longitude ≈ 111km
      expect(distance).toBeCloseTo(111000, -3);
    });
  });

  describe('calculatePolylineDistance', () => {
    it('should return 0 for empty array', () => {
      const distance = calculatePolylineDistance([]);
      expect(distance).toBe(0);
    });

    it('should return 0 for single point', () => {
      const distance = calculatePolylineDistance([[0, 0]]);
      expect(distance).toBe(0);
    });

    it('should calculate total distance for multiple points', () => {
      // Two points approximately 1km apart
      const coordinates = [
        [48.8566, 2.3522],
        [48.8655, 2.3522],
      ];

      const distance = calculatePolylineDistance(coordinates);

      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeCloseTo(1000, -2);
    });

    it('should calculate cumulative distance for multiple segments', () => {
      // Three points forming two ~1km segments
      const coordinates = [
        [48.8566, 2.3522],
        [48.8655, 2.3522], // ~1km north
        [48.8655, 2.3611], // ~1km east
      ];

      const distance = calculatePolylineDistance(coordinates);

      // Should be approximately 2km (1km north + 1km east)
      expect(distance).toBeGreaterThan(1500);
      expect(distance).toBeLessThan(2500);
    });
  });
});
