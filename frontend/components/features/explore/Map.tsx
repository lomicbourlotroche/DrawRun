'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface MapComponentProps {
  polyline?: string;
  startPoint?: { lat: number; lng: number };
  endPoint?: { lat: number; lng: number };
  height?: string;
  showPopup?: boolean;
}

// Polyline decoder for Google encoded polyline format
function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

function MapBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  
  useEffect(() => {
    if (points.length > 0) {
      const bounds = points.reduce(
        (acc, point) => [
          [Math.min(acc[0][0], point[0]), Math.min(acc[0][1], point[1])],
          [Math.max(acc[1][0], point[0]), Math.max(acc[1][1], point[1])],
        ],
        [
          [points[0][0], points[0][1]],
          [points[0][0], points[0][1]],
        ]
      );
      map.fitBounds(bounds as any, { padding: [20, 20] });
    }
  }, [map, points]);

  return null;
}

export function MapComponent({
  polyline,
  startPoint,
  endPoint,
  height = '400px',
  showPopup = true,
}: MapComponentProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const points = useMemo(() => {
    if (polyline) {
      return decodePolyline(polyline);
    }
    return [];
  }, [polyline]);

  const center = useMemo(() => {
    if (points.length > 0) {
      return points[Math.floor(points.length / 2)];
    }
    if (startPoint) {
      return [startPoint.lat, startPoint.lng];
    }
    return [48.8566, 2.3522]; // Paris default
  }, [points, startPoint]);

  if (!mounted) {
    return <div style={{ height, background: '#f0f0f0' }} className="rounded-lg" />;
  }

  return (
    <div style={{ height }} className="rounded-lg overflow-hidden border">
      <MapContainer
        center={center as [number, number]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {points.length > 0 && (
          <>
            <Polyline 
              positions={points} 
              color="#ef4444" 
              weight={4}
              opacity={0.8}
            />
            <MapBounds points={points} />
          </>
        )}

        {startPoint && (
          <Marker position={[startPoint.lat, startPoint.lng]}>
            {showPopup && (
              <Popup>Départ</Popup>
            )}
          </Marker>
        )}

        {endPoint && (
          <Marker position={[endPoint.lat, endPoint.lng]}>
            {showPopup && (
              <Popup>Arrivée</Popup>
            )}
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

// Simple component for activity maps
export function ActivityMap({ 
  polyline, 
  height = '300px' 
}: { 
  polyline: string; 
  height?: string;
}) {
  return (
    <MapComponent 
      polyline={polyline} 
      height={height}
      showPopup={false}
    />
  );
}

// Component for segment preview
export function SegmentMap({
  polyline,
  startLat,
  startLng,
  endLat,
  endLng,
  height = '300px',
}: {
  polyline: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  height?: string;
}) {
  return (
    <MapComponent
      polyline={polyline}
      startPoint={{ lat: startLat, lng: startLng }}
      endPoint={{ lat: endLat, lng: endLng }}
      height={height}
    />
  );
}
