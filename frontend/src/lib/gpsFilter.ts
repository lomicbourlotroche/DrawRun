export interface RawGPSPoint {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

export interface FilteredGPSPoint extends RawGPSPoint {
  smoothedSpeed: number;
  verticalAccuracy: number;
}

export function createGPSFilter(alpha = 0.4, speedAlpha = 0.3) {
  let prevLat: number | null = null;
  let prevLng: number | null = null;
  let prevAlt: number | null = null;
  let smoothedSpeed = 0;

  return (point: RawGPSPoint): FilteredGPSPoint => {
    const { latitude, longitude, altitude, accuracy, speed, heading, timestamp } = point;

    if (prevLat === null || accuracy > 100) {
      prevLat = latitude;
      prevLng = longitude;
      prevAlt = altitude;
      smoothedSpeed = speed ?? 0;
      return { ...point, smoothedSpeed, verticalAccuracy: accuracy * 1.5 };
    }

    const filteredLat = prevLat! + alpha * (latitude - prevLat!);
    const filteredLng = prevLng! + alpha * (longitude - prevLng!);
    const filteredAlt = altitude !== null && prevAlt !== null ? prevAlt + alpha * (altitude - prevAlt) : altitude;

    const rawSpeed = speed ?? 0;
    smoothedSpeed = speedAlpha > 0 ? smoothedSpeed + speedAlpha * (rawSpeed - smoothedSpeed) : rawSpeed;

    prevLat = filteredLat;
    prevLng = filteredLng;
    prevAlt = filteredAlt;

    return {
      latitude: filteredLat,
      longitude: filteredLng,
      altitude: filteredAlt,
      accuracy,
      speed,
      heading,
      timestamp,
      smoothedSpeed,
      verticalAccuracy: accuracy * 1.5,
    };
  };
}

export function isSpuriousJump(p1: RawGPSPoint, p2: RawGPSPoint, maxSpeed = 45): boolean {
  if (!p1 || !p2) return false;
  const R = 6371e3;
  const dLat = ((p2.latitude - p1.latitude) * Math.PI) / 180;
  const dLng = ((p2.longitude - p1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((p1.latitude * Math.PI) / 180) * Math.cos((p2.latitude * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dt = (p2.timestamp - p1.timestamp) / 1000;
  if (dt <= 0) return true;
  return dist / dt > maxSpeed;
}
