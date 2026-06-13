import { expect, test, type Page } from '@playwright/test';
import type { AiraloApiClient } from '../services/airalo-api-client';
import { baseLocators } from './locators/base.locators';

/**
 * Base class for all Airalo page objects.
 *
 * Deliberately small: it holds the Page, an Airalo Partner API handle for
 * state setup, and a few HIGH-VALUE shared helpers (navigation, logged
 * actions, cookie-banner dismissal). It does NOT wrap locator.click()/fill()
 * — Playwright locators already auto-wait and we don't want to hide its API.
 */
export abstract class BasePage {
  /** Route of this page relative to the ui project baseURL, e.g. '/'. */
  protected abstract readonly path: string;

  constructor(
    protected readonly page: Page,
    /**
     * Airalo Partner API client so page objects CAN seed state via the API
     * (e.g. create an order before checking it in the UI). BasePage only
     * holds the reference — all request logic lives in AiraloApiClient.
     */
    protected readonly api: AiraloApiClient,
  ) {}

  /** Navigate to this page and clear Airalo's cookie banner if it appears. */
  async open(): Promise<void> {
    await this.step(`open ${this.path}`, async () => {
      await this.page.goto(this.path);
      await this.dismissCookieBanner();
    });
  }

  /**
   * Wrap a page-object action in a named test.step so reports and traces
   * read as user flows ("HomePage: open /") instead of raw locator calls.
   */
  protected step<T>(title: string, body: () => Promise<T>): Promise<T> {
    return test.step(`${this.constructor.name}: ${title}`, body);
  }

  /**
   * Switch the site currency via the header currency dialog, e.g.
   * selectCurrency('JPY'). Available on every page (site-wide header).
   * Waits for the dialog to close, which is when the new currency applies.
   */
  async selectCurrency(currencyCode: string): Promise<void> {
    await this.step(`select currency ${currencyCode}`, async () => {
      const dialog = baseLocators.currencyDialog(this.page);
      // The header hydrates client-side; retry open-and-check as one unit
      // (same pattern as HomePage.searchFor).
      await expect(async () => {
        await baseLocators.currencyButton(this.page).click();
        await expect(dialog, 'Currency dialog should open').toBeVisible({ timeout: 3_000 });
      }).toPass({ timeout: 30_000 });
      await baseLocators.currencyOption(this.page, currencyCode).click();
      await dialog.waitFor({ state: 'hidden' });
    });
  }

  /**
   * Dismiss Airalo's OneTrust cookie consent banner and wait until it has
   * fully cleared before continuing, so it can never overlap later actions.
   * The banner is environment/region dependent, so its absence is never a
   * failure — but once we click Accept, it MUST disappear.
   */
  async dismissCookieBanner(timeoutMs = 5_000): Promise<void> {
    const banner = baseLocators.cookieBanner(this.page);
    const accept = baseLocators.cookieAcceptButton(this.page);
    try {
      await accept.waitFor({ state: 'visible', timeout: timeoutMs });
    } catch {
      return; // Banner not shown (already accepted, or region without consent prompt).
    }
    await accept.click();
    await banner.waitFor({ state: 'hidden', timeout: timeoutMs });
  }
}
