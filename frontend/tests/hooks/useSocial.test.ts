/**
 * ============================================================
 * USE SOCIAL HOOK TESTS
 * ============================================================
 * Tests unitaires pour le hook useSocial.ts
 *
 * @module tests/hooks/useSocial
 */

import { renderHook, act } from '@testing-library/react';
import { useFriends, useGroups, useLeaderboard, useFeed, useChallenges, formatPace, getSportGradient } from '@/hooks/useSocial';
import { SOCIAL_ERRORS } from '@/constants/social';

// Mock de l'API
const mockApi = vi.hoisted(() => ({
  getFriends: vi.fn(),
  getPendingFriendRequests: vi.fn(),
  searchUsers: vi.fn(),
  sendFriendRequest: vi.fn(),
  acceptFriendRequest: vi.fn(),
  removeFriend: vi.fn(),
  getGroups: vi.fn(),
  getPublicGroups: vi.fn(),
  leaveGroup: vi.fn(),
  getLeaderboard: vi.fn(),
  getSocialFeed: vi.fn(),
  likeActivity: vi.fn(),
  unlikeActivity: vi.fn(),
  getPublicChallenges: vi.fn(),
  getUserChallenges: vi.fn(),
  joinChallenge: vi.fn(),
}));

// Mock des modules
vi.mock('@/lib/api', () => ({
  api: mockApi,
}));

