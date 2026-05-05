import { describe, it, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores';

// Mock the @/stores module circular dependency in api.ts
vi.mock('@/stores', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/stores')>();
  return actual;
});

describe('Auth Store — Property-Based Tests', () => {
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

    // Reset store and api state
    api.setToken(null);
    useAuthStore.setState({ isAuthenticated: false, user: null, token: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Property 8: logout clears all auth state', () => {
    // Feature: drawrun-improvements, Property 8: logout clears all auth state
    // Validates: Requirement 7.3
    it('Property 8: logout clears token from store and both sessionStorage keys', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 100 }),
          (token) => {
            // Reset between runs
            sessionStorageData = {};
            localStorageData = {};

            // Set up auth state
            api.setToken(token);
            api.setRefreshToken(token);
            useAuthStore.setState({ isAuthenticated: true, token, user: null });

            // Logout
            useAuthStore.getState().logout();

            // Assert all cleared
            return (
              sessionStorage.getItem('drawrun_token') === null &&
              sessionStorage.getItem('drawrun_refresh_token') === null &&
              useAuthStore.getState().token === null
            );
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 9: token never written to localStorage', () => {
    // Feature: drawrun-improvements, Property 9: token never written to localStorage
    // Validates: Requirement 7.4
    it('Property 9: token never written to localStorage', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 100 }),
          (token) => {
            // Reset between runs
            localStorageData = {};

            api.setToken(token);
            api.setToken(null);
            return localStorage.getItem('drawrun_token') === null;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
