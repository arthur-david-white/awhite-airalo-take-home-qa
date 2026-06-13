import { test } from '../../fixtures';

const destination = 'Japan';
const validities = ['3 days', '7 days', '30 days'] as const;

test.describe('Airalo eSIM purchase flow', () => {
  for (const validity of validities) {
    test(`Purchase ${validity} ${destination} Plan`, async ({ homePage, plansPage }) => {
      // 1: Open Airalo's website
      await homePage.open();

      // 2: Search for the destination, then click the result with its flag
      await homePage.searchFor(destination);
      await homePage.expectSearchResultWithFlag(destination);
      await homePage.selectSearchResult(destination);

      // 3: Select an unlimited eSIM package on the plan-selection page -
      //    click the unlimited data plan tab, then select the chosen validity
      await plansPage.expectLoadedFor(destination);
      await plansPage.selectPlanType('Unlimited');
      const advertisedPrice = await plansPage.selectPackage(validity);

      // 4: Verify the package price matches the price next to the Buy now button
      await plansPage.expectBuyNowPriceMatches(advertisedPrice);
    });
  }
});
