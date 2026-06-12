---
name: create-ui-test
description: >-
  Create a new Airalo UI test from a detailed set of test steps. Use when the
  user provides a test case / scenario / list of steps to automate against the
  Airalo web app. Steps may include identifiers; if not, the live app is
  explored with Playwright to find proper locators. Produces locators in
  pages/locators/, reusable page functions, and an orchestrating spec.
---

# create-ui-test

Turn a detailed set of manual test steps into an automated Playwright test
that follows this repo's architecture. The system under test is ALWAYS the
Airalo web app (`AIRALO_WEB_BASE_URL`, https://www.airalo.com) — the `ui`
Playwright project.

## Input

A detailed list of test steps (numbered or prose). Steps MAY include
identifiers (selectors, test ids, accessible names). Treat provided
identifiers as hints — verify them against the live app before trusting them.
If anything about the expected behaviour is ambiguous, say what you assumed.

## Workflow

### 1. Inventory existing code first

Read `pages/CLAUDE.md` and `tests/CLAUDE.md` (and the files they point to).
Then decide, step by step:

- Which existing page functions / locators cover a step → reuse them as-is.
- Which existing functions almost cover a step → extend them generically
  (add a parameter, not a fork) rather than duplicating.
- Whether an existing spec already covers some or all of the scenario →
  still build what was asked, but FLAG the overlap in your final summary so
  the user can decide whether to consolidate.

Never write a new locator or function without checking for an existing one.

### 2. Discover locators on the live app

For any step without a verified identifier:

1. Write a temporary exploration spec `tests/ui/_explore.spec.ts` that
   drives the flow with the existing page functions as far as they go, then
   dumps evidence: `await page.locator('main').ariaSnapshot()` for structure,
   targeted `evaluate(el => el.outerHTML)` for attributes/test ids.
2. Run it: `npx playwright test tests/ui/_explore.spec.ts --project=ui`.
3. Iterate until every locator is grounded in the real DOM — never guess
   selectors, and never trust unverified identifiers from the input.
4. DELETE `_explore.spec.ts` before committing.

If a step's element only appears after interaction (dropdowns, dialogs,
checkout bars), explore that state, not just the initial page load.

### 3. Locator policy (enforced)

Priority order — use the highest that works:

1. `getByRole(role, { name })` — first choice, user-facing and resilient.
2. `getByTestId(...)` — Airalo ships `data-testid` hooks; prefer them over
   any CSS.
3. `getByLabel` / `getByPlaceholder` / `getByAltText` / `getByText`
   (use `exact: true` where ambiguity is possible).
4. Scoped CSS only when 1–3 cannot work: stable ids
   (`#onetrust-accept-btn-handler`) or semantic attributes
   (`img[alt="Japan"]`). Never utility/generated classes
   (`.typography-title-4`, `.p-inputtext`).
5. XPath and positional selectors (`.nth(n)`, `:nth-child`) are FORBIDDEN
   unless there is genuinely no alternative. If forced:
   - add a code comment at the locator explaining exactly why nothing
     better works, and
   - call it out explicitly in the final summary for human review.

Disambiguate with `.filter({ has, hasText, visible: true })`, not position.

### 4. Implement in the right layers

- **Identifiers** → `pages/locators/<page>.locators.ts` (locator factory
  functions taking `Page` plus any parameters). New page → new locators file.
- **Behaviour** → page class in `pages/`: generic action functions and
  `expect*` verification methods (assertions WITH meaningful messages live
  here, not in specs). Wrap actions in the inherited `step()` helper.
  Page functions take parameters (destination, term, validity, ...) — never
  hardcode scenario data in a page object.
- **New page object?** Extend `BasePage`, register a fixture in
  `fixtures/pages.fixtures.ts`, and add it to `PageFixtures`.
- **Spec** → `tests/ui/<scenario>.spec.ts`: imports from `../../fixtures`,
  reads as the numbered steps from the input (use comments matching the
  step numbers), holds scenario data as consts, and calls page functions
  only. Parameterise with a `for` loop when the same flow runs for several
  data values — each iteration is its own test.

### 5. Verify before declaring done

1. `npm run typecheck` — must be clean.
2. `npx playwright test <new spec> --project=ui` — must pass.
3. Re-run with `--repeat-each=2` to catch flake (hydration/timing issues are
   common on this site; reuse `searchFor()`-style `toPass()` retries for
   hydration-sensitive interactions instead of `waitForTimeout`).
4. Confirm `_explore.spec.ts` is deleted.

### 6. Keep the inventories current

Update `pages/CLAUDE.md` (new/changed functions and locators) and
`tests/CLAUDE.md` (new spec and what it covers) so the next run of this
skill finds accurate information.

## Output summary (always include)

- What was reused vs newly created, and why.
- Any overlap with existing specs/functions that was found, and what you did
  about it.
- Any locator below priority 3, with its justification (XPath/positional
  requires explicit explanation).
- Verification results (typecheck + test runs).
