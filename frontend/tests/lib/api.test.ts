import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { api, ApiError } from '@/lib/api';
import { API_BASE_URL } from '@/lib/constants';

// Mock the @/stores module to avoid circular dependency issues in tests
vi.mock('@/stores', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      logout: vi.fn(),
    })),
  },
}));

describe('API Client', () => {
  // Real sessionStorage/localStorage behavior for these tests
  let sessionStorageData: Record<string, string> = {};
  let localStorageData: Record<string, string> = {};

  beforeEach(() => {
    vi.resetAllMocks();
    sessionStorageData = {};
    localStorageData = {};

    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn((key: string) => sessionStorageData[key] ?? null),
        setItem: vi.fn((key: string, value: string) => { sessionStorageData[key] = value; }),
        removeItem: vi.fn((key: string) => { delete sessionStorageData[key]; }),
        clear: vi.fn(() => { sessionStorageData = {}; }),
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => localStorageData[key] ?? null),
        setItem: vi.fn((key: string, value: string) => { localStorageData[key] = value; }),
        removeItem: vi.fn((key: string) => { delete localStorageData[key]; }),
        clear: vi.fn(() => { localStorageData = {}; }),
      },
      writable: true,
      configurable: true,
    });

    api.setToken(null); // clears token and refresh token
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Token Management', () => {
    it('should set and get token', () => {
      const token = 'test-token-123';
      api.setToken(token);
      expect(api.getToken()).toBe(token);
      expect(api.isAuthenticated()).toBe(true);
    });

    it('should clear token', () => {
      api.setToken('test-token');
      api.setToken(null);
      expect(api.getToken()).toBeNull();
      expect(api.isAuthenticated()).toBe(false);
    });

    it('should return false for isAuthenticated when no token', () => {
      expect(api.isAuthenticated()).toBe(false);
    });
  });

  describe('Refresh Token Management', () => {
    it('should set and get refresh token', () => {
      api.setRefreshToken('my-refresh-token');
      expect(api.getRefreshToken()).toBe('my-refresh-token');
    });

    it('should clear refresh token when setToken(null) is called', () => {
      api.setRefreshToken('my-refresh-token');
      api.setToken(null);
      expect(api.getRefreshToken()).toBeNull();
    });

    it('should clear refresh token when setRefreshToken(null) is called', () => {
      api.setRefreshToken('my-refresh-token');
      api.setRefreshToken(null);
      expect(api.getRefreshToken()).toBeNull();
    });
  });

  describe('Request Handling', () => {
    it('should make GET request with correct headers', async () => {
      const mockData = { status: 'ok', version: '1.0.0' };
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      } as Response);

      const result = await api.healthCheck();

      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/health`,
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual(mockData);
    });

    it('should include Authorization header when token is set', async () => {
      const token = 'auth-token-123';
      api.setToken(token);

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      } as Response);

      try {
        await api.getActivities();
      } catch (e) {
        // Expected to fail since we're mocking
      }

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${token}`,
          }),
        })
      );
    });

    it('should throw ApiError on 401 response for auth endpoints', async () => {
      // For /api/auth/login, 401 should throw directly without refresh
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      } as Response);

      await expect(api.login('bad@example.com', 'wrong')).rejects.toThrow(ApiError);
    });

    it('should throw ApiError on 500 response', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      } as Response);

      await expect(api.getActivities()).rejects.toThrow(ApiError);
    });

    it('should throw network error on fetch failure', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      await expect(api.getActivities()).rejects.toThrow('Network error');
    });
  });

  describe('Authentication Endpoints', () => {
    it('should login with credentials', async () => {
      const mockResponse = {
        token: 'new-token',
        userId: 1,
        user: { id: 1, email: 'test@example.com', name: 'Test' },
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await api.login('test@example.com', 'password123');

      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/auth/login`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should store refreshToken in sessionStorage on login when present', async () => {
      const mockResponse = {
        token: 'access-token',
        refreshToken: 'refresh-token-abc',
        userId: 1,
        user: { id: 1, email: 'test@example.com', name: 'Test' },
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      await api.login('test@example.com', 'password123');
      expect(api.getRefreshToken()).toBe('refresh-token-abc');
    });

    it('should register new user', async () => {
      const mockResponse = {
        token: 'new-token',
        userId: 1,
        user: { id: 1, email: 'new@example.com', name: 'New User' },
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await api.register('new@example.com', 'password123', 'New User');

      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/auth/register`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'new@example.com',
            password: 'password123',
            name: 'New User',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Activity Endpoints', () => {
    it('should get activities with pagination', async () => {
      const mockActivities = {
        data: [
          { id: 1, name: 'Morning Run', type: 'Run', distance: 5000 },
          { id: 2, name: 'Evening Bike', type: 'Bike', distance: 15000 },
        ],
        pagination: {
          page: 1,
          per_page: 20,
          total: 2,
          total_pages: 1,
          has_next: false,
          has_prev: false,
        },
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockActivities),
      } as Response);

      const result = await api.getActivities();

      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/activities`,
        expect.any(Object)
      );
      expect(result).toEqual(mockActivities.data);
    });

    it('should create activity', async () => {
      const newActivity = {
        name: 'Test Run',
        type: 'Run',
        date: '2024-01-01T10:00:00Z',
        distance: 5000,
        duration: 1800,
        avg_hr: 150,
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, id: 123 }),
      } as Response);

      await api.addManualActivity(newActivity);

      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/activities/create`,
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Test Run'),
        })
      );
    });
  });

  describe('Profile Endpoints', () => {
    it('should get user profile', async () => {
      const mockProfile = {
        id: 1,
        email: 'user@example.com',
        name: 'John Doe',
        age: 30,
        weight: 70,
        height: 175,
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProfile),
      } as Response);

      const result = await api.getProfile();

      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/profile`,
        expect.any(Object)
      );
      expect(result).toEqual(mockProfile);
    });

    it('should update profile', async () => {
      const updates = { name: 'Jane Doe', age: 31 };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      await api.updateProfile(updates);

      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/profile`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updates),
        })
      );
    });
  });

  // ============================================================
  // Property-Based Tests — Refresh Token Interceptor
  // ============================================================

  describe('Property 4: refreshToken stored in sessionStorage on login', () => {
    // Feature: drawrun-improvements, Property 4: refreshToken stored in sessionStorage on login
    // Validates: Requirement 2.1
    it('stores any refreshToken returned by login in sessionStorage', async () => {
      const mockUser = { id: 1, email: 'a@b.com', name: 'Test' };

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 100 }),
          async (refreshToken) => {
            // Reset state between runs
            sessionStorageData = {};
            api.setToken(null);

            global.fetch = vi.fn().mockResolvedValueOnce({
              ok: true,
              json: () =>
                Promise.resolve({
                  token: 'access-token',
                  refreshToken,
                  userId: 1,
                  user: mockUser,
                }),
            } as Response);

            await api.login('a@b.com', 'pass');
            return api.getRefreshToken() === refreshToken;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('does not store refreshToken when login response omits it', async () => {
      const mockUser = { id: 1, email: 'a@b.com', name: 'Test' };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ token: 'access-token', userId: 1, user: mockUser }),
      } as Response);

      await api.login('a@b.com', 'pass');
      expect(api.getRefreshToken()).toBeNull();
    });
  });

  describe('Property 5: 401 triggers refresh then retry', () => {
    // Feature: drawrun-improvements, Property 5: 401 triggers refresh then retry
    // Validates: Requirements 2.2, 2.3
    it('calls refresh endpoint exactly once and retries original request on 401', async () => {
      const newAccessToken = 'new-access-token';
      const newRefreshToken = 'new-refresh-token';
      const mockData = { id: 1, name: 'Test' };

      api.setRefreshToken('valid-refresh-token');
      api.setToken('expired-access-token');

      let fetchCallCount = 0;
      let refreshCallCount = 0;

      global.fetch = vi.fn().mockImplementation((url: string) => {
        fetchCallCount++;
        if ((url as string).includes('/api/auth/refresh')) {
          refreshCallCount++;
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                token: newAccessToken,
                refreshToken: newRefreshToken,
                expiresIn: 900,
              }),
          } as Response);
        }
        // First call to the protected endpoint returns 401, retry returns 200
        if (fetchCallCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 401,
            json: () => Promise.resolve({ error: 'Unauthorized' }),
          } as Response);
        }
        // Retry after refresh
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockData),
        } as Response);
      });

      const result = await api.getProfile();

      expect(refreshCallCount).toBe(1);
      expect(result).toEqual(mockData);
      expect(api.getRefreshToken()).toBe(newRefreshToken);
    });

    it('does not trigger refresh for 401 on /api/auth/login', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      } as Response);

      await expect(api.login('bad@example.com', 'wrong')).rejects.toThrow(ApiError);
      // fetch should only be called once (no refresh attempt)
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Property 6: failed refresh triggers logout', () => {
    // Feature: drawrun-improvements, Property 6: failed refresh triggers logout
    // Validates: Requirements 2.4, 5.1, 5.2
    it('calls logout and redirects to /login when no refresh token is present', async () => {
      const { useAuthStore } = await import('@/stores');
      const mockLogout = vi.fn();
      (useAuthStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ logout: mockLogout });

      api.setRefreshToken(null);
      api.setToken('expired-token');

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      } as Response);

      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true,
        configurable: true,
      });

      await expect(api.getProfile()).rejects.toThrow(ApiError);

      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(window.location.href).toBe('/login');

      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true,
      });
    });

    it('calls logout and redirects to /login when refresh endpoint returns 401', async () => {
      const { useAuthStore } = await import('@/stores');
      const mockLogout = vi.fn();
      (useAuthStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ logout: mockLogout });

      api.setRefreshToken('invalid-refresh-token');
      api.setToken('expired-token');

      global.fetch = vi.fn().mockImplementation((url: string) => {
        if ((url as string).includes('/api/auth/refresh')) {
          return Promise.resolve({
            ok: false,
            status: 401,
            json: () => Promise.resolve({ error: 'Invalid or expired refresh token' }),
          } as Response);
        }
        return Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Unauthorized' }),
        } as Response);
      });

      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true,
        configurable: true,
      });

      await expect(api.getProfile()).rejects.toThrow(ApiError);

      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(window.location.href).toBe('/login');

      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true,
      });
    });

    it('property: logout triggered for any expired token without refresh token', async () => {
      const { useAuthStore } = await import('@/stores');

      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true,
        configurable: true,
      });

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 50 }),
          async (expiredToken) => {
            const mockLogout = vi.fn();
            (useAuthStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
              logout: mockLogout,
            });

            sessionStorageData = {};
            api.setToken(expiredToken);
            api.setRefreshToken(null);
            window.location.href = '';

            global.fetch = vi.fn().mockResolvedValueOnce({
              ok: false,
              status: 401,
              json: () => Promise.resolve({ error: 'Unauthorized' }),
            } as Response);

            try {
              await api.getProfile();
            } catch {
              // expected
            }

            return mockLogout.mock.calls.length === 1 && window.location.href === '/login';
          }
        ),
        { numRuns: 20 }
      );

      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('Property 7: N concurrent 401s produce exactly 1 refresh call', () => {
    // Feature: drawrun-improvements, Property 7: N concurrent 401s produce exactly 1 refresh call
    // Validates: Requirement 2.5
    it('queues concurrent 401 requests and makes exactly one refresh call', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 8 }),
          async (n) => {
            // Reset state between runs
            sessionStorageData = {};
            api.setToken('expired-token');
            api.setRefreshToken('valid-refresh-token');

            let refreshCallCount = 0;
            let protectedCallCount = 0;

            global.fetch = vi.fn().mockImplementation((url: string) => {
              if ((url as string).includes('/api/auth/refresh')) {
                refreshCallCount++;
                return new Promise((resolve) =>
                  // Small delay to allow concurrent requests to queue
                  setTimeout(
                    () =>
                      resolve({
                        ok: true,
                        json: () =>
                          Promise.resolve({
                            token: 'new-access-token',
                            refreshToken: 'new-refresh-token',
                            expiresIn: 900,
                          }),
                      } as Response),
                    10
                  )
                );
              }

              protectedCallCount++;
              // First n calls return 401, subsequent retries return 200
              if (protectedCallCount <= n) {
                return Promise.resolve({
                  ok: false,
                  status: 401,
                  json: () => Promise.resolve({ error: 'Unauthorized' }),
                } as Response);
              }
              return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ data: 'ok' }),
              } as Response);
            });

            const requests = Array.from({ length: n }, () => api.getProfile());
            const results = await Promise.allSettled(requests);

            const allSettled = results.every(
              (r) => r.status === 'fulfilled' || r.status === 'rejected'
            );

            return allSettled && refreshCallCount === 1;
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
