'use client';

import { useEffect, useRef } from 'react';
import type { DrawRunMap, DrawRunMarker, LatLng } from '@/types/leaflet';
import L from 'leaflet';

interface CoordinatePoint {
  lat: number;
  lng: number;
}

interface RouteCreationOverlayProps {
  map: DrawRunMap;
  routeCreationPoints: CoordinatePoint[];
  onWaypointDrag?: (_index: number, _latlng: CoordinatePoint) => void;
  isLoop: boolean;
}

export default function RouteCreationOverlay({ map, routeCreationPoints, onWaypointDrag, isLoop }: RouteCreationOverlayProps) {
  const waypointMarkersRef = useRef<DrawRunMarker[]>([]);
  const creationPolylineRef = useRef<L.Polyline | null>(null);
  const layersRef = useRef<Map<string, L.Layer>>(new Map());
  const mapRef = useRef(map);
  mapRef.current = map;

  useEffect(() => {
    waypointMarkersRef.current.forEach((m) => {
      if (m && (m as unknown as { _map: unknown })._map) {
        map.removeLayer(m);
      }
    });
    waypointMarkersRef.current = [];

    if (creationPolylineRef.current) {
      map.removeLayer(creationPolylineRef.current);
      creationPolylineRef.current = null;
    }

    layersRef.current.forEach((layer, key) => {
      if (key === 'loop_closure') {
        map.removeLayer(layer);
        layersRef.current.delete(key);
      }
    });

    if (routeCreationPoints.length === 0) return;

    routeCreationPoints.forEach((pt, idx) => {
      const waypointIcon = L.divIcon({
        className: 'waypoint-marker',
        html: `<div style="
          width:24px;height:24px;background:var(--primary);border:3px solid var(--surface);
          border-radius:50%;display:flex;align-items:center;justify-content:center;
          color:var(--surface);font-size:11px;font-weight:bold;
        ">${idx + 1}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([pt.lat, pt.lng], {
        icon: waypointIcon,
        draggable: true,
      }) as DrawRunMarker;
      marker.addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        if (onWaypointDrag) {
          onWaypointDrag(idx, { lat: pos.lat, lng: pos.lng });
        }
      });

      waypointMarkersRef.current.push(marker);
    });

    const polyPoints = routeCreationPoints.map((p) => [p.lat, p.lng] as LatLng);
    const polyline = L.polyline(polyPoints, {
      color: 'var(--primary)',
      weight: 4,
      opacity: 0.8,
    });
    polyline.addTo(map);
    creationPolylineRef.current = polyline;

    if (isLoop && routeCreationPoints.length >= 3) {
      const first = routeCreationPoints[0];
      const last = routeCreationPoints[routeCreationPoints.length - 1];
      const loopLine = L.polyline(
        [[last.lat, last.lng], [first.lat, first.lng]],
        {
          color: 'var(--primary)',
          weight: 3,
          opacity: 0.6,
          dashArray: '8 6',
        }
      );
      loopLine.addTo(map);
      layersRef.current.set('loop_closure', loopLine);
    }

    map.fitBounds(L.latLngBounds(polyPoints), { padding: [40, 40], maxZoom: 17 });

    return () => {
      waypointMarkersRef.current.forEach((m) => {
        if (m && (m as unknown as { _map: unknown })._map) {
          (m as unknown as { _map: { removeLayer: (_layer: unknown) => void } })._map.removeLayer(m);
        }
      });
      if (creationPolylineRef.current) {
        const currentMap = mapRef.current;
        if (currentMap && creationPolylineRef.current && (creationPolylineRef.current as unknown as { _map: unknown })._map) {
          currentMap.removeLayer(creationPolylineRef.current);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeCreationPoints, isLoop]);

  return null;
}
