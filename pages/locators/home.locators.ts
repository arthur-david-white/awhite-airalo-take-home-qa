import type { Locator, Page } from '@playwright/test';

/**
 * Identifiers for the Airalo home page. Locators live here; behaviour lives
 * in pages/home.page.ts.
 */
export const homeLocators = {
  /** Hero search box ("Where do you need an eSIM?"). */
  searchInput: (page: Page): Locator => page.getByRole('textbox', { name: 'Search store' }),

  /** Dropdown of destination results that opens under the search box. */
  searchResults: (page: Page): Locator => page.getByRole('listbox'),

  /** A destination entry (link) in the search dropdown, matched by its flag image. */
  searchResult: (page: Page, destination: string): Locator =>
    homeLocators
      .searchResults(page)
      .locator('a', { has: page.locator(`img[alt="${destination}"]`) }),

  /** Flag image shown beside a destination in the search dropdown. */
  searchResultFlag: (page: Page, destination: string): Locator =>
    homeLocators.searchResults(page).locator(`img[alt="${destination}"]`),

  /** "No results" message shown in the dropdown for an unmatched search term. */
  searchNoResults: (page: Page): Locator =>
    homeLocators.searchResults(page).getByText('No results', { exact: true }),

  /**
   * Destination cards in the "eSIMs for popular locations" section — links
   * named "Select <Destination>" whose text includes the price in the active
   * currency (e.g. "Japan ¥700").
   */
  popularDestinationCards: (page: Page): Locator =>
    page.getByRole('link', { name: /^Select / }),
};
