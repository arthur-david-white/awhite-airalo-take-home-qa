# tests/ — Spec inventory

Specs orchestrate steps only: scenario data as consts, page-object calls, no
inline locators or assertion logic (that lives in page `expect*` methods).
Import `test`/`expect` from `../../fixtures`. **Keep this inventory current**
when specs are added or changed.

## tests/ui/ (project: `ui`, chromium vs https://www.airalo.com)

- `home.smoke.spec.ts` — trivial smoke: home page loads, branded title, hero
  search visible.
- `search.spec.ts` — destination search suite:
  - "UK" search lands on the United Kingdom plans page (flag-verified
    dropdown selection, URL + heading checks).
  - invalid term ("Atlantis123") shows "No results" in the dropdown.
- `currency-selection.spec.ts` — header currency switcher: select Japanese
  Yen (JPY), validate every card in the "eSIMs for popular locations"
  section prices in ¥.
- `purchase-japan-plan.spec.ts` — purchase flow, parameterised over
  validities `3 days` / `7 days` / `30 days` (one separate test per value):
  search Japan → flag-verified select → plans page → select package →
  checkout-bar Total matches the advertised card price.

## tests/api/ (project: `api`, no browser, vs Partner API /v2)

- `packages.smoke.spec.ts` — auth + plumbing smoke: authenticated
  GET /packages returns 200 with a data array.
- `order-esims.spec.ts` — order flow: POST /orders for 6×
  `moshi-moshi-7days-1gb` (validates status, meta.message, order fields,
  6 unique well-formed sims), then GET /sims/{iccid}?include=order for each
  sim (validates identity fields match the order and simable = our order).
  NOTE: each run submits a REAL order on the partner account.

## Conventions

- One scenario per spec file, named `<scenario>.spec.ts`.
- Data-driven variants: `for` loop over a const array — each iteration is a
  separate test.
- Comment spec bodies with the original manual step numbers where they exist.
- Temporary exploration specs (`_explore.spec.ts`) must never be committed.
