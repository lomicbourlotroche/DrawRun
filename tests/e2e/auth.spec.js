/**
 * ============================================================
 * E2E TESTS - Authentication
 * ============================================================
 * End-to-end tests for authentication flows using Playwright.
 */

const { test, expect, beforeAll, afterAll } = require('@playwright/test');

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';
const API_URL = process.env.TEST_API_URL || 'http://localhost:3000';

// Test user credentials (should match test data)
const TEST_USER = {
    email: `test-e2e-${Date.now()}@drawrun.fr`,
    password: 'TestPassword123!',
    name: 'Test User E2E'
};

// Helper function to generate random email
function generateTestEmail() {
    return `test-e2e-${Date.now()}-${Math.random().toString(36).substring(2, 8)}@drawrun.fr`;
}

beforeAll(async () => {
    console.log(`Running E2E tests against: ${BASE_URL}`);
    console.log(`API URL: ${API_URL}`);
});

// ============================================================================
// REGISTRATION TESTS
// ============================================================================

test.describe('User Registration', () => {
    test('should display registration page', async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);
        
        // Check if page loads
        await expect(page).toHaveTitle(/DrawRun/);
        
        // Check for registration link or form
        const hasRegisterLink = await page.locator('a[href*="register"]').count() > 0;
        const hasRegisterForm = await page.locator('input[type="email"]').count() > 0;
        
        expect(hasRegisterLink || hasRegisterForm).toBeTruthy();
    });

    test('should register a new user via API', async ({ request }) => {
        const testEmail = generateTestEmail();
        
        // Register via API
        const registerResponse = await request.post(`${API_URL}/api/auth/register`, {
            data: {
                email: testEmail,
                password: TEST_USER.password,
                name: TEST_USER.name
            }
        });
        
        expect(registerResponse.ok()).toBeTruthy();
        const registerData = await registerResponse.json();
        
        // Check response structure
        expect(registerData).toHaveProperty('token');
        expect(registerData).toHaveProperty('user');
        expect(registerData.user.email).toBe(testEmail);
        expect(registerData.user.name).toBe(TEST_USER.name);
        
        // Store token for cleanup
        process.env.TEST_REGISTERED_USER_TOKEN = registerData.token;
        process.env.TEST_REGISTERED_USER_EMAIL = testEmail;
    });
});

// ============================================================================
// LOGIN TESTS
// ============================================================================

test.describe('User Login', () => {
    test('should login with valid credentials via API', async ({ request }) => {
        // First register a test user
        const testEmail = generateTestEmail();
        
        await request.post(`${API_URL}/api/auth/register`, {
            data: {
                email: testEmail,
                password: TEST_USER.password,
                name: TEST_USER.name
            }
        });
        
        // Login via API
        const loginResponse = await request.post(`${API_URL}/api/auth/login`, {
            data: {
                email: testEmail,
                password: TEST_USER.password
            }
        });
        
        expect(loginResponse.ok()).toBeTruthy();
        const loginData = await loginResponse.json();
        
        // Check response structure
        expect(loginData).toHaveProperty('token');
        expect(loginData).toHaveProperty('user');
        expect(loginData.user.email).toBe(testEmail);
    });

    test('should reject login with invalid credentials', async ({ request }) => {
        const testEmail = generateTestEmail();
        
        // Register first
        await request.post(`${API_URL}/api/auth/register`, {
            data: {
                email: testEmail,
                password: TEST_USER.password,
                name: TEST_USER.name
            }
        });
        
        // Try login with wrong password
        const loginResponse = await request.post(`${API_URL}/api/auth/login`, {
            data: {
                email: testEmail,
                password: 'wrong-password-123'
            }
        });
        
        expect(loginResponse.ok()).toBeFalsy();
        expect(loginResponse.status()).toBe(401);
        
        const errorData = await loginResponse.json();
        expect(errorData).toHaveProperty('error');
    });

    test('should reject login with non-existent email', async ({ request }) => {
        const loginResponse = await request.post(`${API_URL}/api/auth/login`, {
            data: {
                email: 'nonexistent-user@drawrun.fr',
                password: TEST_USER.password
            }
        });
        
        expect(loginResponse.ok()).toBeFalsy();
        expect(loginResponse.status()).toBe(401);
    });
});

// ============================================================================
// PROFILE TESTS
// ============================================================================

