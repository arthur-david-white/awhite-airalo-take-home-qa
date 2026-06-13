import type { Locator, Page } from '@playwright/test';
import { escapeRegExp } from './locator.utils';

/**
 * Identifiers shared across all Airalo pages (site-wide chrome).
 * Airalo uses OneTrust for cookie consent.
 */
export const baseLocators = {
  /** OneTrust cookie consent banner container. */
  cookieBanner: (page: Page): Locator => page.locator('#onetrust-banner-sdk'),

  /** "Accept" button inside the cookie consent banner. */
  cookieAcceptButton: (page: Page): Locator => page.locator('#onetrust-accept-btn-handler'),

  /** Currency switcher button in the site header. */
  currencyButton: (page: Page): Locator => page.getByRole('button', { name: 'Currency' }),

  /**
   * Currency selection dialog. Its accessible name is "Currency: <symbol>
   * <code>"; the visible filter skips sibling dialogs (language, etc.) that
   * the app pre-renders hidden.
   */
  currencyDialog: (page: Page): Locator =>
    page.getByRole('dialog', { name: /^Currency:/ }).filter({ visible: true }),

  /** A currency option inside the dialog, by ISO code - e.g. 'JPY' matches "Japanese yen (JPY) ¥". */
  currencyOption: (page: Page, currencyCode: string): Locator =>
    baseLocators
      .currencyDialog(page)
      .getByRole('button', { name: new RegExp(`\\(${escapeRegExp(currencyCode)}\\)`) }),
};
