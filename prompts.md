# Prompts

This file records the main prompts used to build this framework with Claude
Code (Opus 4.8), in roughly the order they were given. They are reproduced
close to verbatim - the design intent matters more than polish, so original
wording is kept.

> Note: the Partner API `client_id` / `client_secret` from the take-home brief
> have been **redacted to placeholders** below. This is a public repository;
> the real credentials live only in a gitignored `.env`.

---

## 1. Framework base (the foundational prompt)

The prompt that defined the whole architecture - projects, layering, fixtures,
and the instruction to verify the real OAuth2 flow before writing auth.

```text
You are a Senior QA Engineer specialising in UI and API automation. Build the
BASE of a Playwright + TypeScript framework for testing AIRALO — both its
website (UI) and its Partner API — in one project. This is an Airalo-specific
framework, not a vendor-neutral template: wire it to Airalo's URLs and auth
directly. No test cases yet — just the reusable foundation tests build on later.
Include ONE trivial smoke spec per suite only to prove the plumbing works.

## Architecture
- TypeScript strict mode.
- Separate Playwright projects in playwright.config.ts:
  - `ui`  → chromium, baseURL = Airalo website (https://www.airalo.com).
  - `api` → NO browser (omit browserName); baseURL = Airalo Partner API
    (https://partners-api.airalo.com/v2). Runs as a pure HTTP client.
  - Both runnable independently via --project.

### UI layer (Page Object Model)
- Abstract BasePage that page objects extend. It holds `page: Page` and an
  injected AiraloApiClient so page objects CAN trigger Airalo API calls for
  state setup — but BasePage does NOT implement request logic itself, it only
  holds the reference.
- BasePage contains only HIGH-VALUE shared helpers (navigation helper, a
  logged-action wrapper, common waits / cookie-banner dismissal). Do NOT add
  thin 1:1 wrappers around locator.click()/fill() — Playwright locators already
  auto-wait and we don't want to hide its API.
- Page objects are instantiated via a fixture so the api handle is injected
  automatically (no `new SomePage(page)` in specs).

### API layer (Airalo client + service objects)
- An AiraloApiClient wrapping APIRequestContext with a single core
  send(method, path, { params, data, headers }) method that owns the Airalo
  base URL, bearer-auth header, default headers and error context. Expose thin
  get/post/put/patch/delete convenience methods over it. The send() core stays
  generic over verb/path so the SAME code path serves every request — only the
  configuration (base URL, auth) is Airalo-specific. Specific service objects
  (added later) call into this client rather than touching APIRequestContext.
- Provide a `/services` folder with one tiny example Airalo service to show the
  pattern, no real business endpoints yet.
- Before writing the auth fixture, fetch Airalo's current Partner API
  authentication docs to confirm the exact token endpoint and OAuth2 grant
  shape.

### Fixtures
- airaloAuthToken: WORKER-SCOPED — performs Airalo's real OAuth2 exchange
  (client_id + client_secret -> bearer token) ONCE per worker, reused across
  tests. Reads credentials from env. Before implementing this, verify the
  current OAuth2 token endpoint URL and grant type from Airalo's Partner API
  docs — do NOT assume the path or request shape. If you genuinely cannot reach
  the docs, isolate the auth call behind a single well-commented fetchToken()
  method with a `// TODO: verify endpoint against Airalo docs` marker.
- apiContext: a request context with the Airalo Partner API baseURL configured.
- api: an authenticated AiraloApiClient (wraps apiContext + airaloAuthToken).
- a page-object fixture that injects `api` into page objects.

## Conventions & constraints
- All Airalo base URLs and credentials come from environment variables loaded
  from .env. Commit a populated .env.example naming the real Airalo vars.
  Gitignore the real .env. Never hardcode secrets, even the test creds.
- Centralise config (base URLs, timeouts, retries) in playwright.config.ts.
- Use web-first assertions for UI; meaningful assertion messages.

## Deliverables / file layout
playwright.config.ts, package.json, tsconfig.json (strict), .env.example,
.gitignore, README.md, CLAUDE.md, /tests/ui (one smoke spec), /tests/api (one
smoke spec), /pages (BasePage + page objects), /services (AiraloApiClient + one
example service), /fixtures (auth, api, page-object fixtures).
```

---

## 2. First UI test - Purchase 7-day Japan plan

Established the locator policy and the pages-hold-behaviour / specs-orchestrate
split that the rest of the framework follows.

```text
Now that we have a solid framework to create tests into lets create the
following UI test.

Use the playwright CLI to find the locators for the following steps and
implement them into the framework. Lets remember that functions go into pages,
identifiers go into the separate locator files and tests work using assertions.

The correct webaddress for the tests in this framework is: https://www.airalo.com/

