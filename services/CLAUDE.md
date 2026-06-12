# services/ — API layer inventory

Service objects call `AiraloApiClient`, never `APIRequestContext` directly.
**Keep this inventory current** — update it whenever services or client
capabilities change, so agents and humans can find reusable code first.

## AiraloApiClient (`airalo-api-client.ts`)

Single core `send(method, path, options)` — owns base URL, bearer auth,
default headers, error context and 429 handling. Verb helpers: `get`,
`post`, `put`, `patch`, `delete`. Options (`SendOptions`):

- `params` — query string; `data` — JSON body; `form` — urlencoded body;
  `multipart` — multipart/form-data body (Airalo's order endpoints).
- `headers` — merged over defaults.
- `rateLimitRetries` — automatic retry on HTTP 429 honouring Retry-After
  (default 3; set 0 in tests that assert 429 behaviour).

Returns raw `APIResponse` — specs assert status codes themselves.

## Auth (`airalo-auth.ts`)

`fetchAiraloAccessToken(request, { apiBaseURL, clientId, clientSecret })` —
OAuth2 client_credentials exchange, POST {base}/token (urlencoded), token at
`data.access_token`, valid 24h, rate limited. Called ONCE per worker by the
`airaloAuthToken` fixture — never call it from specs.

## Services (fixtures in `fixtures/api.fixtures.ts`)

- **PackagesService** (`packages.service.ts`) — fixture `packagesApi`
  - `list(params?)` — GET /packages (filters, limit, page).
- **OrdersService** (`orders.service.ts`) — fixture `ordersApi`
  - `submit({ packageId, quantity, description? })` — POST /orders
    (multipart). REAL side effect: creates an order on the partner account.
  - Types: `SubmittedOrder`, `OrderSim`, `SubmitOrderResponse`.
  - Docs: https://developers.partners.airalo.com/submit-order-11883024e0
- **SimsService** (`sims.service.ts`) — fixture `simsApi`
  - `get(iccid, { include? })` — GET /sims/{iccid}; include:
    `order | order.status | order.user | share`. Only API-ordered eSIMs are
    retrievable.
  - Types: `EsimDetails`, `GetEsimResponse`.
  - Docs: https://developers.partners.airalo.com/get-esim-11883028e0

## Response envelope

All Partner API responses wrap payloads as `{ data: ..., meta: { message } }`;
`meta.message` is "success" on happy paths. Errors: 401 (auth), 422
(validation), 429 (rate limit — handled by the client).

## Conventions

- New API area → new `<area>.service.ts` + typed interfaces for asserted
  fields + fixture registration in `api.fixtures.ts` + entry here.
- Record the verified doc URL in each service's JSDoc.
- Endpoint shapes must come from the official docs or a verified live
  response — never invented.
