/**
 * Unit tests for useLeafletMap hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLeafletMap } from '@/hooks/useLeafletMap';

// Mock Leaflet
const mockL = {
  map: vi.fn().mockImplementation(() => ({
    remove: vi.fn(),
    fitBounds: vi.fn(),
    panTo: vi.fn(),
    getBounds: vi.fn().mockReturnValue({
      getNorth: () => 48.8566,
      getSouth: () => 48.8565,
      getEast: () => 2.3523,
      getWest: () => 2.3522,
    }),
    getCenter: vi.fn().mockReturnValue({ lat: 48.8566, lng: 2.3522 }),
    getZoom: vi.fn().mockReturnValue(14),
    hasLayer: vi.fn().mockReturnValue(true),
    removeLayer: vi.fn(),
    addTo: vi.fn(),
  })),
  tileLayer: vi.fn().mockImplementation(() => ({
    addTo: vi.fn(),
  })),
  latLngBounds: vi.fn().mockImplementation((bounds) => ({
    getNorth: () => 48.8566,
    getSouth: () => 48.8565,
    getEast: () => 2.3523,
    getWest: () => 2.3522,
  })),
  polyline: vi.fn().mockImplementation(() => ({
    addTo: vi.fn(),
    setLatLngs: vi.fn(),
  })),
  marker: vi.fn().mockImplementation(() => ({
    addTo: vi.fn(),
    setLatLng: vi.fn(),
  })),
  circle: vi.fn().mockImplementation(() => ({
    addTo: vi.fn(),
    setLatLng: vi.fn(),
    setRadius: vi.fn(),
  })),
};

// Mock window.L
declare global {
  interface Window {
    L: typeof mockL;
  }
}

describe('useLeafletMap', () => {
  beforeEach(() => {
    global.window = { L: mockL } as unknown as Window & typeof globalThis;
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete global.window;
  });

  it('should initialize with default options', () => {
    const { result } = renderHook(() => useLeafletMap());
    
    expect(result.current.isLoaded).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.mapRef).toBeDefined();
    expect(result.current.mapInstanceRef).toBeDefined();
  });

  it('should initialize with custom options', () => {
    const { result } = renderHook(() => 
      useLeafletMap({
        center: [40.7128, -74.0060],
        zoom: 12,
        zoomControl: true,
        attributionControl: true,
      })
    );
    
    expect(result.current.isLoaded).toBe(false);
  });

  it('should provide utility functions', () => {
    const { result } = renderHook(() => useLeafletMap());
    
    expect(typeof result.current.fitBounds).toBe('function');
    expect(typeof result.current.panTo).toBe('function');
    expect(typeof result.current.addPolyline).toBe('function');
    expect(typeof result.current.addMarker).toBe('function');
    expect(typeof result.current.addCircle).toBe('function');
    expect(typeof result.current.clearLayers).toBe('function');
    expect(typeof result.current.getBounds).toBe('function');
    expect(typeof result.current.getCenter).toBe('function');
    expect(typeof result.current.getZoom).toBe('function');
  });

  it('should call fitBounds with coordinates', () => {
    const { result } = renderHook(() => useLeafletMap());
    
    // Mock the map instance
    const mockMap = {
      fitBounds: vi.fn(),
    };
    result.current.mapInstanceRef.current = mockMap as unknown as import('@/types/leaflet').DrawRunMap;
    
    const coordinates = [[48.8566, 2.3522], [48.8567, 2.3523]];
    result.current.fitBounds(coordinates);
    
    expect(mockMap.fitBounds).toHaveBeenCalled();
  });

  it('should call panTo with coordinate', () => {
    const { result } = renderHook(() => useLeafletMap());
    
    // Mock the map instance
    const mockMap = {
      panTo: vi.fn(),
    };
    result.current.mapInstanceRef.current = mockMap as unknown as import('@/types/leaflet').DrawRunMap;
    
    const coordinate = [48.8566, 2.3522];
    result.current.panTo(coordinate);
    
    expect(mockMap.panTo).toHaveBeenCalledWith(coordinate, undefined);
  });

  it('should return null for getBounds when no map instance', () => {
    const { result } = renderHook(() => useLeafletMap());
    
    expect(result.current.getBounds()).toBeNull();
  });

  it('should return null for getCenter when no map instance', () => {
    const { result } = renderHook(() => useLeafletMap());
    
    expect(result.current.getCenter()).toBeNull();
  });

  it('should return null for getZoom when no map instance', () => {
    const { result } = renderHook(() => useLeafletMap());
    
    expect(result.current.getZoom()).toBeNull();
  });

  it('should return null for addPolyline when no map instance', () => {
    const { result } = renderHook(() => useLeafletMap());
    
    const coordinates = [[48.8566, 2.3522], [48.8567, 2.3523]];
    expect(result.current.addPolyline(coordinates)).toBeNull();
  });

  it('should return null for addPolyline with empty coordinates', () => {
    const { result } = renderHook(() => useLeafletMap());
    
    // Mock the map instance
    const mockMap = {};
    result.current.mapInstanceRef.current = mockMap as unknown as import('@/types/leaflet').DrawRunMap;
    
    expect(result.current.addPolyline([])).toBeNull();
  });

  it('should return null for addMarker when no map instance', () => {
    const { result } = renderHook(() => useLeafletMap());
    
    const coordinate = [48.8566, 2.3522];
    expect(result.current.addMarker(coordinate)).toBeNull();
  });

  it('should return null for addCircle when no map instance', () => {
    const { result } = renderHook(() => useLeafletMap());
    
    const coordinate = [48.8566, 2.3522];
    expect(result.current.addCircle(coordinate)).toBeNull();
  });

  it('should not throw when clearing layers with no map instance', () => {
    const { result } = renderHook(() => useLeafletMap());
    
    expect(() => result.current.clearLayers()).not.toThrow();
  });
});
