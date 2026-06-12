import { test } from '../../fixtures';

test.describe('Airalo destination search', () => {
  test('Searching UK lands on the United Kingdom plans page', async ({
    homePage,
    plansPage,
  }) => {
    const searchTerm = 'UK';
    const destination = 'United Kingdom';

    await homePage.open();
    await homePage.searchFor(searchTerm);
    await homePage.expectSearchResultWithFlag(destination);
    await homePage.selectSearchResult(destination);
    await plansPage.expectLoadedFor(destination);
  });

  test('Searching an invalid term shows "No results"', async ({ homePage }) => {
    await homePage.open();
    await homePage.searchFor('Atlantis123');
    await homePage.expectNoSearchResults();
  });
});