// Mock de toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('useSocial hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useFriends', () => {
    it('should initialize with loading state', () => {
      mockApi.getFriends.mockResolvedValue([]);
      mockApi.getPendingFriendRequests.mockResolvedValue([]);

      const { result } = renderHook(() => useFriends());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.friends).toEqual([]);
      expect(result.current.requests).toEqual([]);
    });

    it('should load friends and requests on mount', async () => {
      const mockFriends = [{ id: 1, name: 'Friend 1', email: 'friend1@test.com' }];
      const mockRequests = [{ userId: 2, name: 'Request 1', email: 'request1@test.com' }];

      mockApi.getFriends.mockResolvedValue(mockFriends);
      mockApi.getPendingFriendRequests.mockResolvedValue(mockRequests);

      const { result } = renderHook(() => useFriends());

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.friends).toEqual(mockFriends);
      expect(result.current.requests).toEqual(mockRequests);
      expect(mockApi.getFriends).toHaveBeenCalledTimes(1);
      expect(mockApi.getPendingFriendRequests).toHaveBeenCalledTimes(1);
    });

    it('should handle search with debounce', async () => {
      const mockResults = [{ id: 1, name: 'Search Result', email: 'result@test.com' }];
      mockApi.searchUsers.mockResolvedValue(mockResults);

      const { result } = renderHook(() => useFriends());

      // Wait for initial load
      await new Promise(resolve => setTimeout(resolve, 100));

      // Trigger search
      await act(async () => {
        await result.current.handleSearch('test');
      });

      expect(mockApi.searchUsers).toHaveBeenCalledWith('test');
      expect(result.current.searchResults).toEqual(mockResults);
    });

    it('should handle add friend', async () => {
      mockApi.sendFriendRequest.mockResolvedValue({});

      const { result } = renderHook(() => useFriends());

      await new Promise(resolve => setTimeout(resolve, 100));

      // Add initial search results
      act(() => {
        result.current.setSearchQuery('test');
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 350));
      });

      const initialResults = result.current.searchResults;

      // Add friend
      await act(async () => {
        await result.current.handleAddFriend(1);
      });

      expect(mockApi.sendFriendRequest).toHaveBeenCalledWith(1);
      expect(result.current.searchResults).toEqual(initialResults.filter(u => u.id !== 1));
    });

    it('should handle accept friend request', async () => {
      mockApi.acceptFriendRequest.mockResolvedValue({});

      const { result } = renderHook(() => useFriends());

      await new Promise(resolve => setTimeout(resolve, 100));

      await act(async () => {
        await result.current.handleAccept(1);
      });

      expect(mockApi.acceptFriendRequest).toHaveBeenCalledWith(1);
      expect(mockApi.getFriends).toHaveBeenCalledTimes(2); // Initial + reload
    });

    it('should handle remove friend', async () => {
      mockApi.removeFriend.mockResolvedValue({});

      const { result } = renderHook(() => useFriends());

      await new Promise(resolve => setTimeout(resolve, 100));

      await act(async () => {
        await result.current.handleRemove(1);
      });

      expect(mockApi.removeFriend).toHaveBeenCalledWith(1);
      expect(mockApi.getFriends).toHaveBeenCalledTimes(2); // Initial + reload
    });

    it('should handle errors', async () => {
      mockApi.getFriends.mockRejectedValue(new Error('Failed'));
      mockApi.getPendingFriendRequests.mockRejectedValue(new Error('Failed'));

      const { result } = renderHook(() => useFriends());

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.error).toBe(SOCIAL_ERRORS.FETCH_FRIENDS);
      expect(result.current.friends).toEqual([]);
      expect(result.current.requests).toEqual([]);
    });
  });

  describe('useGroups', () => {
    it('should initialize with loading state', () => {
      mockApi.getGroups.mockResolvedValue([]);
      mockApi.getPublicGroups.mockResolvedValue([]);

      const { result } = renderHook(() => useGroups());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.groups).toEqual([]);
      expect(result.current.publicGroups).toEqual([]);
    });

    it('should load groups on mount', async () => {
      const mockGroups = [{ id: 1, name: 'Group 1', member_count: 5 }];
      const mockPublicGroups = [{ id: 2, name: 'Public Group 1', member_count: 10 }];

      mockApi.getGroups.mockResolvedValue(mockGroups);
      mockApi.getPublicGroups.mockResolvedValue(mockPublicGroups);

      const { result } = renderHook(() => useGroups());

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.groups).toEqual(mockGroups);
      expect(result.current.publicGroups).toEqual(mockPublicGroups);
    });

    it('should handle leave group', async () => {
      mockApi.leaveGroup.mockResolvedValue({});

      const { result } = renderHook(() => useGroups());

      await new Promise(resolve => setTimeout(resolve, 100));

      await act(async () => {
        await result.current.handleLeave(1);
      });

      expect(mockApi.leaveGroup).toHaveBeenCalledWith(1);
      expect(mockApi.getGroups).toHaveBeenCalledTimes(2); // Initial + reload
    });

    it('should handle search', async () => {
      const mockResults = [{ id: 1, name: 'Public Group', member_count: 5 }];
      mockApi.getPublicGroups.mockResolvedValue(mockResults);

      const { result } = renderHook(() => useGroups());

      await new Promise(resolve => setTimeout(resolve, 100));

      await act(async () => {
        await result.current.handleSearch('test');
      });

      expect(mockApi.getPublicGroups).toHaveBeenCalledWith('test');
      expect(result.current.publicGroups).toEqual(mockResults);
    });
  });

  describe('useLeaderboard', () => {
    it('should initialize with loading state', () => {
      mockApi.getLeaderboard.mockResolvedValue([]);

      const { result } = renderHook(() => useLeaderboard());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.entries).toEqual([]);
    });

    it('should load leaderboard with default category and period', async () => {
      const mockEntries = [
        { rank: 1, userId: 1, name: 'User 1', value: 100 },
        { rank: 2, userId: 2, name: 'User 2', value: 90 },
      ];

      mockApi.getLeaderboard.mockResolvedValue(mockEntries);

      const { result } = renderHook(() => useLeaderboard());

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.entries).toEqual(mockEntries);
      expect(result.current.category).toBe('distance');
      expect(result.current.period).toBe('week');
      expect(mockApi.getLeaderboard).toHaveBeenCalledWith({ category: 'distance', period: 'week' });
    });

    it('should reload when category changes', async () => {
      const mockEntries = [{ rank: 1, userId: 1, name: 'User 1', value: 100 }];

      mockApi.getLeaderboard.mockResolvedValue(mockEntries);

      const { result, waitForNextUpdate: _waitForNextUpdate, rerender: _rerender } = renderHook(() => useLeaderboard());

      await new Promise(resolve => setTimeout(resolve, 100));

      act(() => {
        result.current.setCategory('duration');
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockApi.getLeaderboard).toHaveBeenCalledWith({ category: 'duration', period: 'week' });
    });

    it('should reload when period changes', async () => {
      const mockEntries = [{ rank: 1, userId: 1, name: 'User 1', value: 100 }];

      mockApi.getLeaderboard.mockResolvedValue(mockEntries);

      const { result } = renderHook(() => useLeaderboard());

      await new Promise(resolve => setTimeout(resolve, 100));

      act(() => {
        result.current.setPeriod('month');
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockApi.getLeaderboard).toHaveBeenCalledWith({ category: 'distance', period: 'month' });
    });
  });

  describe('useFeed', () => {
    it('should initialize with loading state', () => {
      mockApi.getSocialFeed.mockResolvedValue([]);

      const { result } = renderHook(() => useFeed());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.activities).toEqual([]);
    });

    it('should load feed on mount', async () => {
      const mockActivities = [
        { id: 1, type: 'Running', name: 'Morning Run', owner_name: 'User 1' },
        { id: 2, type: 'Cycling', name: 'Afternoon Ride', owner_name: 'User 2' },
      ];

      mockApi.getSocialFeed.mockResolvedValue(mockActivities);

      const { result } = renderHook(() => useFeed());

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.activities).toEqual(mockActivities);
    });

    it('should handle like activity', async () => {
      const mockActivities = [{ id: 1, type: 'Running', name: 'Run', owner_name: 'User', like_count: 0, user_liked: false }];

      mockApi.getSocialFeed.mockResolvedValue(mockActivities);
      mockApi.likeActivity.mockResolvedValue({});

      const { result } = renderHook(() => useFeed());

      await new Promise(resolve => setTimeout(resolve, 100));

      await act(async () => {
        await result.current.handleLike(1, false);
      });

      expect(mockApi.likeActivity).toHaveBeenCalledWith(1);
      expect(result.current.activities[0].user_liked).toBe(true);
      expect(result.current.activities[0].like_count).toBe(1);
    });

    it('should handle unlike activity', async () => {
      const mockActivities = [{ id: 1, type: 'Running', name: 'Run', owner_name: 'User', like_count: 1, user_liked: true }];

      mockApi.getSocialFeed.mockResolvedValue(mockActivities);
      mockApi.unlikeActivity.mockResolvedValue({});

      const { result } = renderHook(() => useFeed());

      await new Promise(resolve => setTimeout(resolve, 100));

      await act(async () => {
        await result.current.handleLike(1, true);
      });

      expect(mockApi.unlikeActivity).toHaveBeenCalledWith(1);
      expect(result.current.activities[0].user_liked).toBe(false);
      expect(result.current.activities[0].like_count).toBe(0);
    });

    it('should handle refresh', async () => {
      const mockActivities = [{ id: 1, type: 'Running', name: 'Run', owner_name: 'User' }];

      mockApi.getSocialFeed.mockResolvedValue(mockActivities);

      const { result } = renderHook(() => useFeed());

      await new Promise(resolve => setTimeout(resolve, 100));

      act(() => {
        result.current.loadFeed(true);
      });

      expect(result.current.isRefreshing).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.isRefreshing).toBe(false);
      expect(mockApi.getSocialFeed).toHaveBeenCalledTimes(2);
    });
  });

  describe('useChallenges', () => {
    it('should initialize with loading state', () => {
      mockApi.getPublicChallenges.mockResolvedValue([]);
      mockApi.getUserChallenges.mockResolvedValue([]);

      const { result } = renderHook(() => useChallenges());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.publicChallenges).toEqual([]);
      expect(result.current.myChallenges).toEqual([]);
    });

    it('should load challenges on mount', async () => {
      const mockPublicChallenges = [{ id: 1, title: 'Public Challenge', participant_count: 10 }];
      const mockMyChallenges = [{ id: 2, title: 'My Challenge', progress: 50 }];

      mockApi.getPublicChallenges.mockResolvedValue(mockPublicChallenges);
      mockApi.getUserChallenges.mockResolvedValue(mockMyChallenges);

      const { result } = renderHook(() => useChallenges());

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.publicChallenges).toEqual(mockPublicChallenges);
      expect(result.current.myChallenges).toEqual(mockMyChallenges);
    });

    it('should handle join challenge', async () => {
      mockApi.joinChallenge.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useChallenges());

      await new Promise(resolve => setTimeout(resolve, 100));

      await act(async () => {
        await result.current.handleJoin(1);
      });

      expect(mockApi.joinChallenge).toHaveBeenCalledWith(1);
      expect(mockApi.getPublicChallenges).toHaveBeenCalledTimes(2); // Initial + reload
    });

    it('should handle join challenge error', async () => {
      mockApi.joinChallenge.mockResolvedValue({ success: false, error: 'Error' });

      const { result } = renderHook(() => useChallenges());

      await new Promise(resolve => setTimeout(resolve, 100));

      await act(async () => {
        await result.current.handleJoin(1);
      });

      expect(result.current.error).toBe('Error');
    });
  });
});

describe('Utility functions', () => {
  describe('formatPace', () => {
    it('should return "--" for invalid speed', () => {

      expect(formatPace(0)).toBe('--');
      expect(formatPace(-1)).toBe('--');
      expect(formatPace(NaN)).toBe('--');
    });

    it('should format pace correctly', () => {

      // 5 m/s = 3:20/km (1000/(5*60) = 3.333... min/km)
      expect(formatPace(5)).toBe('3:20');
      // 3.333 m/s = 5:00/km (1000/(3.333*60) = 5 min/km)
      expect(formatPace(3.333)).toBe('5:00');
    });
  });

  describe('getSportGradient', () => {
    it('should return gradient for known sports', () => {

      expect(getSportGradient('Running')).toBe('from-orange-500 to-red-500');
      expect(getSportGradient('Cycling')).toBe('from-blue-500 to-cyan-500');
      expect(getSportGradient('Swimming')).toBe('from-cyan-500 to-blue-400');
    });

    it('should return default gradient for unknown sports', () => {

      expect(getSportGradient('Unknown')).toBe('from-primary to-blue-500');
    });
  });
});
