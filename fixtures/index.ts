/**
 * Single import point for specs:
 *   import { test, expect } from '../../fixtures';
 *
 * `test` is the base Playwright test extended with Airalo auth, API client
 * and page-object fixtures (see api.fixtures.ts / pages.fixtures.ts).
 */
export { test } from './pages.fixtures';
export { expect } from '@playwright/test';
