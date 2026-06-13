import type { Locator, Page } from '@playwright/test';
import { escapeRegExp } from './locator.utils';

/** Airalo data-testid hooks on the plans / package-selection page. */
const testIds = {
  price: 'price_amount',
  packageDetailsButton: 'store-operator-details_plan-details-button',
  buyNowButton: 'cart-navigation_select-package-cta',
} as const;

/**
 * Identifiers for a destination's plan-selection page (e.g. /japan-esim).
 * Locators live here; behaviour lives in pages/plans.page.ts.
 */
export const plansLocators = {
  /** Page heading, e.g. "Japan eSIMs". */
  heading: (page: Page): Locator => page.getByRole('heading', { level: 1 }),

  /**
   * Package card button for a validity such as '7 days'. Cards carry an
   * aria-label like "Select Unlimited - 7 days for £21.00."; the visible
   * filter skips duplicates inside non-active tab panels.
   */
  packageCard: (page: Page, validity: string): Locator =>
    page
      .getByRole('button', { name: new RegExp(`Select .+ - ${escapeRegExp(validity)} for `) })
      .filter({ visible: true }),

  /** Price advertised on a package card, e.g. "£21.00". */
  packageCardPrice: (page: Page, validity: string): Locator =>
    plansLocators.packageCard(page, validity).getByTestId(testIds.price),

  /** "Package details" button in the sticky checkout bar. */
  packageDetailsButton: (page: Page): Locator => page.getByTestId(testIds.packageDetailsButton),

  /** "Buy now" CTA in the sticky checkout bar. */
  buyNowButton: (page: Page): Locator => page.getByTestId(testIds.buyNowButton),

  /**
   * Sticky checkout bar shown once a package is selected — the innermost
   * container holding both the "Package details" button and the "Buy now"
   * CTA, so the Total price inside it is unambiguous.
   */
  packageDetailsBar: (page: Page): Locator =>
    page
      .locator('div')
      .filter({ has: page.getByTestId(testIds.packageDetailsButton) })
      .filter({ has: page.getByTestId(testIds.buyNowButton) })
      .last(),

  /** Total price shown in the checkout bar next to "Package details". */
  packageDetailsTotalPrice: (page: Page): Locator =>
    plansLocators.packageDetailsBar(page).getByTestId(testIds.price),
};