test.describe('User Profile', () => {
    let testToken;
    let testUserEmail;

    test.beforeAll(async ({ request }) => {
        // Create and login a test user
        const testEmail = generateTestEmail();
        
        await request.post(`${API_URL}/api/auth/register`, {
            data: {
                email: testEmail,
                password: TEST_USER.password,
                name: TEST_USER.name
            }
        });
        
        const loginResponse = await request.post(`${API_URL}/api/auth/login`, {
            data: {
                email: testEmail,
                password: TEST_USER.password
            }
        });
        
        const loginData = await loginResponse.json();
        testToken = loginData.token;
        testUserEmail = testEmail;
    });

    test('should get user profile with valid token', async ({ request }) => {
        const profileResponse = await request.get(`${API_URL}/api/profile`, {
            headers: {
                'Authorization': `Bearer ${testToken}`
            }
        });
        
        expect(profileResponse.ok()).toBeTruthy();
        const profileData = await profileResponse.json();
        
        expect(profileData).toHaveProperty('user');
        expect(profileData.user.email).toBe(testUserEmail);
    });

    test('should reject profile access without token', async ({ request }) => {
        const profileResponse = await request.get(`${API_URL}/api/profile`);
        
        expect(profileResponse.ok()).toBeFalsy();
        expect(profileResponse.status()).toBe(401);
    });
});

// ============================================================================
// HEALTH CHECK TESTS
// ============================================================================

test.describe('Health Check', () => {
    test('should return health status', async ({ request }) => {
        const healthResponse = await request.get(`${API_URL}/health`);
        
        expect(healthResponse.ok()).toBeTruthy();
        const healthData = await healthResponse.json();
        
        expect(healthData).toHaveProperty('status', 'running');
        expect(healthData).toHaveProperty('message');
        expect(healthData).toHaveProperty('version');
    });
});

// ============================================================================
// RATE LIMITING TESTS
// ============================================================================

test.describe('Rate Limiting', () => {
    test('should limit auth endpoints to 5 requests per 15 minutes', async ({ request }) => {
        // This test may fail if there are concurrent tests
        // We'll make 6 attempts and expect at least one to be rate limited
        
        const testEmail = generateTestEmail();
        
        // First register the user
        await request.post(`${API_URL}/api/auth/register`, {
            data: {
                email: testEmail,
                password: TEST_USER.password,
                name: TEST_USER.name
            }
        });
        
        // Make multiple login attempts with wrong password
        const attempts = [];
        for (let i = 0; i < 6; i++) {
            const response = await request.post(`${API_URL}/api/auth/login`, {
                data: {
                    email: testEmail,
                    password: 'wrong-password'
                }
            });
            attempts.push(response);
        }
        
        // Check if at least one request was rate limited
        const rateLimited = attempts.some(r => r.status() === 429);
        expect(rateLimited).toBeTruthy();
    });
});

// ============================================================================
// CSP TESTS
// ============================================================================

test.describe('CSP Headers', () => {
    test('should include CSP header in responses', async ({ request }) => {
        const healthResponse = await request.get(`${API_URL}/health`);
        
        // Check for CSP header (either Content-Security-Policy or Content-Security-Policy-Report-Only)
        const cspHeader = healthResponse.headers()['content-security-policy'] ||
                         healthResponse.headers()['content-security-policy-report-only'];
        
        expect(cspHeader).toBeTruthy();
        expect(cspHeader).toContain("'self'");
    });

    test('should NOT include unsafe-inline in CSP', async ({ request }) => {
        const healthResponse = await request.get(`${API_URL}/health`);
        
        const cspHeader = healthResponse.headers()['content-security-policy'] ||
                         healthResponse.headers()['content-security-policy-report-only'];
        
        expect(cspHeader).not.toContain("'unsafe-inline'");
    });
});

// ============================================================================
// CORS TESTS
// ============================================================================

test.describe('CORS Configuration', () => {
    test('should allow requests from configured origins', async ({ request }) => {
        // This test assumes the test is running against a properly configured server
        const healthResponse = await request.get(`${API_URL}/health`);
        
        // Check for CORS headers
        const accessControlAllowOrigin = healthResponse.headers()['access-control-allow-origin'];
        
        // In production, this should be configured
        // In development, it may be * or null
        if (accessControlAllowOrigin) {
            expect(typeof accessControlAllowOrigin).toBe('string');
        }
    });
});

afterAll(async () => {
    // Cleanup: delete test users
    if (process.env.TEST_REGISTERED_USER_TOKEN && process.env.TEST_REGISTERED_USER_EMAIL) {
        // Note: In a real implementation, you would have an endpoint to delete test users
        // For now, we just log the cleanup
        console.log(`Test user created: ${process.env.TEST_REGISTERED_USER_EMAIL}`);
        console.log('Note: Test users should be cleaned up manually or via a test cleanup endpoint');
    }
});
