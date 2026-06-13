---
name: create-api-test
description: >-
  Create a new Airalo Partner API test from a specific set of API requests.
  Use when the user lists the requests to make (endpoints, sequence, payloads)
  and what to validate. Reuses existing service objects first; verifies
  endpoint shapes against the official Airalo Partner API docs when unsure.
  Produces service objects, fixtures and an orchestrating spec.
---

# create-api-test

Turn a specific set of API requests into an automated Playwright API test
following this repo's architecture. The system under test is ALWAYS the
Airalo Partner API (`AIRALO_API_BASE_URL`, https://partners-api.airalo.com/v2)
- the `api` Playwright project (no browser, pure `APIRequestContext`).

## Input - the requester must be specific

A concrete list of requests to make and what to validate, e.g.:

- endpoint + method (or the doc page name, e.g. "Submit order"),
- request data (package ids, quantities, query params),
- expected status codes, response messages and body properties.

Provided endpoint details are hints - verify them before trusting them.
If the input is too vague to know WHICH requests to make or WHAT to assert
(e.g. "test orders somehow"), do not guess the intent: state precisely what
is missing and ask the requester to clarify. Searching the docs is for
filling in endpoint *shapes*, not for inventing the requester's *scenario*.

## Workflow

### 1. Inventory existing code first

Read `services/CLAUDE.md` and `tests/CLAUDE.md` (and the files they point
to), plus `fixtures/api.fixtures.ts`. Then decide, request by request:

- An existing service method covers it → reuse it as-is.
- An existing service almost covers it → extend generically (add an optional
  parameter or a sibling method on the same service), don't fork.
- A new API area → new service object following the existing pattern.
- An existing spec already covers some or all of the scenario → still build
  what was asked, but FLAG the overlap in your final summary.

Never call `APIRequestContext` directly from a spec or service - everything
goes through `AiraloApiClient`.

### 2. Verify endpoint shapes against the docs

For any endpoint not already implemented by a service:

1. Check the official docs at https://developers.partners.airalo.com/
   (search the web for "Airalo Partner API <endpoint name>" if you don't
   have the URL). Confirm: method, path, content type (Airalo mixes
   multipart/form-data, urlencoded and query params), parameter names,
   response envelope (`data` + `meta.message`) and error codes.
2. Record the doc URL in the service's JSDoc (see OrdersService/SimsService
   for the pattern).
3. Never invent paths, parameter names or response fields. If the docs are
   unreachable AND the requester didn't supply the shape, quarantine the
   assumption in one commented method and say so in the summary - same rule
   as the auth flow used when this framework was built.

### 3. Implement in the right layers

- **Service objects** → `services/<area>.service.ts`: one class per API
  area, constructor takes `AiraloApiClient`, methods map 1:1 to endpoints
  and return `APIResponse` (tests assert status codes themselves). Define
  typed request/response interfaces in the same file - type the fields the
  tests assert on; don't transcribe whole doc payloads speculatively.
- **Fixtures** → register the service in `fixtures/api.fixtures.ts`
  (`ApiFixtures` interface + fixture entry) so specs receive it injected.
- **Spec** → `tests/api/<scenario>.spec.ts`: imports from `../../fixtures`,
  scenario data as consts, wraps multi-request phases in named `test.step`s,
  and validates the three layers Airalo exercises expect:
  - **status codes** for every request,
  - **meta.message** (Airalo's envelope message, normally "success"),
  - **response body** correctness, including cross-request consistency
    (e.g. a fetched resource matches what the creating request returned).
  Assertion messages on every expect.

### 4. Mind the realities of a live partner API

- **Rate limits**: `AiraloApiClient.send()` already retries HTTP 429 using
  Retry-After (`rateLimitRetries` option; set 0 to assert 429 behaviour).
  Don't add sleeps - rely on the client. The `api` project timeout is
  already generous for this.
- **Real side effects**: order-type endpoints create real orders on the
  partner account. Keep quantities exactly as requested, never loop order
  creation for "more coverage", and call out side-effecting requests in the
  summary.
- **Secrets**: credentials come from `.env` via the auth fixture - never
  hardcode tokens, client ids or secrets anywhere, including in specs.

### 5. Verify before declaring done

1. `npm run typecheck` - must be clean.
2. `npx playwright test <new spec> --project=api` - must pass live.
3. `npm run test:api` - the whole suite must still pass together.

### 6. Keep the inventories current

Update `services/CLAUDE.md` (new/changed services and methods) and
`tests/CLAUDE.md` (new spec and what it covers).

## Output summary (always include)

- What was reused vs newly created, and why.
- Any overlap with existing specs/services that was found.
- Doc pages used to verify endpoint shapes (with URLs), and any assumptions
  that could not be verified.
- Which requests have real side effects on the partner account.
- Verification results (typecheck + live runs).
