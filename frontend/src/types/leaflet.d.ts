/**
 * Type definitions for Leaflet library
 * This file provides TypeScript type definitions for Leaflet objects used in the DrawRun project.
 * It allows us to remove all `any` types from map-related components.
 */

import L from 'leaflet';

// Extend Leaflet types for custom properties used in DrawRun
declare module 'leaflet' {
  // HeatLayer extension (leaflet-heat)
  interface HeatLayerOptions {
    radius?: number;
    blur?: number;
    maxZoom?: number;
    max?: number;
    gradient?: Record<number, string>;
    opacity?: number;
  }

  interface HeatLayer extends L.Layer {
    setLatLngs(_points: [number, number, number][]): void;
    addTo(_map: L.Map): this;
    remove(): void;
  }

  // Extend Map with heatLayer method
  // eslint-disable-next-line unused-imports/no-unused-vars
  interface Map {
    heatLayer?: (_points: [number, number, number][], _options?: HeatLayerOptions) => HeatLayer;
  }

  // Extend Window with L namespace
  // eslint-disable-next-line unused-imports/no-unused-vars
  interface Window {
    L: typeof L;
  }
}

// Custom types for DrawRun map components

/**
 * Represents a geographic coordinate (latitude, longitude)
 */
export type LatLng = [number, number];

/**
 * Represents a polyline coordinate tuple with intensity (for heatmaps)
 */
export type LatLngWithIntensity = [number, number, number];

/**
 * Represents a segment for the map (start and end coordinates)
 */
export interface MapSegment {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color?: string;
}

/**
 * Represents bounds for a map view (north, south, east, west)
 */
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Represents a Leaflet map instance with DrawRun-specific extensions
 */
export interface DrawRunMap extends L.Map {
  heatLayer?: (_points: LatLngWithIntensity[], _options?: L.HeatLayerOptions) => L.HeatLayer;
}

/**
 * Represents a Leaflet polyline with DrawRun-specific properties
 */
export interface DrawRunPolyline extends L.Polyline {
  setLatLngs: (_latlngs: LatLng[]) => void;
}

/**
 * Represents a Leaflet marker with DrawRun-specific properties
 */
export interface DrawRunMarker extends L.Marker {
  setLatLng: (_latlng: LatLng) => void;
}

/**
 * Represents a Leaflet circle with DrawRun-specific properties
 */
export interface DrawRunCircle extends L.Circle {
  setLatLng: (_latlng: LatLng) => void;
  setRadius: (_radius: number) => void;
}

/**
 * Represents a Leaflet circle marker with DrawRun-specific properties
 */
export interface DrawRunCircleMarker extends L.CircleMarker {
  setLatLng: (_latlng: LatLng) => void;
}

/**
 * Props for the ActivityMap component
 */
export interface ActivityMapProps {
  polyline?: string | null;
  latlng?: LatLng[];
  className?: string;
  color?: string;
  currentPosition?: LatLng | null;
  accuracy?: number;
  showTrailAnimation?: boolean;
  segments?: MapSegment[];
  onMapReady?: (_map: DrawRunMap) => void;
}

/**
 * Props for the HeatmapLayer component
 */
export interface HeatmapLayerProps {
  map: DrawRunMap;
  bounds: MapBounds | null;
  activityType?: string;
  visible: boolean;
}

/**
 * Point data for heatmap
 */
export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

/**
 * Options for creating a Leaflet map in DrawRun
 */
export interface DrawRunMapOptions extends L.MapOptions {
  zoomControl?: boolean;
  attributionControl?: boolean;
  zoom?: number;
  center?: LatLng;
}
