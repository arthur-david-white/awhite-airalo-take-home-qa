import { test } from '../../fixtures';

const currency = { code: 'JPY', symbol: '¥' };

test.describe('Airalo currency selection', () => {
  test('Selecting Japanese Yen prices popular locations in Yen', async ({ homePage }) => {
    // 1: Open the airalo website
    await homePage.open();

    // 2–4: Find the currency conversion button, click it, select Japanese Yen
    await homePage.selectCurrency(currency.code);

    // 5: Validate Yen has been selected by checking the currency used in the
    //    "eSIMs for popular locations" section
    await homePage.expectPopularDestinationPricesIn(currency.symbol);
  });
});
