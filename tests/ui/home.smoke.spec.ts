import { expect, test } from '../../fixtures';

/**
 * Trivial UI smoke spec — proves the ui project, page-object fixture and
 * BasePage navigation plumbing work. Real UI test cases come later.
 */
test.describe('Airalo website smoke', () => {
  test('home page loads', async ({ homePage, page }) => {
    await homePage.open();

    await expect(page, 'Airalo home page should load with a branded title').toHaveTitle(
      /airalo/i,
    );
    await expect(
      homePage.searchInput,
      'Hero destination search should be visible on the home page',
    ).toBeVisible();
  });
});
