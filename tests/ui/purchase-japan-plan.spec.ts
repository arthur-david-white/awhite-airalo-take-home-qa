import { test } from '../../fixtures';

test.describe('Airalo eSIM purchase flow', () => {
  test('Purchase 7 Day Japan Plan', async ({ homePage, plansPage }) => {
    const destination = 'Japan';
    const validity = '7 days';

    // 1: Open the webpage
    await homePage.open();

    // 2: Type Japan into the search field
    await homePage.searchFor(destination);

    // 3: The dropdown should contain valid results — verify Japan is present
    //    by its flag, then click it
    await homePage.expectSearchResultWithFlag(destination);
    await homePage.selectSearchResult(destination);

    // 4: Validate we are on the plan selection page
    await plansPage.expectLoadedFor(destination);

    // 5: Find and click the 7 day package (capturing its advertised price)
    const advertisedPrice = await plansPage.selectPackage(validity);

    // 6: The price shown next to Package details must match the price shown
    //    in the actual package
    await plansPage.expectPackageDetailsPrice(advertisedPrice);
  });
});
