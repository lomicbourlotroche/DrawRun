/**
 * ============================================================
 * EXPLORE API - Endpoints exploration (Segments & Routes)
 * ============================================================
 *
 * Ce fichier contient tous les endpoints d'exploration :
 * - Segments et efforts
 * - Routes publiques
 * - Heatmaps
 *
 * @module lib/api/explore.api
 */

import type {
  CreateSegmentParams,
  CreateSegmentEffortParams,
  CreateRouteParams,
  SegmentLeaderboardEntry,
} from './types';
import { client } from './client';

// Segment types for responses
export interface Segment {
  id: number;
  name: string;
  description?: string;
  distance: number;
  elevation_gain: number;
  elevation_loss?: number;
  avg_grade?: number;
  max_grade?: number;
  polyline?: string;
  activity_type: string;
  start_lat?: number;
  start_lng?: number;
  end_lat?: number;
  end_lng?: number;
  effort_count?: number;
  creator_name?: string;
  is_public?: boolean;
  created_at?: string;
}

// Route types for responses
export interface Route {
  id: number;
  name: string;
  description?: string;
  distance: number;
  elevation_gain: number;
  elevation_loss?: number;
  polyline: string;
  activity_type: string;
  estimated_duration?: number;
  difficulty?: string;
  tags?: string[];
  avg_rating?: number;
  rating_count: number;
  usage_count: number;
  creator_name?: string;
  is_favorited?: boolean;
  is_public?: boolean;
  created_at?: string;
  waypoints?: string; // NEW
  directions?: string; // NEW (JSON string of Direction[])
}

// Heatmap types
export interface HeatmapDataPoint {
  lat: number;
  lng: number;
  intensity: number;
}

// Community trace types
export interface CommunityTrace {
  id: number;
  polyline: string;
  distance: number;
  activity_type: string;
  difficulty?: string;
  elevation_gain?: number;
}

// Elevation profile types
export interface ElevationPoint {
  distance: number;
  elevation: number;
  lat: number;
  lng: number;
}

export interface ElevationStats {
  total_gain: number;
  max_elevation: number;
  min_elevation: number;
}

// Direction/instruction types for route generation
export interface Direction {
  index: number;
  instruction: string;
  distance: number;
  distance_formatted: string;
  duration: number;
  street: string;
  type: string;
  modifier: string;
  location: [number, number]; // [lng, lat]
  cumulative_distance: number;
  cumulative_duration: number;
}

export interface GeneratedRouteResponse {
  success: boolean;
  route_id: number;
  directions: Direction[];
  directions_count: number;
  distance: number;
  distance_formatted: string;
  duration: number;
  duration_formatted: string;
  polyline: string;
  elevation_gain: number;
  waypoints_used: number;
  error?: string;
}

