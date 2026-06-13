import { expect, test, type Page } from '@playwright/test';
import type { AiraloApiClient } from '../services/airalo-api-client';
import { baseLocators } from './locators/base.locators';

/**
 * Base class for all Airalo page objects.
 *
 * Deliberately small: it holds the Page, an Airalo Partner API handle for
 * state setup, and a few HIGH-VALUE shared helpers (navigation, logged
 * actions, cookie-banner dismissal). It does NOT wrap locator.click()/fill()
 * - Playwright locators already auto-wait and we don't want to hide its API.
 */
export abstract class BasePage {
  /** Route of this page relative to the ui project baseURL, e.g. '/'. */
  protected abstract readonly path: string;

  constructor(
    protected readonly page: Page,
    /**
     * Airalo Partner API client so page objects CAN seed state via the API
     * (e.g. create an order before checking it in the UI). BasePage only
     * holds the reference - all request logic lives in AiraloApiClient.
     */
    protected readonly api: AiraloApiClient,
  ) {}

  /** Navigate to this page and clear Airalo's cookie banner if it appears. */
  async open(): Promise<void> {
    await this.step(`open ${this.path}`, async () => {
      await this.goto(this.path);
      await this.dismissCookieBanner();
    });
  }

  /**
   * Navigate to `path` with site-wide guards applied. Use this instead of
   * `page.goto()` directly so every navigation is protected.
   */
  protected async goto(path: string): Promise<void> {
    await this.suppressNotificationPrompt();
    await this.page.goto(path);
  }

  // Install the notification guard at most once per page instance.
  private notificationPromptSuppressed = false;

  /**
   * Stop the browser's native "Allow notifications?" permission prompt from
   * ever appearing. Airalo calls `Notification.requestPermission()` after a
   * short delay on the landing page; in headed runs that fires the native
   * Chrome prompt, which steals focus and intermittently breaks the test.
   *
   * It is a NATIVE browser prompt (not page DOM), so it can't be dismissed
   * with a locator. Instead we install an init script (runs before any page
   * script, on every navigation in this page) that makes the Web Notification
   * API report a settled "denied" state, so the site never triggers a prompt.
   */
  private async suppressNotificationPrompt(): Promise<void> {
    if (this.notificationPromptSuppressed) return;
    this.notificationPromptSuppressed = true;
    // Runs in the browser before any page script; typed as `any` because the
    // project's tsconfig omits the DOM lib (these globals exist at runtime).
    await this.page.addInitScript(() => {
      const w = globalThis as unknown as {
        Notification?: { permission: string; requestPermission: unknown };
        PushManager?: { prototype?: { subscribe?: unknown } };
        DOMException: new (message: string, name: string) => Error;
      };
      try {
        if (w.Notification) {
          Object.defineProperty(w.Notification, 'permission', {
            configurable: true,
            get: () => 'denied',
          });
          // Resolve immediately as denied without invoking the native prompt,
          // supporting both the promise and legacy callback signatures.
          w.Notification.requestPermission = (callback?: (permission: string) => void) => {
            callback?.('denied');
            return Promise.resolve('denied');
          };
        }
        // Belt-and-braces: reject service-worker push subscription too.
        if (w.PushManager?.prototype?.subscribe) {
          w.PushManager.prototype.subscribe = () =>
            Promise.reject(new w.DOMException('Blocked in tests', 'NotAllowedError'));
        }
      } catch {
        /* Notification API absent or locked down - nothing to suppress. */
      }
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
   * failure - but once we click Accept, it MUST disappear.
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
