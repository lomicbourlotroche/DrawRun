/**
 * ============================================================
 * USE GROUP DETAIL HOOK TESTS
 * ============================================================
 * Tests unitaires pour le hook useGroupDetail.ts
 * 
 * @module tests/hooks/useGroupDetail
 */

import { renderHook, act } from '@testing-library/react';
import { useGroupDetail } from '@/hooks/useGroupDetail';
import { SOCIAL_ERRORS } from '@/constants/social';

// Mock de useParams et useRouter
const mockUseParams = jest.fn();
const mockUseRouter = jest.fn();

jest.mock('next/navigation', () => ({
  useParams: () => mockUseParams(),
  useRouter: () => mockUseRouter(),
}));

// Mock de l'API
const mockApi = {
  getGroupDetail: jest.fn(),
  getGroupMembers: jest.fn(),
  getGroupActivities: jest.fn(),
  getGroupChallenges: jest.fn(),
  editGroup: jest.fn(),
  deleteGroup: jest.fn(),
  kickMember: jest.fn(),
  promoteMember: jest.fn(),
  leaveGroup: jest.fn(),
  createGroupChallenge: jest.fn(),
  joinChallenge: jest.fn(),
};

jest.mock('@/lib/api', () => ({
  api: mockApi,
}));

// Mock de toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

// Mock de navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

