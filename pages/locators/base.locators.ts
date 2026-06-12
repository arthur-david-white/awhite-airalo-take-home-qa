import type { Locator, Page } from '@playwright/test';

/**
 * Identifiers shared across all Airalo pages (site-wide chrome).
 * Airalo uses OneTrust for cookie consent.
 */
export const baseLocators = {
  /** OneTrust cookie consent banner container. */
  cookieBanner: (page: Page): Locator => page.locator('#onetrust-banner-sdk'),

  /** "Accept" button inside the cookie consent banner. */
  cookieAcceptButton: (page: Page): Locator => page.locator('#onetrust-accept-btn-handler'),
};
