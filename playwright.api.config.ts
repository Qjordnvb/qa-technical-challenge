import { defineConfig } from '@playwright/test';

/**
 * Dedicated config for the API contract + integration suite.
 *
 * Isolated from the shared `playwright.config.ts` (used by the UI agent) so both
 * suites run in parallel without clobbering each other:
 *   - own testDir  → tests/api-suite (no collision with UI-generated specs)
 *   - own outputDir + report folder → no shared test-results / playwright-report
 *   - no browser project → runs fast, headless, request-only
 *
 * Run with:  npx playwright test --config=playwright.api.config.ts
 */
const API_BASE_URL = process.env.API_BASE_URL || 'https://automationexercise.com';

export default defineConfig({
  testDir: './tests/api-suite',
  outputDir: './test-results-api',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  reporter: [
    ['list'],
    // Dedicated port (UI report uses the default 9323) so both can be served at once.
    ['html', { outputFolder: 'playwright-report-api', open: 'never', port: 9324 }],
  ],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: API_BASE_URL,
    trace: 'on-first-retry',
    extraHTTPHeaders: { Accept: 'application/json' },
  },
  projects: [
    {
      name: 'api',
      // request-only; no `devices` / browser needed.
    },
  ],
});
