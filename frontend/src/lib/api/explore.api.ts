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
} from './types';
import { client } from './client';

export const exploreApi = {
  // ============================================================================
  // Segments
  // ============================================================================

  createSegment(data: CreateSegmentParams): Promise<{ 
    success: boolean; 
    segment_id?: number; 
    error?: string 
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
    type?: string
  ): Promise<{
    success: boolean;
    segments: Array<{
      id: number;
      name: string;
      distance: number;
      elevation_gain: number;
      activity_type: string;
      effort_count: number;
    }>;
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
    segments: Array<unknown>;
  }> {
    return client.request('/api/explore/segments');
  },

  getSegment(segmentId: number): Promise<{
    success: boolean;
    segment: {
      id: number;
      name: string;
      description?: string;
      distance: number;
      elevation_gain: number;
      elevation_loss: number;
      avg_grade: number;
      max_grade: number;
      activity_type: string;
      polyline?: string;
      creator_name?: string;
      total_efforts: number;
      unique_athletes: number;
      start_lat?: number;
      start_lng?: number;
      end_lat?: number;
      end_lng?: number;
    };
  }> {
    return client.request(`/api/explore/segments/${segmentId}`);
  },

  getSegmentLeaderboard(segmentId: number): Promise<{
    success: boolean;
    leaderboard: Array<{
      id: number;
      user_id: number;
      user_name: string;
      elapsed_time: number;
      rank: number;
      is_kom: boolean;
      is_qom: boolean;
    }>;
  }> {
    return client.request(`/api/explore/segments/${segmentId}/leaderboard`);
  },

  createSegmentEffort(params: CreateSegmentEffortParams): Promise<{ 
    success: boolean; 
    effort_id?: number; 
    is_pr?: boolean; 
    error?: string 
  }> {
    return client.request(`/api/explore/segments/${params.segmentId}/efforts`, {
      method: 'POST',
      body: JSON.stringify(params.data),
    });
  },

  getMySegmentEfforts(segmentId: number): Promise<{
    success: boolean;
    efforts: Array<unknown>;
  }> {
    return client.request(`/api/explore/segments/${segmentId}/efforts/me`);
  },

  // ============================================================================
  // Routes
  // ============================================================================

  createRoute(data: CreateRouteParams): Promise<{ 
    success: boolean; 
    route_id?: number; 
    error?: string 
  }> {
    return client.request('/api/explore/routes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getPublicRoutes(type?: string, difficulty?: string): Promise<{
    success: boolean;
    routes: Array<unknown>;
  }> {
    const query = new URLSearchParams();
    if (type) query.set('type', type);
    if (difficulty) query.set('difficulty', difficulty);
    return client.request(`/api/explore/routes?${query.toString()}`);
  },

  getRoute(routeId: number): Promise<{
    success: boolean;
    route: {
      id: number;
      name: string;
      description?: string;
      distance: number;
      elevation_gain: number;
      elevation_loss: number;
      activity_type: string;
      estimated_duration?: number;
      difficulty?: string;
      tags?: string[];
      avg_rating?: number;
      rating_count: number;
      usage_count: number;
      polyline: string;
      creator_name?: string;
      is_favorited?: boolean;
    };
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
    routes: Array<unknown>;
  }> {
    return client.request('/api/explore/routes/my');
  },

  getFavoriteRoutes(): Promise<{
    success: boolean;
    routes: Array<unknown>;
  }> {
    return client.request('/api/explore/routes/favorites');
  },

  // ============================================================================
  // Heatmaps
  // ============================================================================

  getHeatmap(
    lat: number,
    lng: number,
    radius?: number,
    type?: string
  ): Promise<{
    success: boolean;
    heatmap: Array<{ lat: number; lng: number; intensity: number }>;
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
    limit?: number
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
    limit?: number
  ): Promise<{
    success: boolean;
    traces: Array<{
      id: number;
      polyline: string;
      distance: number;
      activity_type: string;
      difficulty?: string;
      elevation_gain?: number;
    }>;
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

  getElevationProfile(
    locations: Array<{ lat: number; lng: number }>
  ): Promise<{
    success: boolean;
    profile: Array<{ distance: number; elevation: number; lat: number; lng: number }>;
    stats: {
      total_gain: number;
      max_elevation: number;
      min_elevation: number;
    };
  }> {
    return client.request('/api/explore/elevation', {
      method: 'POST',
      body: JSON.stringify({ locations }),
    });
  },
};