export const exploreApi = {
  // ============================================================================
  // Segments
  // ============================================================================

  createSegment(data: CreateSegmentParams): Promise<{
    success: boolean;
    segment_id?: number;
    error?: string;
  }> {
    return client.request('/api/explore/segments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getNearbySegments(
    lat: number,
    lng: number,
    radius?: number,
    type?: string,
  ): Promise<{
    success: boolean;
    segments: Segment[];
  }> {
    const query = new URLSearchParams();
    query.set('lat', String(lat));
    query.set('lng', String(lng));
    if (radius) query.set('radius', String(radius));
    if (type) query.set('type', type);
    return client.request(`/api/explore/segments?${query.toString()}`);
  },

  getPublicSegments(): Promise<{
    success: boolean;
    segments: Segment[];
  }> {
    return client.request('/api/explore/segments');
  },

  getSegment(segmentId: number): Promise<{
    success: boolean;
    segment: Segment & {
      total_efforts?: number;
      unique_athletes?: number;
      kom?: { user_name: string; elapsed_time: number };
      qom?: { user_name: string; elapsed_time: number };
    };
  }> {
    return client.request(`/api/explore/segments/${segmentId}`);
  },

  getSegmentLeaderboard(segmentId: number): Promise<{
    success: boolean;
    leaderboard: SegmentLeaderboardEntry[];
  }> {
    return client.request(`/api/explore/segments/${segmentId}/leaderboard`);
  },

  createSegmentEffort(params: CreateSegmentEffortParams): Promise<{
    success: boolean;
    effort_id?: number;
    is_pr?: boolean;
    error?: string;
  }> {
    return client.request(`/api/explore/segments/${params.segmentId}/efforts`, {
      method: 'POST',
      body: JSON.stringify(params.data),
    });
  },

  getMySegmentEfforts(segmentId: number): Promise<{
    success: boolean;
    efforts: Array<{
      id: number;
      segment_id: number;
      activity_id: number;
      elapsed_time: number;
      moving_time?: number;
      start_date: string;
      avg_watts?: number;
      max_watts?: number;
      avg_heartrate?: number;
      max_heartrate?: number;
      activity_name?: string;
    }>;
  }> {
    return client.request(`/api/explore/segments/${segmentId}/efforts/me`);
  },

  deleteSegment(segmentId: number): Promise<{
    success: boolean;
    error?: string;
  }> {
    return client.request(`/api/explore/segments/${segmentId}`, { method: 'DELETE' });
  },

  // ============================================================================
  // Routes
  // ============================================================================

  createRoute(data: CreateRouteParams): Promise<{
    success: boolean;
    route_id?: number;
    error?: string;
  }> {
    return client.request('/api/explore/routes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getPublicRoutes(
    type?: string,
    difficulty?: string,
  ): Promise<{
    success: boolean;
    routes: Route[];
  }> {
    const query = new URLSearchParams();
    if (type) query.set('type', type);
    if (difficulty) query.set('difficulty', difficulty);
    return client.request(`/api/explore/routes?${query.toString()}`);
  },

  getRoute(routeId: number): Promise<{
    success: boolean;
    route: Route;
  }> {
    return client.request(`/api/explore/routes/${routeId}`);
  },

  addRouteToFavorites(routeId: number): Promise<{ success: boolean; error?: string }> {
    return client.request(`/api/explore/routes/${routeId}/favorite`, { method: 'POST' });
  },

  removeRouteFromFavorites(routeId: number): Promise<{ success: boolean; error?: string }> {
    return client.request(`/api/explore/routes/${routeId}/favorite`, { method: 'DELETE' });
  },

  useRoute(routeId: number): Promise<{ success: boolean; error?: string }> {
    return client.request(`/api/explore/routes/${routeId}/use`, { method: 'POST' });
  },

  getMyRoutes(): Promise<{
    success: boolean;
    routes: Route[];
  }> {
    return client.request('/api/explore/routes/my');
  },

  getFavoriteRoutes(): Promise<{
    success: boolean;
    routes: Route[];
  }> {
    return client.request('/api/explore/routes/favorites');
  },

  deleteRoute(routeId: number): Promise<{
    success: boolean;
    error?: string;
  }> {
    return client.request(`/api/explore/routes/${routeId}`, { method: 'DELETE' });
  },

  rateRoute(
    routeId: number,
    rating: number,
  ): Promise<{
    success: boolean;
    avg_rating?: number;
    rating_count?: number;
    error?: string;
  }> {
    return client.request(`/api/explore/routes/${routeId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating }),
    });
  },

  // Route generation
  generateRoute(data: {
    waypoints: Array<{ lat: number; lng: number }>;
    activity_type?: string;
    name: string;
    description?: string;
    difficulty?: string;
    tags?: string[];
    is_public?: boolean;
  }): Promise<GeneratedRouteResponse> {
    return client.request('/api/explore/routes/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ============================================================================
  // Heatmaps
  // ============================================================================

  getHeatmap(
    lat: number,
    lng: number,
    radius?: number,
    type?: string,
  ): Promise<{
    success: boolean;
    heatmap: HeatmapDataPoint[];
  }> {
    const query = new URLSearchParams();
    query.set('lat', String(lat));
    query.set('lng', String(lng));
    if (radius) query.set('radius', String(radius));
    if (type) query.set('type', type);
    return client.request(`/api/explore/heatmap?${query.toString()}`);
  },

  getPopularLocations(
    type?: string,
    limit?: number,
  ): Promise<{
    success: boolean;
    locations: Array<{ lat: number; lng: number; intensity: number; activity_type: string }>;
  }> {
    const query = new URLSearchParams();
    if (type) query.set('type', type);
    if (limit) query.set('limit', String(limit));
    return client.request(`/api/explore/heatmap/popular?${query.toString()}`);
  },

  // ============================================================================
  // Community Traces
  // ============================================================================

  getCommunityTraces(
    type?: string,
    limit?: number,
  ): Promise<{
    success: boolean;
    traces: CommunityTrace[];
    total: number;
  }> {
    const query = new URLSearchParams();
    if (type) query.set('type', type);
    if (limit) query.set('limit', String(limit));
    return client.request(`/api/explore/community/traces?${query.toString()}`);
  },

  // ============================================================================
  // Elevation
  // ============================================================================

  getElevationProfile(locations: Array<{ lat: number; lng: number }>): Promise<{
    success: boolean;
    profile: ElevationPoint[];
    stats: ElevationStats;
  }> {
    return client.request('/api/explore/elevation', {
      method: 'POST',
      body: JSON.stringify({ locations }),
    });
  },
};
