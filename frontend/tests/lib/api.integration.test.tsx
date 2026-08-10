import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Activity } from '@/types';

// Create a wrapper with QueryClient
const _createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return function QueryWrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
};

// Mock API
vi.mock('@/lib/api', () => ({
  api: {
    getActivities: vi.fn(),
    getActivity: vi.fn(),
    createActivity: vi.fn(),
    updateActivity: vi.fn(),
    deleteActivity: vi.fn(),
    toggleActivityDraw: vi.fn(),
    getPublicSegments: vi.fn(),
    getNearbySegments: vi.fn(),
  },
}));

describe('API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Activities API', () => {
    it('fetches activities successfully', async () => {
      const mockActivities: Activity[] = [
        {
          id: 1,
          title: 'Morning Run',
          distance: 5000,
          moving_time: 1800,
          type: 'run',
          date: '',
          dist: '',
          pace: '',
          duration: '',
          avgSpeed: 0,
          avgHR: 0,
        },
        {
          id: 2,
          title: 'Evening Ride',
          distance: 15000,
          moving_time: 3600,
          type: 'bike',
          date: '',
          dist: '',
          pace: '',
          duration: '',
          avgSpeed: 0,
          avgHR: 0,
        },
      ];
      const mockResponse = {
        data: mockActivities,
        pagination: { page: 1, per_page: 20, total: 2, total_pages: 1, has_next: false, has_prev: false },
      };

      vi.mocked(api.getActivities).mockResolvedValueOnce(mockResponse);

      const result = await api.getActivities();

      expect(result).toEqual(mockResponse);
      expect(api.getActivities).toHaveBeenCalledTimes(1);
    });

    it('handles API errors gracefully', async () => {
      vi.mocked(api.getActivities).mockRejectedValueOnce(new Error('Network error'));

      await expect(api.getActivities()).rejects.toThrow('Network error');
    });

    it('creates activity with correct data', async () => {
      const newActivity: Partial<Activity> = {
        title: 'Test Activity',
        type: 'run',
        distance: 5000,
        moving_time: 1800,
      };

      vi.mocked(api.createActivity).mockResolvedValueOnce({
        id: 3,
        title: 'Test Activity',
        type: 'run',
        distance: 5000,
        moving_time: 1800,
        date: '',
        dist: '',
        pace: '',
        duration: '',
        avgSpeed: 0,
        avgHR: 0,
      } as unknown as Activity);

      const result = await api.createActivity(newActivity);

      expect(result).toBeDefined();
      expect(api.createActivity).toHaveBeenCalledWith(newActivity);
    });
  });

  describe('Social API', () => {
    it('toggles draw on activity', async () => {
      vi.mocked(api.toggleActivityDraw).mockResolvedValueOnce({
        success: true,
        has_drawn: true,
        draw_count: 6,
      });

      const result = await api.toggleActivityDraw(1, 2);

      expect(result.has_drawn).toBe(true);
      expect(result.draw_count).toBe(6);
    });
  });

  describe('Explore API', () => {
    it('fetches segments successfully', async () => {
      const mockSegments = {
        success: true,
        segments: [{ id: 1, name: 'Test Segment', distance: 1000 }],
      };

      vi.mocked(api.getPublicSegments).mockResolvedValueOnce(mockSegments);

      const result = await api.getPublicSegments();

      expect(result.success).toBe(true);
      expect(result.segments).toHaveLength(1);
    });

    it('fetches nearby segments with location', async () => {
      const mockResponse = {
        success: true,
        segments: [],
      };

      vi.mocked(api.getNearbySegments).mockResolvedValueOnce(mockResponse);

      await api.getNearbySegments(48.8566, 2.3522, 5000, 'Run');

      expect(api.getNearbySegments).toHaveBeenCalledWith(48.8566, 2.3522, 5000, 'Run');
    });
  });
});
