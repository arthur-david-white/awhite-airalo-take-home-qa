import { expect, test } from '../../fixtures';

test.describe('Airalo eSIM purchase flow', () => {
  test('Purchase 7 Day Japan Plan', async ({ homePage, plansPage, page }) => {
    const destination = 'Japan';
    const validity = '7 days';

    // 1: Open the webpage
    await homePage.open();

    // 2: Type Japan into the search field
    await homePage.searchFor(destination);

    // 3: The dropdown should contain valid results — verify Japan is present
    //    by its flag, then click it
    await expect(
      homePage.searchResults,
      'Search dropdown should open with destination results',
    ).toBeVisible();
    await expect(
      homePage.searchResultFlag(destination),
      `${destination} should appear in the search results with its flag`,
    ).toBeVisible();
    await homePage.selectSearchResult(destination);

    // 4: Validate we are on the plan selection page
    await expect(page, `Should land on the ${destination} plans page`).toHaveURL(
      plansPage.urlFor(destination),
    );
    await expect(
      plansPage.heading,
      'Plans page heading should name the destination',
    ).toHaveText(new RegExp(`${destination} eSIMs`, 'i'));

    // 5: Find and click the 7 day package
    await expect(
      plansPage.packageCard(validity),
      `A ${validity} package should be offered for ${destination}`,
    ).toBeVisible();
    const advertisedPrice = (await plansPage.packagePrice(validity).innerText()).trim();
    await plansPage.selectPackage(validity);

    // 6: The price shown next to Package details must match the price shown
    //    in the actual package
    await expect(
      plansPage.packageDetailsButton,
      'Package details should be shown after selecting a package',
    ).toBeVisible();
    await expect(
      plansPage.packageDetailsTotalPrice,
      `Total next to Package details should match the advertised ${validity} package price`,
    ).toHaveText(advertisedPrice);
  });
});
