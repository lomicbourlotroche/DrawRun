'use client';

import 'leaflet/dist/leaflet.css';
import { useState, useCallback, useEffect } from 'react';
import type { DrawRunMap } from '@/types/leaflet';
import MapController from './MapController';
import RouteOverlay from './RouteOverlay';
import SegmentOverlay from './SegmentOverlay';
import UserLocationMarker from './UserLocationMarker';
import HeatmapOverlay from './HeatmapOverlay';
import RouteCreationOverlay from './RouteCreationOverlay';
import CurrentRouteOverlay from './CurrentRouteOverlay';

interface RouteData {
  id: number;
  polyline: string;
  color?: string;
  name?: string;
  onClick?: () => void;
}

interface SegmentData {
  id: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  polyline?: string;
  name?: string;
  onClick?: () => void;
}

interface HeatmapDataPoint {
  lat: number;
  lng: number;
  intensity: number;
}

interface CoordinatePoint {
  lat: number;
  lng: number;
}

interface ExploreMapProps {
  onMapReady?: (_map: DrawRunMap) => void;
  onMapClick?: (_latlng: CoordinatePoint) => void;
  center?: CoordinatePoint;
  zoom?: number;
  mapLayer?: string;
  routes?: RouteData[];
  segments?: SegmentData[];
  userLocation?: CoordinatePoint | null;
  heatmapData?: HeatmapDataPoint[];
  showHeatmap?: boolean;
  routeCreationPoints?: CoordinatePoint[];
  routeCreationActive?: boolean;
  onWaypointAdd?: (_latlng: CoordinatePoint) => void;
  onWaypointDrag?: (_index: number, _latlng: CoordinatePoint) => void;
  currentRoutePolyline?: string;
  isLoop?: boolean;
}

export default function ExploreMap({
  onMapReady,
  onMapClick,
  center = { lat: 48.400771, lng: -4.502407 },
  zoom = 14,
  mapLayer = 'osm',
  routes = [],
  segments = [],
  userLocation,
  heatmapData = [],
  showHeatmap = false,
  routeCreationPoints = [],
  routeCreationActive = false,
  onWaypointAdd,
  onWaypointDrag,
  currentRoutePolyline,
  isLoop = false,
}: ExploreMapProps) {
  const [mapInstance, setMapInstance] = useState<DrawRunMap | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const handleMapReady = useCallback(
    (map: DrawRunMap) => {
      setMapInstance(map);
      setMapReady(true);
      onMapReady?.(map);
    },
    [onMapReady],
  );

  return (
    <>
      <MapController
        center={center}
        zoom={zoom}
        mapLayer={mapLayer}
        routeCreationActive={routeCreationActive}
        onMapReady={handleMapReady}
        onMapClick={onMapClick}
        onWaypointAdd={onWaypointAdd}
      />
      {mapReady && mapInstance && (
        <>
          <RouteOverlay map={mapInstance} routes={routes} />
          <SegmentOverlay map={mapInstance} segments={segments} />
          <UserLocationMarker map={mapInstance} userLocation={userLocation} />
          <HeatmapOverlay
            map={mapInstance}
            heatmapData={heatmapData}
            showHeatmap={showHeatmap}
          />
          <RouteCreationOverlay
            map={mapInstance}
            routeCreationPoints={routeCreationPoints}
            onWaypointDrag={onWaypointDrag}
            isLoop={isLoop}
          />
          <CurrentRouteOverlay
            map={mapInstance}
            currentRoutePolyline={currentRoutePolyline}
          />
        </>
      )}
    </>
  );
}
