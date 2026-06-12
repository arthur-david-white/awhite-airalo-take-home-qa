# CLAUDE.md

Playwright + TypeScript framework testing Airalo: the website (UI) and the
Partner API, as two independent Playwright projects in one repo.

## Agent & skills

- `.claude/agents/qe-agent.md` — **QE-Agent**: senior QA automation agent for
  this repo. Delegate test-creation/extension work to it.
- `.claude/skills/create-ui-test/SKILL.md` — **/create-ui-test**: turns a
  detailed set of manual test steps into an automated UI test following the
  repo architecture (locator policy enforced, live-app exploration, reuse
  checks against `pages/CLAUDE.md` and `tests/CLAUDE.md`).
- Directory inventories: `pages/CLAUDE.md` (page objects, functions,
  locators) and `tests/CLAUDE.md` (specs and coverage). Keep them current
  whenever pages or specs change — agents rely on them to avoid duplicating
  code.

## Commands

```bash
npm test               # run both suites
npm run test:ui        # website suite (chromium)
npm run test:api       # Partner API suite (no browser)
npm run typecheck      # tsc --noEmit (strict mode)
npm run report         # open HTML report
npx playwright test tests/api/packages.smoke.spec.ts   # single file
```

API tests need `AIRALO_CLIENT_ID` / `AIRALO_CLIENT_SECRET` in `.env`
(copy `.env.example`). UI tests run without credentials.

## Structure

- `playwright.config.ts` — central config; `ui` and `api` projects. `api`
  deliberately omits `browserName` (pure APIRequestContext).
- `env.ts` — the only place `.env` / `process.env` is read.
- `fixtures/` — `api.fixtures.ts` (worker-scoped `airaloAuthToken` OAuth2
  exchange, `apiContext`, `api` client, `packagesApi`), `pages.fixtures.ts`
  (page objects), `index.ts` (the `test`/`expect` specs import).
- `services/` — `AiraloApiClient` (single `send()` core + verb helpers),
  `airalo-auth.ts` (token exchange, endpoint verified against Airalo docs),
  one service object per API area (see `packages.service.ts`).
- `pages/` — `BasePage` + page objects. Page objects receive the `api` client
  via constructor injection from the fixture. Identifiers live in
  `pages/locators/*.locators.ts` (one file per page, locator factory
  functions); page classes hold behaviour only.
- `tests/ui/`, `tests/api/` — specs import from `../../fixtures`, never
  `@playwright/test` directly.

## Conventions

- Strict TypeScript; path aliases `@pages/*`, `@services/*`, `@fixtures/*`, `@env`.
- Never hardcode URLs or credentials — everything comes from `env.ts`.
- Never `new SomePage(page)` in specs — add a fixture in `pages.fixtures.ts`.
- Locators (selectors, test ids, roles/names) go in `pages/locators/`, never
  inline in page classes or specs. Page functions are generic — take the
  search term / destination / package validity as parameters, no hardcoded
  "Japan" in page objects.
- Keep test logic out of specs: reusable verification lives in page-object
  `expect*` methods (with meaningful assertion messages); specs orchestrate
  the steps and read as the scenario.
- Service objects call `AiraloApiClient`, never `APIRequestContext` directly.
- No thin wrappers around `locator.click()/fill()` in page objects; expose
  `Locator`s and use Playwright's API. BasePage helpers are for genuinely
  shared behaviour only (navigation, `step()` logging, cookie banner).
- Web-first assertions (`await expect(locator)...`) with assertion messages.
- The OAuth2 token endpoint shape lives ONLY in `services/airalo-auth.ts`;
  if Airalo's auth changes, fix it there.
- Git commits: plain messages, no AI attribution/co-author lines.
