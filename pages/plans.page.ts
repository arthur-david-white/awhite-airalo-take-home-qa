import type { Locator, Page } from '@playwright/test';
import type { AiraloApiClient } from '../services/airalo-api-client';
import { BasePage } from './base.page';
import { plansLocators } from './locators/plans.locators';

/**
 * Destination plan-selection page (e.g. /japan-esim), including the sticky
 * checkout bar shown after a package is selected. Generic over destination
 * and package validity — nothing in here is Japan- or 7-day-specific.
 */
export class PlansPage extends BasePage {
  // Plans pages are per destination (/japan-esim, /turkey-esim, ...) and are
  // usually reached by navigating from search; use openFor()/urlFor() for a
  // specific destination. `path` points at the eSIM store hub as a fallback.
  protected readonly path = '/esim';

  /** Page heading, e.g. "Japan eSIMs". */
  readonly heading: Locator;
  /** "Package details" button in the sticky checkout bar. */
  readonly packageDetailsButton: Locator;
  /** Total price in the checkout bar, shown next to "Package details". */
  readonly packageDetailsTotalPrice: Locator;
  /** "Buy now" CTA in the sticky checkout bar. */
  readonly buyNowButton: Locator;

  constructor(page: Page, api: AiraloApiClient) {
    super(page, api);
    this.heading = plansLocators.heading(page);
    this.packageDetailsButton = plansLocators.packageDetailsButton(page);
    this.packageDetailsTotalPrice = plansLocators.packageDetailsTotalPrice(page);
    this.buyNowButton = plansLocators.buyNowButton(page);
  }

  /** Route for a destination's plans page, e.g. 'Japan' → /japan-esim. */
  routeFor(destination: string): string {
    return `/${destination.trim().toLowerCase().replace(/\s+/g, '-')}-esim`;
  }

  /** URL pattern asserting the plans page for a destination is open. */
  urlFor(destination: string): RegExp {
    return new RegExp(`${this.routeFor(destination)}(/|$|\\?)`);
  }

  /** Navigate straight to a destination's plans page, e.g. openFor('Japan'). */
  async openFor(destination: string): Promise<void> {
    await this.step(`open plans page for ${destination}`, async () => {
      await this.page.goto(this.routeFor(destination));
      await this.dismissCookieBanner();
    });
  }

  /** Package card button for a validity, e.g. packageCard('7 days'). */
  packageCard(validity: string): Locator {
    return plansLocators.packageCard(this.page, validity);
  }

  /** Price advertised on the package card for a validity, e.g. "£21.00". */
  packagePrice(validity: string): Locator {
    return plansLocators.packageCardPrice(this.page, validity);
  }

  /** Find and click the package with the given validity. */
  async selectPackage(validity: string): Promise<void> {
    await this.step(`select the ${validity} package`, async () => {
      await this.packageCard(validity).click();
    });
  }
}
