/**

 * useLeafletMap Hook

 *

 * A custom hook for managing Leaflet map instances in DrawRun.

 * Provides centralized map initialization, cleanup, and utility functions.

 *

 * @module hooks/useLeafletMap

 */

import React, { useEffect, useRef, useState, useCallback } from 'react';

import type { DrawRunMap, LatLng, MapBounds, DrawRunPolyline, DrawRunMarker, DrawRunCircle } from '@/types/leaflet';

import L from 'leaflet';

/**

 * Options for initializing a Leaflet map

 */

export interface UseLeafletMapOptions {
  /** Initial center coordinates */

  center?: LatLng;

  /** Initial zoom level */

  zoom?: number;

  /** Whether to show zoom controls */

  zoomControl?: boolean;

  /** Whether to show attribution control */

  attributionControl?: boolean;

  /** Minimum zoom level */

  minZoom?: number;

  /** Maximum zoom level */

  maxZoom?: number;

  /** Tile layer URL template */

  tileLayerUrl?: string;

  /** Tile layer attribution */

  tileLayerAttribution?: string;
}

/**

 * Result of the useLeafletMap hook

 */

export interface UseLeafletMapResult {
  /** Reference to the map container div */

  mapRef: React.RefObject<HTMLDivElement>;

  /** Reference to the Leaflet map instance */

  mapInstanceRef: React.RefObject<DrawRunMap | null>;

  /** Whether the map is currently loaded */

  isLoaded: boolean;

  /** Whether there was an error loading the map */

  error: Error | null;

  /** Fit the map to the given bounds */

  fitBounds: (_bounds: LatLng[] | L.LatLngBounds, _options?: L.FitBoundsOptions) => void;

  /** Pan the map to a specific coordinate */

  panTo: (_latlng: LatLng, _options?: L.PanOptions) => void;

  /** Add a polyline to the map */

  addPolyline: (_coordinates: LatLng[], _options?: L.PolylineOptions) => DrawRunPolyline | null;

  /** Add a marker to the map */

  addMarker: (_latlng: LatLng, _options?: L.MarkerOptions) => DrawRunMarker | null;

  /** Add a circle to the map */

  addCircle: (_latlng: LatLng, _options?: L.CircleOptions) => DrawRunCircle | null;

  /** Remove all layers from the map */

  clearLayers: () => void;

  /** Get the current map bounds */

  getBounds: () => MapBounds | null;

  /** Get the current map center */

  getCenter: () => LatLng | null;

  /** Get the current zoom level */

  getZoom: () => number | null;
}

/**

 * Custom hook for managing a Leaflet map instance.

 *

 * @param options - Configuration options for the map

 * @returns Object containing map refs, state, and utility functions

 *

 * @example

 * ```typescript

 * const { mapRef, isLoaded, fitBounds, addPolyline } = useLeafletMap({

 *   center: [48.8566, 2.3522],

 *   zoom: 14,

 * });

 *

 * // In your component

 * <div ref={mapRef} style={{ height: '400px' }} />

 *

 * // When you have coordinates

 * useEffect(() => {

 *   if (isLoaded && coordinates.length > 0) {

 *     fitBounds(coordinates);

 *     addPolyline(coordinates, { color: 'red', weight: 4 });

 *   }

 * }, [isLoaded, coordinates]);

 * ```

 */

