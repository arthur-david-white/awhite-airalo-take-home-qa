# awhite-airalo-take-home-qa

Playwright + TypeScript test framework for **Airalo** — covering both the
website (UI) and the **Partner API** in a single project. It implements the
two take-home exercises (a Japan unlimited-eSIM purchase journey and an
order → get-eSIM API flow) on top of a reusable Page Object / service-object
foundation, plus extra UI coverage (search, currency). See
[Test coverage & approach](#test-coverage--approach) for how each exercise
maps to the code.

## Setup

```bash
npm install
npx playwright install chromium
cp .env.example .env   # then fill in AIRALO_CLIENT_ID / AIRALO_CLIENT_SECRET
```

All base URLs and credentials come from `.env` (see `.env.example`). The real
`.env` is gitignored — never commit credentials.

| Variable | Purpose | Default |
| --- | --- | --- |
| `AIRALO_WEB_BASE_URL` | Airalo website under test | `https://www.airalo.com` |
| `AIRALO_API_BASE_URL` | Partner API root (incl. `/v2`) | `https://partners-api.airalo.com/v2` |
| `AIRALO_CLIENT_ID` | OAuth2 client id | — (required for API) |
| `AIRALO_CLIENT_SECRET` | OAuth2 client secret | — (required for API) |

## Running tests

```bash
npm test           # everything (ui + api)
npm run test:ui    # website suite only (chromium)
npm run test:api   # Partner API suite only (no browser)
npm run report     # open the HTML report
npm run typecheck  # tsc --noEmit
```

The UI suite runs without Partner API credentials; the API suite requires them
(the token fixture defers the failure to first API use with a clear message).

## Architecture

```
playwright.config.ts   # central config: ui + api projects, timeouts, retries
env.ts                 # .env loading; the single source of Airalo env values
/fixtures/             # test = base test + auth/api/page-object fixtures
  api.fixtures.ts      #   airaloAuthToken (worker-scoped), apiContext, api, packagesApi
  pages.fixtures.ts    #   page objects constructed with the api client injected
/services/             # API layer
  airalo-api-client.ts #   AiraloApiClient: single send() core + get/post/put/patch/delete
  airalo-auth.ts       #   OAuth2 client_credentials exchange (POST /v2/token) + token cache
  packages.service.ts  #   example service object pattern
  orders.service.ts    #   Submit order (POST /orders)
  sims.service.ts      #   Get eSIM (GET /sims/{iccid})
/pages/                # UI layer (Page Object Model) — behaviour only
  base.page.ts         #   BasePage: navigation, logged steps, cookie banner, currency; holds api handle
  home.page.ts         #   home page: generic search + popular-locations helpers
  plans.page.ts        #   destination plans page: generic plan-type/package selection + prices
  locators/            #   identifiers, one file per page (locator factories)
/tests/ui/             # UI specs (assertions live here)
  purchase-japan-plan.spec.ts  #   exercise 1: Japan unlimited purchase journey (3/7/30 days)
  search.spec.ts               #   UK search + no-results handling
  currency-selection.spec.ts   #   currency switch (JPY) pricing
  home.smoke.spec.ts           #   plumbing smoke
/tests/api/            # API specs
  order-esims.spec.ts          #   exercise 2: submit order for 6 eSIMs → get each eSIM
  packages.smoke.spec.ts       #   auth + plumbing smoke
```

Key decisions:

- **Two Playwright projects.** `ui` runs chromium against the website; `api`
  omits `browserName` entirely and runs as a pure HTTP client against the
  Partner API. Each is runnable independently via `--project`.
- **Worker-scoped auth.** `airaloAuthToken` performs Airalo's real OAuth2
  `client_credentials` exchange (`POST /v2/token`, form-urlencoded, token in
  `data.access_token` — verified against the
  [Airalo Partner API docs](https://developers.partners.airalo.com/request-access-token-11883021e0))
  **once per worker**. The endpoint is rate limited and tokens last 24h, so
  per-test exchanges would both throttle and waste time.
- **One request code path.** Every API call funnels through
  `AiraloApiClient.send()`, which owns the base URL, bearer header, default
  headers and error context. Service objects stay thin and never touch
  `APIRequestContext` directly.
- **Page objects via fixtures.** Specs receive constructed page objects
  (`homePage`) with the authenticated API client injected, so pages can seed
  state through the API. `BasePage` holds only high-value helpers — no 1:1
  wrappers around `locator.click()/fill()`, because Playwright locators
  already auto-wait.
- **Web-first assertions** with meaningful messages in all UI specs.

## Test coverage & approach

### Exercise 1 — UI: purchase a 7-day unlimited Japan eSIM

[`tests/ui/purchase-japan-plan.spec.ts`](tests/ui/purchase-japan-plan.spec.ts)

1. **Open** the website (`homePage.open()` — also clears the OneTrust cookie
   banner and waits for it to disappear).
2. **Search "Japan"** and click the result **identified by its flag**
   (`searchFor` → `expectSearchResultWithFlag` → `selectSearchResult`). The
   search box hydrates client-side, so `searchFor` retries typing until the
   dropdown opens and the full term landed.
3. **Select the unlimited package** — assert the plans page loaded
   (`expectLoadedFor`), **click the Unlimited data-plan tab**
   (`selectPlanType('Unlimited')`), then select the package by validity
   (`selectPackage('7 days')`), which returns the price advertised on the card.
4. **Verify the price** advertised on the card matches the Total shown **next
   to the Buy now button** (`expectBuyNowPriceMatches`).

The spec is parameterised over `3 / 7 / 30 days` (each a separate test) to
show the page functions are generic; the brief's exact case is the 7-day run.
Verification logic lives in the page objects; the spec reads as the steps.

### Exercise 2 — API: submit an order and retrieve every eSIM

[`tests/api/order-esims.spec.ts`](tests/api/order-esims.spec.ts)

1. **Authenticate** via the worker-scoped OAuth2 fixture (token reused, see
   above) before any request is made.
2. **Submit order** (`ordersApi.submit`) — POST `/orders` for **6 eSIMs** of
   `moshi-moshi-7days-1gb`.
3. **Get eSIM** (`simsApi.get`) — GET `/sims/{iccid}?include=order` for **each**
   eSIM returned by the order.
4. **Validate responses** on three levels, as required:
   - **Status codes** — 200 on every request.
   - **Message** — `meta.message === "success"` on both endpoints.
   - **Response body** — order fields match the request (package, quantity,
     type); exactly 6 unique, well-formed eSIMs; and each fetched eSIM's
     identity fields and its included order match what the submit returned.

> Note: the submit-order endpoint creates a **real order** on the partner
> account each run. The HTTP client transparently retries the endpoint's rate
> limit (HTTP 429, honouring `Retry-After`).

## QE-Agent & skills (Claude Code)

The repo ships agent tooling for Claude Code under `.claude/`:

- **QE-Agent** (`.claude/agents/qe-agent.md`) — a senior QA automation agent
  that knows this framework's conventions and how to explore the live Airalo
  app with Playwright to discover locators.
- **/create-ui-test** (`.claude/skills/create-ui-test/SKILL.md`) — give it a
  detailed set of test steps (identifiers optional) and it produces locators
  in `pages/locators/`, reusable page functions and an orchestrating spec.
  It enforces the locator policy (role/test-id first, XPath forbidden unless
  justified and flagged), checks `pages/CLAUDE.md` / `tests/CLAUDE.md` for
  existing functions to reuse, flags coverage overlap, and verifies with
  typecheck + repeated runs.
- **/create-api-test** (`.claude/skills/create-api-test/SKILL.md`) — give it
  a specific set of API requests (endpoints, data, expected validations) and
  it produces service objects, fixtures and a spec validating status codes,
  response messages and bodies. It reuses existing services first
  (`services/CLAUDE.md`), verifies endpoint shapes against the official
  Airalo docs when unsure, asks for clarification rather than guessing vague
  scenarios, and is careful with endpoints that create real orders.
