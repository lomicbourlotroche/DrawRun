/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
    // Test directory
    testDir: './tests/e2e',
    
    // Timeout settings
    timeout: 30000,
    expect: {
        timeout: 5000
    },
    
    // Retry failed tests
    retries: 1,
    
    // Workers (parallel tests)
    workers: process.env.CI ? 2 : undefined,
    
    // Reporter
    reporter: [
        ['list'],
        ['json', { outputFile: 'test-results/e2e-results.json' }],
        ['html', { outputFolder: 'test-results/e2e-html-report' }]
    ],
    
    // Use baseURL from environment or default
    use: {
        baseURL: process.env.TEST_BASE_URL || 'http://localhost:3001',
        apiBaseURL: process.env.TEST_API_URL || 'http://localhost:3000',
        
        // Trace on first retry
        trace: 'retain-on-failure',
        
        // Screenshot on failure
        screenshot: 'only-on-failure',
        
        // Video recording
        video: 'retain-on-failure',
    },
    
    // Global setup/teardown
    globalSetup: './tests/e2e/global-setup.js',
    globalTeardown: './tests/e2e/global-teardown.js',
    
    // Projects (browsers to test)
    projects: [
        {
            name: 'chromium',
            use: {
                ...require('@playwright/test').devices['Desktop Chrome'],
            },
        },
        {
            name: 'firefox',
            use: {
                ...require('@playwright/test').devices['Desktop Firefox'],
            },
        },
        {
            name: 'webkit',
            use: {
                ...require('@playwright/test').devices['Desktop Safari'],
            },
        },
    ],
    
    // CI-specific configuration
    ...(process.env.CI && {
        // Run only in CI
        fullyParallel: true,
        forbidOnly: !!process.env.CI,
    }),
};

module.exports = config;
