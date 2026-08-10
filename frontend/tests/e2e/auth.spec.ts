/**
 * ============================================================
 * AUTHENTICATION E2E TESTS
 * ============================================================
 *
 * Tests end-to-end pour les flux d'authentification
 * - Login / Logout
 * - Registration
 * - 2FA (si activé)
 * - Accès protégé
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('DrawRun');
    await expect(page.locator('form[data-testid="login-form"]')).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.click('button[type="submit"]');

    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('[data-testid="auth-error"]')).toContainText('Invalid credentials');
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Mock successful login response
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'mock-jwt-token',
          user: {
            id: 1,
            email: 'test@example.com',
            name: 'Test User',
          },
        }),
      });
    });

    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/app');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
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

    await page.goto('/app');
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    // Should redirect to login
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
  });

  test('should protect authenticated routes', async ({ page }) => {
    await page.goto('/app');

    // Should redirect to login
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
  });

  test('should handle registration flow', async ({ page }) => {
    await page.click('[data-testid="register-link"]');

    await expect(page).toHaveURL('/login?mode=register');
    await expect(page.locator('[data-testid="registration-form"]')).toBeVisible();

    // Fill registration form
    await page.fill('[data-testid="name-input"]', 'New User');
    await page.fill('[data-testid="email-input"]', 'newuser@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.fill('[data-testid="confirm-password-input"]', 'password123');

    // Mock successful registration
    await page.route('**/api/auth/register', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'User registered successfully',
        }),
      });
    });

    await page.click('button[type="submit"]');

    await expect(page.locator('[data-testid="success-message"]')).toContainText('registered successfully');
  });

  test('should validate password strength', async ({ page }) => {
    await page.click('[data-testid="register-link"]');

    await page.fill('[data-testid="password-input"]', '123');
    await expect(page.locator('[data-testid="password-strength"]')).toContainText('Weak');

    await page.fill('[data-testid="password-input"]', 'StrongP@ssw0rd!');
    await expect(page.locator('[data-testid="password-strength"]')).toContainText('Strong');
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    await expect(page.locator('form[data-testid="login-form"]')).toBeVisible();
  });

  test('should work on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
  });
});
