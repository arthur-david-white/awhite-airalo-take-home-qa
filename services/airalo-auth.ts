import type { APIRequestContext } from '@playwright/test';

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
  const tokenUrl = `${apiBaseURL.replace(/\/+$/, '')}/token`;
  const response = await request.post(tokenUrl, {
    form: {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    },
    headers: { Accept: 'application/json' },
  });

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
  return token;
}
