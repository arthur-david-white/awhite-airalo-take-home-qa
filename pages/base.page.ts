import { test, type Page } from '@playwright/test';
import type { AiraloApiClient } from '../services/airalo-api-client';

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
   * Best-effort dismissal of Airalo's cookie consent banner. The banner is
   * environment/region dependent, so its absence is never a failure — we
   * wait briefly and move on if it doesn't show up.
   */
  async dismissCookieBanner(timeoutMs = 3_000): Promise<void> {
    const accept = this.page.getByRole('button', { name: /accept/i }).first();
    try {
      await accept.waitFor({ state: 'visible', timeout: timeoutMs });
      await accept.click();
    } catch {
      // Banner not shown (already accepted, or region without consent prompt).
    }
  }
}
