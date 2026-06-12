import { test } from '../../fixtures';

const destination = 'Japan';
const validities = ['3 days', '7 days', '30 days'] as const;

test.describe('Airalo eSIM purchase flow', () => {
  for (const validity of validities) {
    test(`Purchase ${validity} ${destination} Plan`, async ({ homePage, plansPage }) => {
      // 1: Open the webpage
      await homePage.open();

      // 2: Type the destination into the search field
      await homePage.searchFor(destination);

      // 3: The dropdown should contain valid results — verify the destination
      //    is present by its flag, then click it
      await homePage.expectSearchResultWithFlag(destination);
      await homePage.selectSearchResult(destination);

      // 4: Validate we are on the plan selection page
      await plansPage.expectLoadedFor(destination);

      // 5: Find and click the package (capturing its advertised price)
      const advertisedPrice = await plansPage.selectPackage(validity);

      // 6: The price shown next to Package details must match the price shown
      //    in the actual package
      await plansPage.expectPackageDetailsPrice(advertisedPrice);
    });
  }
});
