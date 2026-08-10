/**
 * ============================================================
 * DASHBOARD E2E TESTS
 * ============================================================
 *
 * Tests end-to-end pour le dashboard et les fonctionnalités principales
 * - Affichage des métriques
 * - Navigation
 * - Graphiques PMC
 * - Activités récentes
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated state
    await page.addInitScript(() => {
      window.sessionStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            isAuthenticated: true,
            user: { id: 1, email: 'test@example.com', name: 'Test User' },
            token: 'mock-jwt-token',
          },
          version: 0,
        }),
      );
    });

    // Mock API responses
    await page.route('**/api/dashboard/metrics', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          readiness: 75,
          fitness: 85,
          fatigue: 60,
          form: 25,
          weeklyLoad: 450,
          monthlyLoad: 1800,
          recentActivities: [
            { id: 1, title: 'Morning Run', distance: 10.5, duration: '52:30', type: 'running' },
            { id: 2, title: 'Evening Ride', distance: 25.0, duration: '1:15:00', type: 'cycling' },
          ],
        }),
      });
    });

    await page.route('**/api/pmc/data', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { date: '2024-01-01', ctl: 45, atl: 50, tsb: -5 },
            { date: '2024-01-02', ctl: 46, atl: 48, tsb: -2 },
            { date: '2024-01-03', ctl: 47, atl: 45, tsb: 2 },
          ],
        }),
      });
    });
  });

  test('should display dashboard with metrics', async ({ page }) => {
    await page.goto('/app');

    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="readiness-card"]')).toContainText('75');
    await expect(page.locator('[data-testid="fitness-card"]')).toContainText('85');
    await expect(page.locator('[data-testid="fatigue-card"]')).toContainText('60');
    await expect(page.locator('[data-testid="form-card"]')).toContainText('25');
  });

  test('should display PMC chart', async ({ page }) => {
    await page.goto('/app');

    await expect(page.locator('[data-testid="pmc-chart"]')).toBeVisible();

    // Wait for chart to render
    await page.waitForSelector('[data-testid="pmc-chart"] canvas');

    // Check if chart elements are present
    const chart = page.locator('[data-testid="pmc-chart"]');
    await expect(chart).toBeVisible();
  });

  test('should display recent activities', async ({ page }) => {
    await page.goto('/app');

    await expect(page.locator('[data-testid="recent-activities"]')).toBeVisible();
    await expect(page.locator('[data-testid="activity-1"]')).toContainText('Morning Run');
    await expect(page.locator('[data-testid="activity-2"]')).toContainText('Evening Ride');
  });

  test('should navigate between sections', async ({ page }) => {
    await page.goto('/app');

    // Test navigation to activities
    await page.click('[data-testid="nav-activities"]');
    await expect(page).toHaveURL('/app/activities');

    // Test navigation to performance
    await page.click('[data-testid="nav-performance"]');
    await expect(page).toHaveURL('/app/performance');

    // Test navigation to coach
    await page.click('[data-testid="nav-coach"]');
    await expect(page).toHaveURL('/app/coach');

    // Test navigation back to dashboard
    await page.click('[data-testid="nav-dashboard"]');
    await expect(page).toHaveURL('/app');
  });

  test('should handle mobile navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/app');

    // Mobile menu should be visible
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();

    // Open mobile menu
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

    // Navigate via mobile menu
    await page.click('[data-testid="mobile-nav-activities"]');
    await expect(page).toHaveURL('/app/activities');
  });

  test('should display loading states', async ({ page }) => {
    // Slow API response
    await page.route('**/api/dashboard/metrics', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ readiness: 75, fitness: 85 }),
      });
    });

    await page.goto('/app');

    // Should show loading state
    await expect(page.locator('[data-testid="metrics-loading"]')).toBeVisible();

    // Should show content after loading
    await expect(page.locator('[data-testid="readiness-card"]')).toBeVisible({ timeout: 3000 });
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/dashboard/metrics', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.goto('/app');

    // Should show error state
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('should refresh data on manual refresh', async ({ page }) => {
    await page.goto('/app');

    // Mock API call counter
    let apiCallCount = 0;
    await page.route('**/api/dashboard/metrics', async (route) => {
      apiCallCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ readiness: 75 + apiCallCount }),
      });
    });

    // Initial load
    await expect(page.locator('[data-testid="readiness-card"]')).toContainText('75');

    // Manual refresh
    await page.click('[data-testid="refresh-button"]');

    // Should show updated data
    await expect(page.locator('[data-testid="readiness-card"]')).toContainText('76');
  });

  test('should display quick stats', async ({ page }) => {
    await page.goto('/app');

    await expect(page.locator('[data-testid="weekly-load"]')).toContainText('450');
    await expect(page.locator('[data-testid="monthly-load"]')).toContainText('1,800');
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await page.goto('/app');

    // Tab navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();

    // Enter key on focused elements
    await page.keyboard.press('Enter');
    // Should trigger action on focused element
  });
});
