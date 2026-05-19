/**
 * Unit tests for useLeafletMap hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => ({
      remove: vi.fn(),
      fitBounds: vi.fn(),
      panTo: vi.fn(),
      getBounds: vi.fn(() => ({
        getNorth: () => 48.8566,
        getSouth: () => 48.8565,
        getEast: () => 2.3523,
        getWest: () => 2.3522,
      })),
      getCenter: vi.fn(() => ({ lat: 48.8566, lng: 2.3522 })),
      getZoom: vi.fn(() => 14),
      hasLayer: vi.fn(() => true),
      removeLayer: vi.fn(),
      addTo: vi.fn(),
    })),
    tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    latLngBounds: vi.fn(() => ({
      getNorth: () => 48.8566,
      getSouth: () => 48.8565,
      getEast: () => 2.3523,
      getWest: () => 2.3522,
    })),
    polyline: vi.fn(() => ({ addTo: vi.fn(), setLatLngs: vi.fn() })),
    marker: vi.fn(() => ({ addTo: vi.fn(), setLatLng: vi.fn() })),
    circle: vi.fn(() => ({ addTo: vi.fn(), setLatLng: vi.fn(), setRadius: vi.fn() })),
  },
}));

import { useLeafletMap } from '@/hooks/useLeafletMap';

describe('useLeafletMap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize map options', () => {
    const { result } = renderHook(() => useLeafletMap({ center: { lat: 48.8566, lng: 2.3522 }, zoom: 14 }));
    expect(result.current).toBeDefined();
  });

  it('should provide map utilities', () => {
    const { result } = renderHook(() => useLeafletMap());
    expect(result.current).toBeDefined();
  });

  it('should handle map cleanup', () => {
    const { unmount } = renderHook(() => useLeafletMap());
    unmount();
  });
});
