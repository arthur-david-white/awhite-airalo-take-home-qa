import { HomePage } from '../pages/home.page';
import { test as apiTest } from './api.fixtures';

export interface PageFixtures {
  homePage: HomePage;
}

/**
 * Page-object fixtures. Each page object is constructed here with the
 * authenticated Airalo API client injected, so specs never write
 * `new SomePage(page)` themselves.
 */
export const test = apiTest.extend<PageFixtures>({
  homePage: async ({ page, api }, use) => {
    await use(new HomePage(page, api));
  },
});
