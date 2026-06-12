import type { Locator, Page } from '@playwright/test';
import type { AiraloApiClient } from '../services/airalo-api-client';
import { BasePage } from './base.page';

/** Airalo website home page (https://www.airalo.com/). */
export class HomePage extends BasePage {
  protected readonly path = '/';

  /** Hero search box ("Where do you need an eSIM?") used to find eSIMs by destination. */
  readonly searchInput: Locator;

  constructor(page: Page, api: AiraloApiClient) {
    super(page, api);
    this.searchInput = page.getByRole('textbox', { name: 'Search store' });
  }
}
