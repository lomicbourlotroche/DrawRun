'use client';
import ActivityMap from '@/components/ui/ActivityMap';
function LiveMap({
  points,
  height = 'h-32',
  currentPosition,
  accuracy,
  segments,
}: {
  points: Array<{ gps: { latitude: number; longitude: number } }>;
  height?: string;
  currentPosition?: [number, number] | null;
  accuracy?: number;
  segments?: Array<{ startLat: number; startLng: number; endLat: number; endLng: number; color?: string }>;
}) {
  const latlng: [number, number][] = points.map((p) => [p.gps.latitude, p.gps.longitude]);
  return (
    <ActivityMap
      latlng={latlng}
      className={height}
      color="var(--peak)"
      showTrailAnimation
      currentPosition={currentPosition}
      accuracy={accuracy}
      segments={segments}
    />
  );
}
export { LiveMap };
