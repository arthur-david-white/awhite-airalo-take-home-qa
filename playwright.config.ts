import { defineConfig, devices } from '@playwright/test';
import { airaloEnv } from './env';

/**
 * Central Playwright configuration for the Airalo test framework.
 *
 * Two independent projects:
 *  - `ui`  → chromium against the Airalo website.
 *  - `api` → pure HTTP client against the Airalo Partner API (no browser:
 *            browserName is deliberately omitted and no page fixtures are used).
 *
 * Run one suite with `--project=ui` / `--project=api`.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'ui',
      testDir: './tests/ui',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: airaloEnv.webBaseURL,
        actionTimeout: 15_000,
        navigationTimeout: 30_000,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
      },
    },
    {
      name: 'api',
      testDir: './tests/api',
      // Generous timeout: the Partner API rate-limits per endpoint and the
      // client waits out Retry-After delays before retrying.
      timeout: 300_000,
      use: {
        // No browserName here on purpose - this project never launches a
        // browser; tests talk to the Partner API via APIRequestContext only.
        baseURL: airaloEnv.apiBaseURL,
      },
    },
  ],
});
