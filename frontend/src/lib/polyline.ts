/**
 * Polyline encoding/decoding utilities for GPS coordinates
 * Based on Google's Encoded Polyline Algorithm Format
 * Used for encoding/decoding polyline strings in GPS data
 */

import type { LatLng } from '@/types/leaflet';

/**
 * Decodes an encoded polyline string into an array of latitude/longitude coordinates.
 * 
 * @param encoded - The encoded polyline string (Google's Encoded Polyline Algorithm Format)
 * @returns An array of [latitude, longitude] tuples
 * 
 * @example
 * ```typescript
 * const polyline = "_p~F~ps|U_ulLnnqC_mqNvxq`@";
 * const coordinates = decodePolyline(polyline);
 * // Returns: [[38.5, -120.2], [38.52, -120.3], ...]
 * ```
 */
export function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    // Decode latitude
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    // Decode longitude
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    // Scale and add to points array
    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

/**
 * Encodes an array of latitude/longitude coordinates into a polyline string.
 * 
 * @param coordinates - Array of [latitude, longitude] tuples
 * @returns The encoded polyline string
 * 
 * @example
 * ```typescript
 * const coordinates = [[38.5, -120.2], [38.52, -120.3]];
 * const polyline = encodePolyline(coordinates);
 * // Returns: "_p~F~ps|U..."
 * ```
 */
export function encodePolyline(coordinates: LatLng[]): string {
  let encoded = '';
  let prevLat = 0;
  let prevLng = 0;

  for (const [lat, lng] of coordinates) {
    // Scale coordinates
    const scaledLat = Math.round(lat * 1e5);
    const scaledLng = Math.round(lng * 1e5);

    // Calculate deltas
    const deltaLat = scaledLat - prevLat;
    const deltaLng = scaledLng - prevLng;

    // Encode latitude
    let latValue = deltaLat << 1;
    if (deltaLat < 0) {
      latValue = ~latValue;
    }
    encoded += encodeSignedNumber(latValue);

    // Encode longitude
    let lngValue = deltaLng << 1;
    if (deltaLng < 0) {
      lngValue = ~lngValue;
    }
    encoded += encodeSignedNumber(lngValue);

    prevLat = scaledLat;
    prevLng = scaledLng;
  }

  return encoded;
}

/**
 * Encodes a signed number into a polyline-compatible string.
 * @param num - The number to encode
 * @returns The encoded string
 */
function encodeSignedNumber(num: number): string {
  let encoded = '';
  let value = num;

  while (value >= 0x20) {
    const chunk = ((value & 0x1f) | 0x20) + 63;
    encoded += String.fromCharCode(chunk);
    value >>= 5;
  }

  const finalChunk = (value + 63);
  encoded += String.fromCharCode(finalChunk);

  return encoded;
}

/**
 * Calculates the distance between two coordinates in meters (Haversine formula).
 * 
 * @param coord1 - First coordinate [lat, lng]
 * @param coord2 - Second coordinate [lat, lng]
 * @returns Distance in meters
 */
export function calculateDistance(coord1: LatLng, coord2: LatLng): number {
  const [lat1, lng1] = coord1;
  const [lat2, lng2] = coord2;
  
  const R = 6371000; // Earth radius in meters
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculates the total distance of a polyline in meters.
 * 
 * @param coordinates - Array of [latitude, longitude] tuples
 * @returns Total distance in meters
 */
export function calculatePolylineDistance(coordinates: LatLng[]): number {
  if (coordinates.length < 2) return 0;
  
  let totalDistance = 0;
  for (let i = 1; i < coordinates.length; i++) {
    totalDistance += calculateDistance(coordinates[i - 1], coordinates[i]);
  }
  return totalDistance;
}
