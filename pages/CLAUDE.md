# pages/ - Page Object inventory

Behaviour lives in page classes; identifiers live in `locators/*.locators.ts`.
**Keep this inventory current** - update it whenever functions or locators are
added or changed, so agents and humans can find reusable code before writing
new code.

## BasePage (`base.page.ts`) - abstract, all pages extend it

- Holds `page: Page` and an injected `api: AiraloApiClient` (for API state
  setup; BasePage holds the reference only).
- `open()` - goto `this.path` + dismiss cookie banner.
- `step(title, body)` - wraps actions in a named `test.step` (use in every
  page function).
- `dismissCookieBanner(timeoutMs?)` - OneTrust banner: clicks Accept if shown
  and waits until it has fully disappeared.
- `selectCurrency(currencyCode)` - header currency dialog: opens it
  (hydration-safe retry), picks the option by ISO code (e.g. 'JPY'), waits
  for the dialog to close. Works on every page.
- Locators: `locators/base.locators.ts` - `cookieBanner`,
  `cookieAcceptButton`, `currencyButton`, `currencyDialog`,
  `currencyOption(code)`.

## HomePage (`home.page.ts`) - fixture: `homePage`, path `/`

- Locator properties: `searchInput` (hero search box), `searchResults`
  (dropdown listbox).
- `searchResult(destination)` / `searchResultFlag(destination)` - dropdown
  entry / its flag image (flag alt text = destination name).
- `searchFor(term)` - types into hero search with hydration-safe
  `toPass()` retry until the dropdown opens. Works for no-result terms too.
- `expectSearchResultWithFlag(destination)` - dropdown open + destination
  present, identified by flag.
- `expectNoSearchResults()` - dropdown shows exact text "No results".
- `selectSearchResult(destination)` - clicks a dropdown entry.
- `popularDestinationCards` - destination cards ("Select <Destination>"
  links) in the "eSIMs for popular locations" section.
- `expectPopularDestinationPricesIn(currencySymbol)` - every popular
  destination card shows its price in the given symbol (e.g. '¥').
- Locators: `locators/home.locators.ts`. Shared regex escaping:
  `locators/locator.utils.ts`.

## PlansPage (`plans.page.ts`) - fixture: `plansPage`

Destination plan-selection page (`/japan-esim`, `/united-kingdom-esim`, ...)
including the sticky checkout bar shown after selecting a package. Fully
generic - parameterised by destination and package validity.

- Locator properties: `heading` (h1, "<Destination> eSIMs"),
  `packageDetailsButton`, `buyNowPrice` (Total in checkout bar, next to Buy
  now), `buyNowButton`.
- `routeFor(destination)` / `urlFor(destination)` - '/japan-esim' route and
  URL assertion pattern. `openFor(destination)` - direct navigation.
- `planTypeTab(tabName)` / `selectPlanType(tabName)` - data-plan-type tab
  ('Unlimited' / 'Standard') locator and a click-and-verify-selected action.
- `packageCard(validity)` / `packagePrice(validity)` - package button (e.g.
  '7 days') and its advertised price.
- `expectLoadedFor(destination)` - URL + heading verification.
- `selectPackage(validity)` - verifies offered, clicks, RETURNS the
  advertised price string for later comparison.
- `expectBuyNowPriceMatches(expectedPrice)` - checkout bar visible and the
  Total next to the Buy now button matches.
- Locators: `locators/plans.locators.ts` (uses Airalo `data-testid` hooks:
  `price_amount`, `store-operator-details_plan-details-button`,
  `cart-navigation_select-package-cta`).

## Conventions

- New page object: extend `BasePage`, create `locators/<page>.locators.ts`,
  register a fixture in `fixtures/pages.fixtures.ts`, document it here.
- Locator priority: getByRole > getByTestId > getByLabel/Placeholder/AltText/
  Text > scoped CSS. No XPath/positional selectors without a justifying
  comment.
- Verification methods are `expect*` prefixed and carry assertion messages.
