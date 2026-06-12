# awhite-airalo-take-home-qa

Playwright + TypeScript test framework for **Airalo** — covering both the
website (UI) and the **Partner API** in a single project. This is the reusable
foundation; only one trivial smoke spec per suite exists to prove the plumbing.

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
  airalo-auth.ts       #   OAuth2 client_credentials exchange (POST /v2/token)
  packages.service.ts  #   example service object pattern
/pages/                # UI layer (Page Object Model) — behaviour only
  base.page.ts         #   BasePage: navigation, logged steps, cookie banner; holds api handle
  home.page.ts         #   home page: generic search functions
  plans.page.ts        #   destination plans page: generic package selection + prices
  locators/            #   identifiers, one file per page (locator factories)
/tests/ui/             # UI specs (assertions live here)
/tests/api/            # API specs
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