export function useLeafletMap(options: UseLeafletMapOptions = {}): UseLeafletMapResult {
  const {
    center = [48.8566, 2.3522],

    zoom = 14,

    zoomControl = false,

    attributionControl = false,

    minZoom = 1,

    maxZoom = 20,

    tileLayerUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',

    tileLayerAttribution = '© OpenStreetMap contributors',
  } = options;

  const mapRef = useRef<HTMLDivElement>(null);

  const mapInstanceRef = useRef<DrawRunMap | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);

  const [error, setError] = useState<Error | null>(null);

  const layerRefs = useRef<(DrawRunPolyline | DrawRunMarker | DrawRunCircle)[]>([]);

  // Initialize the map

  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined') return;

    const initMap = async () => {
      try {
        // Ensure Leaflet is loaded

        if (typeof window.L === 'undefined') {
          await import('leaflet');
        }

        const L = window.L;

        // Cleanup existing map

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();

          mapInstanceRef.current = null;
        }

        // Create map instance

        const map = L.map(mapRef.current!, {
          zoomControl,

          attributionControl,

          zoom,

          center,

          minZoom,

          maxZoom,
        }) as DrawRunMap;

        // Add tile layer

        L.tileLayer(tileLayerUrl, {
          attribution: tileLayerAttribution,
        }).addTo(map);

        mapInstanceRef.current = map;

        setIsLoaded(true);

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize map'));

        setIsLoaded(false);
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();

        mapInstanceRef.current = null;
      }

      setIsLoaded(false);
    };
  }, [center, zoom, zoomControl, attributionControl, minZoom, maxZoom, tileLayerUrl, tileLayerAttribution]);

  // Fit the map to bounds

  const fitBounds = useCallback(
    (
      bounds: LatLng[] | L.LatLngBounds,

      options?: L.FitBoundsOptions,
    ): void => {
      if (!mapInstanceRef.current) return;

      if (Array.isArray(bounds) && bounds.length > 0) {
        mapInstanceRef.current.fitBounds(L.latLngBounds(bounds), options);
      } else if (bounds instanceof L.LatLngBounds) {
        mapInstanceRef.current.fitBounds(bounds, options);
      }
    },
    [],
  );

  // Pan the map to a coordinate

  const panTo = useCallback((latlng: LatLng, options?: L.PanOptions): void => {
    if (!mapInstanceRef.current) return;

    mapInstanceRef.current.panTo(latlng, options);
  }, []);

  // Add a polyline to the map

  const addPolyline = useCallback(
    (
      coordinates: LatLng[],

      options?: L.PolylineOptions,
    ): DrawRunPolyline | null => {
      if (!mapInstanceRef.current || coordinates.length === 0) return null;

      const polyline = L.polyline(coordinates, options) as DrawRunPolyline;

      polyline.addTo(mapInstanceRef.current);

      layerRefs.current.push(polyline);

      return polyline;
    },
    [],
  );

  // Add a marker to the map

  const addMarker = useCallback(
    (
      latlng: LatLng,

      options?: L.MarkerOptions,
    ): DrawRunMarker | null => {
      if (!mapInstanceRef.current) return null;

      const marker = L.marker(latlng, options) as DrawRunMarker;

      marker.addTo(mapInstanceRef.current);

      layerRefs.current.push(marker);

      return marker;
    },
    [],
  );

  // Add a circle to the map

  const addCircle = useCallback(
    (
      latlng: LatLng,

      options?: L.CircleOptions,
    ): DrawRunCircle | null => {
      if (!mapInstanceRef.current) return null;

      const circle = L.circle(latlng, options ?? {}) as DrawRunCircle;
      circle.addTo(mapInstanceRef.current);

      layerRefs.current.push(circle);

      return circle;
    },
    [],
  );

  // Remove all custom layers from the map

  const clearLayers = useCallback((): void => {
    layerRefs.current.forEach((layer) => {
      if (mapInstanceRef.current && mapInstanceRef.current.hasLayer(layer)) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });

    layerRefs.current = [];
  }, []);

  // Get the current map bounds

  const getBounds = useCallback((): MapBounds | null => {
    if (!mapInstanceRef.current) return null;

    const bounds = mapInstanceRef.current.getBounds();

    return {
      north: bounds.getNorth(),

      south: bounds.getSouth(),

      east: bounds.getEast(),

      west: bounds.getWest(),
    };
  }, []);

  // Get the current map center

  const getCenter = useCallback((): LatLng | null => {
    if (!mapInstanceRef.current) return null;

    const center = mapInstanceRef.current.getCenter();

    return [center.lat, center.lng];
  }, []);

  // Get the current zoom level

  const getZoom = useCallback((): number | null => {
    if (!mapInstanceRef.current) return null;

    return mapInstanceRef.current.getZoom();
  }, []);

  return {
    mapRef,

    mapInstanceRef,

    isLoaded,

    error,

    fitBounds,

    panTo,

    addPolyline,

    addMarker,

    addCircle,

    clearLayers,

    getBounds,

    getCenter,

    getZoom,
  };
}

/**

 * Hook for managing a simple static map with a single polyline

 */

export function useSimplePolylineMap(
  coordinates: LatLng[],

  options?: UseLeafletMapOptions & { color?: string; weight?: number },
) {
  const { mapRef, isLoaded, fitBounds, addPolyline } = useLeafletMap(options);

  const polylineRef = useRef<DrawRunPolyline | null>(null);

  useEffect(() => {
    if (!isLoaded || coordinates.length === 0) return;

    // Clear existing polyline

    if (polylineRef.current) {
      // This would need to be implemented based on your map instance
      // For now, we'll just create a new one
    }

    // Add new polyline

    polylineRef.current = addPolyline(coordinates, {
      color: options?.color || 'var(--danger)',

      weight: options?.weight || 4,

      opacity: 0.8,
    });

    // Fit to bounds

    fitBounds(coordinates);
  }, [isLoaded, coordinates, fitBounds, addPolyline, options?.color, options?.weight]);

  return { mapRef, isLoaded };
}

export default useLeafletMap;
