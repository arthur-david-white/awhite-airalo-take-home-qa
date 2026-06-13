import { expect, type Locator, type Page } from '@playwright/test';
import type { AiraloApiClient } from '../services/airalo-api-client';
import { BasePage } from './base.page';
import { homeLocators } from './locators/home.locators';
import { escapeRegExp } from './locators/locator.utils';

/** Airalo website home page (https://www.airalo.com/). */
export class HomePage extends BasePage {
  protected readonly path = '/';

  /** Hero search box ("Where do you need an eSIM?"). */
  readonly searchInput: Locator;
  /** Destination results dropdown that opens under the search box. */
  readonly searchResults: Locator;
  /** Destination cards in the "eSIMs for popular locations" section. */
  readonly popularDestinationCards: Locator;

  constructor(page: Page, api: AiraloApiClient) {
    super(page, api);
    this.searchInput = homeLocators.searchInput(page);
    this.searchResults = homeLocators.searchResults(page);
    this.popularDestinationCards = homeLocators.popularDestinationCards(page);
  }

  /** A destination entry in the search dropdown, e.g. searchResult('Japan'). */
  searchResult(destination: string): Locator {
    return homeLocators.searchResult(this.page, destination);
  }

  /** The flag image shown beside a destination in the search dropdown. */
  searchResultFlag(destination: string): Locator {
    return homeLocators.searchResultFlag(this.page, destination);
  }

  /**
   * Type a destination into the hero search box until the results dropdown
   * opens. The search box is hydrated client-side after page load, so
   * keystrokes sent too early are silently swallowed — type-and-check is
   * retried as a single unit until the dropdown actually appears.
   */
  async searchFor(term: string): Promise<void> {
    await this.step(`search for "${term}"`, async () => {
      await expect(async () => {
        await this.searchInput.click();
        await this.searchInput.fill('');
        await this.searchInput.pressSequentially(term, { delay: 50 });
        // Hydration can swallow individual keystrokes, leaving a partial
        // term that opens the dropdown with wrong results — verify the full
        // term landed before trusting the dropdown.
        await expect(this.searchInput).toHaveValue(term, { timeout: 2_000 });
        await expect(this.searchResults).toBeVisible({ timeout: 4_000 });
      }).toPass({ timeout: 30_000 });
    });
  }

  /**
   * Verify the search dropdown is open and the destination is listed,
   * identified by its flag image.
   */
  async expectSearchResultWithFlag(destination: string): Promise<void> {
    await this.step(`verify "${destination}" is listed with its flag`, async () => {
      await expect(
        this.searchResults,
        'Search dropdown should open with destination results',
      ).toBeVisible();
      await expect(
        this.searchResultFlag(destination),
        `${destination} should appear in the search results with its flag`,
      ).toBeVisible();
    });
  }

  /**
   * Verify the search dropdown is open and reports "No results" — used for
   * invalid or unmatched search terms.
   */
  async expectNoSearchResults(): Promise<void> {
    await this.step('verify search reports "No results"', async () => {
      await expect(
        this.searchResults,
        'Search dropdown should open even for an unmatched term',
      ).toBeVisible();
      await expect(
        homeLocators.searchNoResults(this.page),
        'Dropdown should show "No results" for an unmatched search term',
      ).toBeVisible();
    });
  }

  /** Click a destination in the search results dropdown. */
  async selectSearchResult(destination: string): Promise<void> {
    await this.step(`select "${destination}" from search results`, async () => {
      await this.searchResult(destination).click();
    });
  }

  /**
   * Verify every destination card in the "eSIMs for popular locations"
   * section shows its price in the given currency symbol, e.g. '¥'.
   */
  async expectPopularDestinationPricesIn(currencySymbol: string): Promise<void> {
    await this.step(`verify popular destination prices use "${currencySymbol}"`, async () => {
      await expect(
        this.popularDestinationCards.first(),
        'Popular locations section should list destination cards',
      ).toBeVisible();

      const pricePattern = new RegExp(`${escapeRegExp(currencySymbol)}\\s?[\\d.,]+`);
      // Iterating the collection (not positional disambiguation): every card
      // must show a price in the selected currency.
      const count = await this.popularDestinationCards.count();
      for (let i = 0; i < count; i++) {
        await expect(
          this.popularDestinationCards.nth(i),
          `Popular destination card ${i + 1} of ${count} should show its price in ${currencySymbol}`,
        ).toContainText(pricePattern);
      }
    });
  }
}