describe('useGroupDetail hook', () => {
  const mockGroupId = 123;
  const mockGroup = {
    id: mockGroupId,
    name: 'Test Group',
    description: 'Test Description',
    isPrivate: true,
    memberCount: 5,
    adminCount: 1,
    userRole: 'admin',
    inviteCode: 'TEST1234',
  };
  const mockMembers = [
    { id: 1, userId: 1, name: 'Member 1', email: 'member1@test.com', role: 'member', joinedAt: '2024-01-01' },
    { id: 2, userId: 2, name: 'Member 2', email: 'member2@test.com', role: 'admin', joinedAt: '2024-01-02' },
  ];
  const mockActivities = [
    { id: 1, type: 'Running', name: 'Morning Run', start_date: '2024-01-01', distance: 10000, moving_time: 3600 },
    { id: 2, type: 'Cycling', name: 'Afternoon Ride', start_date: '2024-01-02', distance: 20000, moving_time: 7200 },
  ];
  const mockChallenges = [
    { id: 1, title: 'Test Challenge', type: 'distance', target_value: 100, duration_days: 30, participant_count: 5 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ id: String(mockGroupId) });
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
    });
  });

  it('should initialize with loading state', () => {
    mockApi.getGroupDetail.mockResolvedValue(mockGroup);
    mockApi.getGroupMembers.mockResolvedValue(mockMembers);
    mockApi.getGroupActivities.mockResolvedValue(mockActivities);
    mockApi.getGroupChallenges.mockResolvedValue(mockChallenges);

    const { result } = renderHook(() => useGroupDetail());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.group).toBeNull();
    expect(result.current.members).toEqual([]);
    expect(result.current.activities).toEqual([]);
    expect(result.current.challenges).toEqual([]);
  });

  it('should load group data on mount', async () => {
    mockApi.getGroupDetail.mockResolvedValue(mockGroup);
    mockApi.getGroupMembers.mockResolvedValue(mockMembers);
    mockApi.getGroupActivities.mockResolvedValue(mockActivities);
    mockApi.getGroupChallenges.mockResolvedValue(mockChallenges);

    const { result, waitForNextUpdate } = renderHook(() => useGroupDetail());

    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.group).toEqual(mockGroup);
    expect(result.current.members).toEqual(mockMembers);
    expect(result.current.activities).toEqual(mockActivities);
    expect(result.current.challenges).toEqual(mockChallenges);
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.editForm).toEqual({
      name: mockGroup.name,
      description: mockGroup.description,
      isPrivate: mockGroup.isPrivate,
    });
  });

  it('should handle errors on load', async () => {
    mockApi.getGroupDetail.mockRejectedValue(new Error('Failed'));

    const mockPush = jest.fn();
    mockUseRouter.mockReturnValue({ push: mockPush });

    const { result, waitForNextUpdate } = renderHook(() => useGroupDetail());

    await waitForNextUpdate();

    expect(result.current.error).toBe(SOCIAL_ERRORS.FETCH_GROUPS);
    expect(mockPush).toHaveBeenCalledWith('/app/social');
  });

  it('should handle edit group', async () => {
    mockApi.getGroupDetail.mockResolvedValue(mockGroup);
    mockApi.getGroupMembers.mockResolvedValue(mockMembers);
    mockApi.getGroupActivities.mockResolvedValue(mockActivities);
    mockApi.getGroupChallenges.mockResolvedValue(mockChallenges);
    mockApi.editGroup.mockResolvedValue({});

    const { result, waitForNextUpdate } = renderHook(() => useGroupDetail());

    await waitForNextUpdate();

    // Update edit form
    act(() => {
      result.current.setEditForm({
        name: 'Updated Name',
        description: 'Updated Description',
        isPrivate: false,
      });
    });

    await act(async () => {
      await result.current.handleEdit();
    });

    expect(mockApi.editGroup).toHaveBeenCalledWith(mockGroupId, {
      name: 'Updated Name',
      description: 'Updated Description',
      isPrivate: false,
    });
  });

  it('should handle delete group with confirmation', async () => {
    mockApi.getGroupDetail.mockResolvedValue(mockGroup);
    mockApi.getGroupMembers.mockResolvedValue(mockMembers);
    mockApi.getGroupActivities.mockResolvedValue(mockActivities);
    mockApi.getGroupChallenges.mockResolvedValue(mockChallenges);
    mockApi.deleteGroup.mockResolvedValue({});

    // Mock window.confirm
    Object.defineProperty(window, 'confirm', {
      writable: true,
      value: jest.fn().mockReturnValue(true),
    });

    const mockPush = jest.fn();
    mockUseRouter.mockReturnValue({ push: mockPush });

    const { result, waitForNextUpdate } = renderHook(() => useGroupDetail());

    await waitForNextUpdate();

    await act(async () => {
      await result.current.handleDelete();
    });

    expect(window.confirm).toHaveBeenCalledWith('Supprimer ce groupe ? Action irréversible.');
    expect(mockApi.deleteGroup).toHaveBeenCalledWith(mockGroupId);
    expect(mockPush).toHaveBeenCalledWith('/app/social');
  });

  it('should not delete group without confirmation', async () => {
    mockApi.getGroupDetail.mockResolvedValue(mockGroup);
    mockApi.getGroupMembers.mockResolvedValue(mockMembers);
    mockApi.getGroupActivities.mockResolvedValue(mockActivities);
    mockApi.getGroupChallenges.mockResolvedValue(mockChallenges);

    // Mock window.confirm to return false
    Object.defineProperty(window, 'confirm', {
      writable: true,
      value: jest.fn().mockReturnValue(false),
    });

    const { result, waitForNextUpdate } = renderHook(() => useGroupDetail());

    await waitForNextUpdate();

    await act(async () => {
      await result.current.handleDelete();
    });

    expect(window.confirm).toHaveBeenCalledWith('Supprimer ce groupe ? Action irréversible.');
    expect(mockApi.deleteGroup).not.toHaveBeenCalled();
  });

  it('should handle kick member with confirmation', async () => {
    mockApi.getGroupDetail.mockResolvedValue(mockGroup);
    mockApi.getGroupMembers.mockResolvedValue(mockMembers);
    mockApi.getGroupActivities.mockResolvedValue(mockActivities);
    mockApi.getGroupChallenges.mockResolvedValue(mockChallenges);
    mockApi.kickMember.mockResolvedValue({});

    // Mock window.confirm
    Object.defineProperty(window, 'confirm', {
      writable: true,
      value: jest.fn().mockReturnValue(true),
    });

    const { result, waitForNextUpdate } = renderHook(() => useGroupDetail());

    await waitForNextUpdate();

    await act(async () => {
      await result.current.handleKick(1);
    });

    expect(window.confirm).toHaveBeenCalledWith('Exclure ce membre ?');
    expect(mockApi.kickMember).toHaveBeenCalledWith(mockGroupId, 1);
  });

  it('should handle promote member', async () => {
    mockApi.getGroupDetail.mockResolvedValue(mockGroup);
    mockApi.getGroupMembers.mockResolvedValue(mockMembers);
    mockApi.getGroupActivities.mockResolvedValue(mockActivities);
    mockApi.getGroupChallenges.mockResolvedValue(mockChallenges);
    mockApi.promoteMember.mockResolvedValue({});

    const { result, waitForNextUpdate } = renderHook(() => useGroupDetail());

    await waitForNextUpdate();

    await act(async () => {
      await result.current.handlePromote(1, 'moderator');
    });

    expect(mockApi.promoteMember).toHaveBeenCalledWith(mockGroupId, 1, 'moderator');
  });

  it('should handle leave group with confirmation', async () => {
    const nonAdminGroup = { ...mockGroup, userRole: 'member' };
    mockApi.getGroupDetail.mockResolvedValue(nonAdminGroup);
    mockApi.getGroupMembers.mockResolvedValue(mockMembers);
    mockApi.getGroupActivities.mockResolvedValue(mockActivities);
    mockApi.getGroupChallenges.mockResolvedValue(mockChallenges);
    mockApi.leaveGroup.mockResolvedValue({});

    // Mock window.confirm
    Object.defineProperty(window, 'confirm', {
      writable: true,
      value: jest.fn().mockReturnValue(true),
    });

    const mockPush = jest.fn();
    mockUseRouter.mockReturnValue({ push: mockPush });

    const { result, waitForNextUpdate } = renderHook(() => useGroupDetail());

    await waitForNextUpdate();

    expect(result.current.isAdmin).toBe(false);

    await act(async () => {
      await result.current.handleLeave();
    });

    expect(window.confirm).toHaveBeenCalledWith('Quitter ce groupe ?');
    expect(mockApi.leaveGroup).toHaveBeenCalledWith(mockGroupId);
    expect(mockPush).toHaveBeenCalledWith('/app/social');
  });

  it('should handle copy invite code', async () => {
    mockApi.getGroupDetail.mockResolvedValue(mockGroup);
    mockApi.getGroupMembers.mockResolvedValue(mockMembers);
    mockApi.getGroupActivities.mockResolvedValue(mockActivities);
    mockApi.getGroupChallenges.mockResolvedValue(mockChallenges);

    const { result, waitForNextUpdate } = renderHook(() => useGroupDetail());

    await waitForNextUpdate();

    act(() => {
      result.current.copyInvite();
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('TEST1234');
  });

  it('should handle create group challenge', async () => {
    mockApi.getGroupDetail.mockResolvedValue(mockGroup);
    mockApi.getGroupMembers.mockResolvedValue(mockMembers);
    mockApi.getGroupActivities.mockResolvedValue(mockActivities);
    mockApi.getGroupChallenges.mockResolvedValue(mockChallenges);
    mockApi.createGroupChallenge.mockResolvedValue({});

    const { result, waitForNextUpdate } = renderHook(() => useGroupDetail());

    await waitForNextUpdate();

    const form = {
      title: 'New Challenge',
      description: 'Description',
      type: 'distance',
      target_value: '100',
      end_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      challenge_mode: 'quota',
      weekly_target: '',
      weekly_increase_pct: '10',
      streak_days: '',
      frequency_per_week: '3',
      sport_type: 'any',
      badge_icon: '🏆',
      is_public: false,
    };

    await act(async () => {
      await result.current.handleCreateChallenge(form);
    });

    expect(mockApi.createGroupChallenge).toHaveBeenCalledWith(mockGroupId, expect.objectContaining({
      title: form.title,
      description: form.description,
      type: form.type,
    }));
  });

  it('should handle join challenge', async () => {
    mockApi.getGroupDetail.mockResolvedValue(mockGroup);
    mockApi.getGroupMembers.mockResolvedValue(mockMembers);
    mockApi.getGroupActivities.mockResolvedValue(mockActivities);
    mockApi.getGroupChallenges.mockResolvedValue(mockChallenges);
    mockApi.joinChallenge.mockResolvedValue({});

    const { result, waitForNextUpdate } = renderHook(() => useGroupDetail());

    await waitForNextUpdate();

    await act(async () => {
      await result.current.handleJoinChallenge(1);
    });

    expect(mockApi.joinChallenge).toHaveBeenCalledWith(1);
  });

  it('should show wizard state', () => {
    mockApi.getGroupDetail.mockResolvedValue(mockGroup);
    mockApi.getGroupMembers.mockResolvedValue(mockMembers);
    mockApi.getGroupActivities.mockResolvedValue(mockActivities);
    mockApi.getGroupChallenges.mockResolvedValue(mockChallenges);

    const { result, waitForNextUpdate } = renderHook(() => useGroupDetail());

    expect(result.current.showWizard).toBe(false);

    act(() => {
      result.current.setShowWizard(true);
    });

    expect(result.current.showWizard).toBe(true);
  });
});