Test - Purchase 7 Day Japan Plan
1: Open the webpage
2: Type Japan into the search field
3: Doing step 2 should show a drop down from the search bar containing valid
   results. Verify Japan is present by its flag and then click it
4: Validate we are on the plan selection page
5: Validate find and click the 7 day
6: Verify that the price shown next to package details matches the price shown
   in the actual package

A couple of things stand out to me for this. We should have two pages one for
the home page and one for the plans page. The search functions should live in
the home page, and any selection/validation logic for selecting a plan should
be in the plans page.

Any functions that can be generic should be. So for searching we should be able
to call the function with any search input and same for clicking the search
result. Same for the plans, we should be able to specify the plan
```

---

## 3. Refactor - push logic into page objects, robust cookie dismissal

```text
A couple of things. Where possible i think its best we try to move test logic
out of the test and into reusable functions in the pages

Second, lets expand the cookie clearer function to wait until the pop up has
cleared before continuing, Currently it seems to still be on the screen whilst
the test is going on
```

---

## 4. Parameterise the purchase test (3 / 7 / 30 days)

```text
Lets expand this test suite to check the prices match for 3 and 30 days also.
We should be able to do that easily with our reusable functions. I think we
should look to keep them seperate tests though?
```

---

## 5. Search test suite

```text
Lets create a new test suite that verifies the search function since we have
those functions already.

Lets have a test that searches for the UK and checks it arrives at the page
above. It doesnt need to do the comparrison
and another test that searches for an invalid country or term and checks the
drop down shows "No Results"
```

---

## 6. Partner API tests - submit order + get eSIM

```text
Cool so now we have a basic UI test suite lets create some API tests.

Using the API framework we already created lets add in some playwright api
tests for the following

1. Explore the API: base URL https://partners-api.airalo.com/v2
2. Authentication: Obtain OAuth2 tokens using the provided credentials:
   client_id: <provided in the take-home brief>
   client_secret: <provided in the take-home brief>
3. Endpoint 1: Use the Submit order endpoint to POST an order for 6 eSIMs with
   package_id moshi-moshi-7days-1gb. Ensure you have a valid OAuth2 token first.
4. Endpoint 2: Use the Get eSIM endpoint to GET the eSIM details for each eSIM
   from your order, using the correct query parameters.
5. Create Automated Tests for these endpoints.
6. Verify Responses: status codes, message, and response body (order details
   and eSIM properties for all eSIMs from the order).
```

---

## 7. QE-Agent + the create-ui-test skill

```text
Lets expand this project now to include an agent. Lets call it the QE-Agent

And add the first skill, create-ui-test this skill should take in a detailed
set of test steps that the llm can use to create a test. It can contain
identifiers or the agent can use playwright-cli to check out the airalo web
app. Lets assume it always uses that app.

Set best practises in the skill. We should enforce the agent using proper
locator strategies and not xpaths or simmilar. If it is forced to do so it
should explain as why it did.

We should have the agent check for existing functions in the pages or tests
that we may be overlapping with and use them or flag as necessary. It may be
worth adding claude mds to the pages and tests to help with this
```

---

## 8. The create-api-test skill

```text
Lets repeat that exercise for create-api-test this should work much the same
but require a specific set of api requests to make. Again it should look for
reusability firstly and then work from there. If the skill isnt sure it can
search the docs for functions but the requester should be clear
```

---

## 9. Using the skills - currency selection UI test

Exercising `/create-ui-test` on a fresh scenario.

```text
Using the create-ui-test skill create a test that achieves the following:

1: Open the airalo website
2: Find the currency conversion button
3: Click it
4: Select Japanese Yen
5: Validate Yen has been selected by checking the currency used in the Get
   eSIMs for popular locations section
```

And `/create-api-test` on a new endpoint:

```text
/create-api-test https://partners-api.airalo.com/v2/compatible-devices-lite
```

---

## 10. Fixing skill discovery

```text
Can we fix the skills not being invokable?
```

(Root cause: the `.claude/skills/` directory did not exist when the session
started, so Claude Code wasn't watching it - a restart fixed discovery.)

---

## 11. Polish & hardening

Smaller prompts that refined docs and robustness:

```text
To the readme lets add some example usages of the skills that they can easily
use to try and create some tests in the framework
```

```text
replace em dashes in the project where possible
```

```text
Lets add some commands they can use to run individual specs

And also to run whole suites and individual specs in headed mode
```

```text
When i run npm run test:headed I'm seeing some of the tests failing because of
a push notifications permissions pop up on the page. Can you try and diagnose
this and add a watch dog to the webpage goto function in base page to fix this?
... You can probably find it and diagnose it using playwright-cli
```

```text
Cool, now im going to expose to you the take home challenge. Do you think we
meet the technical requirements for it?  [+ the brief PDF]
```
