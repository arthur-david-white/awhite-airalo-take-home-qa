import * as fs from 'node:fs';
import * as path from 'node:path';
import type { APIRequestContext } from '@playwright/test';

/**
 * Airalo tokens are valid for 24h and the token endpoint is rate limited to
 * a handful of requests per minute — fewer than the number of parallel
 * Playwright workers. A worker-scoped fixture alone therefore is not enough:
 * the token is also cached on disk (gitignored .auth/) so one exchange
 * serves every worker and every run until it expires.
 */
const tokenCachePath = path.resolve(__dirname, '..', '.auth', 'airalo-token.json');
const EXPIRY_SAFETY_MARGIN_MS = 5 * 60_000;
const MAX_TOKEN_LIFETIME_MS = 24 * 60 * 60_000;
const MAX_TOKEN_ATTEMPTS = 4;

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

function readCachedToken(): string | undefined {
  try {
    const cached = JSON.parse(fs.readFileSync(tokenCachePath, 'utf-8')) as CachedToken;
    if (cached.accessToken && Date.now() < cached.expiresAt - EXPIRY_SAFETY_MARGIN_MS) {
      return cached.accessToken;
    }
  } catch {
    // Missing or corrupt cache — fall through to a fresh exchange.
  }
  return undefined;
}

function writeCachedToken(accessToken: string, expiresInSeconds: number): void {
  const expiresAt = Date.now() + Math.min(expiresInSeconds * 1_000, MAX_TOKEN_LIFETIME_MS);
  fs.mkdirSync(path.dirname(tokenCachePath), { recursive: true });
  fs.writeFileSync(tokenCachePath, JSON.stringify({ accessToken, expiresAt } satisfies CachedToken));
}

export interface AiraloTokenRequest {
  /** Airalo Partner API root including /v2, e.g. https://partners-api.airalo.com/v2 */
  apiBaseURL: string;
  clientId: string;
  clientSecret: string;
}

/** Shape of Airalo's token endpoint 200 response (token nested under `data`). */
interface AiraloTokenResponse {
  data?: {
    token_type?: string;
    expires_in?: number;
    access_token?: string;
  };
  meta?: { message?: string };
}

/**
 * Performs Airalo's OAuth2 client_credentials exchange.
 *
 * Verified against the Airalo Partner API docs (June 2026,
 * https://developers.partners.airalo.com/request-access-token-11883021e0):
 *   POST {apiBaseURL}/token
 *   Content-Type: application/x-www-form-urlencoded
 *   Body: client_id, client_secret, grant_type=client_credentials
 *   200 → { data: { token_type: "Bearer", expires_in, access_token }, meta }
 *
 * The token is valid for 24h and the endpoint is rate limited (a handful of
 * requests per minute), so callers must cache it — the airaloAuthToken
 * fixture does this once per worker.
 */
export async function fetchAiraloAccessToken(
  request: APIRequestContext,
  { apiBaseURL, clientId, clientSecret }: AiraloTokenRequest,
): Promise<string> {
  const cachedUpfront = readCachedToken();
  if (cachedUpfront) {
    return cachedUpfront;
  }

  // Cold start with parallel workers: stagger briefly so the fastest worker
  // can seed the cache and the rest never need to call the endpoint at all.
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 3_000));
  const cachedAfterJitter = readCachedToken();
  if (cachedAfterJitter) {
    return cachedAfterJitter;
  }

  const tokenUrl = `${apiBaseURL.replace(/\/+$/, '')}/token`;

  for (let attempt = 0; ; attempt++) {
    const response = await request.post(tokenUrl, {
      form: {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
      },
      headers: { Accept: 'application/json' },
    });

    if (response.status() === 429 && attempt < MAX_TOKEN_ATTEMPTS - 1) {
      // Rate limited — typically several workers cold-starting at once.
      // Wait (Retry-After or jittered backoff), then prefer a token a
      // faster sibling worker may have cached in the meantime.
      const retryAfterSeconds = Number(response.headers()['retry-after']);
      const delayMs = Number.isFinite(retryAfterSeconds)
        ? retryAfterSeconds * 1_000
        : 15_000 * (attempt + 1) + Math.random() * 5_000;
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      const cached = readCachedToken();
      if (cached) {
        return cached;
      }
      continue;
    }

    if (!response.ok()) {
      // Safe to include the response body: Airalo returns validation/auth
      // error messages here, never the client secret.
      throw new Error(
        `Airalo OAuth2 token exchange failed: POST ${tokenUrl} → ` +
          `${response.status()} ${await response.text()}`,
      );
    }

    const body = (await response.json()) as AiraloTokenResponse;
    const token = body.data?.access_token;
    if (!token) {
      throw new Error(
        `Airalo OAuth2 token exchange returned 200 but no data.access_token: ${JSON.stringify(body)}`,
      );
    }
    writeCachedToken(token, body.data?.expires_in ?? 0);
    return token;
  }
}
