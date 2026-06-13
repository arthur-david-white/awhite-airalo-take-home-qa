import { expect, type Locator, type Page } from '@playwright/test';
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
  /** Total price in the checkout bar, shown next to the "Buy now" button. */
  readonly buyNowPrice: Locator;
  /** "Buy now" CTA in the sticky checkout bar. */
  readonly buyNowButton: Locator;

  constructor(page: Page, api: AiraloApiClient) {
    super(page, api);
    this.heading = plansLocators.heading(page);
    this.packageDetailsButton = plansLocators.packageDetailsButton(page);
    this.buyNowPrice = plansLocators.buyNowPrice(page);
    this.buyNowButton = plansLocators.buyNowButton(page);
  }

  /** A data-plan-type tab ('Unlimited' / 'Standard'), e.g. planTypeTab('Unlimited'). */
  planTypeTab(tabName: string): Locator {
    return plansLocators.planTypeTab(this.page, tabName);
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

  /**
   * Select a data-plan-type tab, e.g. selectPlanType('Unlimited'). Tabs that
   * are already active are a no-op click, so this is safe to call regardless
   * of the default selection.
   */
  async selectPlanType(tabName: string): Promise<void> {
    await this.step(`select the ${tabName} data plan tab`, async () => {
      const tab = this.planTypeTab(tabName);
      await expect(tab, `A "${tabName}" data plan tab should be offered`).toBeVisible();
      await tab.click();
      await expect(tab, `"${tabName}" tab should be selected`).toHaveAttribute(
        'aria-selected',
        'true',
      );
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

  /** Verify the plans page for a destination is open (URL + heading). */
  async expectLoadedFor(destination: string): Promise<void> {
    await this.step(`verify plans page for ${destination} is open`, async () => {
      await expect(this.page, `Should land on the ${destination} plans page`).toHaveURL(
        this.urlFor(destination),
      );
      await expect(
        this.heading,
        'Plans page heading should name the destination',
      ).toHaveText(new RegExp(`${destination} eSIMs`, 'i'));
    });
  }

  /**
   * Find and click the package with the given validity, verifying it is
   * offered first. Returns the price advertised on the card (e.g. "£21.00")
   * so callers can compare it against what checkout shows.
   */
  async selectPackage(validity: string): Promise<string> {
    return this.step(`select the ${validity} package`, async () => {
      await expect(
        this.packageCard(validity),
        `A ${validity} package should be offered on this plans page`,
      ).toBeVisible();
      const advertisedPrice = (await this.packagePrice(validity).innerText()).trim();
      await this.packageCard(validity).click();
      return advertisedPrice;
    });
  }

  /**
   * Verify the checkout bar is shown and the Total price next to the "Buy now"
   * button matches the expected price (as advertised on the package card).
   */
  async expectBuyNowPriceMatches(expectedPrice: string): Promise<void> {
    await this.step(`verify the price next to Buy now is ${expectedPrice}`, async () => {
      await expect(
        this.buyNowButton,
        'Buy now button should be shown after selecting a package',
      ).toBeVisible();
      await expect(
        this.buyNowPrice,
        'Total next to the Buy now button should match the advertised package price',
      ).toHaveText(expectedPrice);
    });
  }
}
