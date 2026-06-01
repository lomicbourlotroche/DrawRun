/**
 * ============================================================
 * GPX UTILITIES
 * ============================================================
 * Functions for parsing and processing GPX files.
 * Mirrors backend's GpxUtils for consistency.
 */

/**
 * GPX Trackpoint with distance from start
 */
export interface GpxPoint {
  lat: number;
  lon: number;
  ele: number;
  dist: number;
}

/**
 * Parsed GPX profile summary
 */
export interface GpxProfile {
  points: GpxPoint[];
  pointCount: number;
  totalDistanceKm: number;
  elevationGain: number;
  elevationLoss: number;
  minElevation: number;
  maxElevation: number;
  avgElevation: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of point 1 in degrees
 * @param lon1 Longitude of point 1 in degrees
 * @param lat2 Latitude of point 2 in degrees
 * @param lon2 Longitude of point 2 in degrees
 * @returns Distance in meters
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Extract attribute value from XML string
 */
function extractXmlAttribute(xml: string, attr: string): string | null {
  const regex = new RegExp(` ${attr}="([^"]+)"`);
  const match = xml.match(regex);
  return match ? match[1] : null;
}

/**
 * Extract elevation from trkpt content
 */
function extractElevation(content: string): number {
  const eleMatch = content.match(/<ele>([\s\S]*?)<\/ele>/i);
  if (eleMatch && eleMatch[1]) {
    const ele = parseFloat(eleMatch[1].trim());
    return isNaN(ele) ? 0 : ele;
  }
  return 0;
}

/**
 * Parse GPX XML string and extract trackpoints with elevation and cumulative distance
 * @param gpxXml GPX XML content as string
 * @returns Array of GPX points with lat, lon, ele, and cumulative distance, or null if invalid
 */
export function parseGpx(gpxXml: string): GpxPoint[] | null {
  if (!gpxXml || typeof gpxXml !== 'string') {
    return null;
  }

  // Match all trkpt elements with their attributes and content
  const trkptRegex = /<trkpt([^>]*)>([\s\S]*?)<\/trkpt>/gi;
  const points: GpxPoint[] = [];
  let match;

  while ((match = trkptRegex.exec(gpxXml)) !== null) {
    const attrs = match[1];
    const content = match[2];

    const latStr = extractXmlAttribute(attrs, 'lat');
    const lonStr = extractXmlAttribute(attrs, 'lon');
    
    if (!latStr || !lonStr) continue;
    
    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    const ele = extractElevation(content);

    if (!isNaN(lat) && !isNaN(lon)) {
      points.push({ lat, lon, ele, dist: 0 });
    }
  }

  // Need at least 2 points to calculate distances
  if (points.length < 2) {
    return null;
  }

  // Calculate cumulative distance
  let totalDist = 0;
  points[0].dist = 0;

  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1];
    const p2 = points[i];
    const dist = calculateHaversineDistance(p1.lat, p1.lon, p2.lat, p2.lon);
    totalDist += dist;
    p2.dist = Math.round(totalDist * 10) / 10; // Round to 0.1m precision
  }

  return points;
}

/**
 * Parse GPX XML and return a profile summary
 * @param gpxXml GPX XML content as string
 * @returns GpxProfile object or null if invalid
 */
export function parseGpxProfile(gpxXml: string): GpxProfile | null {
  const points = parseGpx(gpxXml);
  
  if (!points || points.length < 2) {
    return null;
  }

  // Calculate elevation stats
  let elevationGain = 0;
  let elevationLoss = 0;
  let minElevation = points[0].ele;
  let maxElevation = points[0].ele;
  let totalElevation = 0;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const diff = curr.ele - prev.ele;
    
    if (diff > 0) {
      elevationGain += diff;
    } else if (diff < 0) {
      elevationLoss += Math.abs(diff);
    }
    
    if (curr.ele < minElevation) minElevation = curr.ele;
    if (curr.ele > maxElevation) maxElevation = curr.ele;
    totalElevation += curr.ele;
  }

  const totalDistanceKm = points[points.length - 1].dist / 1000;
  const avgElevation = totalElevation / points.length;

  return {
    points,
    pointCount: points.length,
    totalDistanceKm: Math.round(totalDistanceKm * 100) / 100, // Round to 0.01km
    elevationGain: Math.round(elevationGain),
    elevationLoss: Math.round(elevationLoss),
    minElevation: Math.round(minElevation),
    maxElevation: Math.round(maxElevation),
    avgElevation: Math.round(avgElevation),
  };
}

/**
 * Count trackpoints in GPX XML (quick count without full parsing)
 * @param gpxXml GPX XML content
 * @returns Number of trackpoints found
 */
export function countGpxPoints(gpxXml: string): number {
  if (!gpxXml) return 0;
  const matches = gpxXml.match(/<trkpt/gi);
  return matches ? matches.length : 0;
}
