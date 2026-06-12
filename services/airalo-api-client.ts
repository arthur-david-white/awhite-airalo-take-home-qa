import type { APIRequestContext, APIResponse } from '@playwright/test';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface SendOptions {
  /** Query string parameters. */
  params?: Record<string, string | number | boolean>;
  /** JSON request body. */
  data?: unknown;
  /** application/x-www-form-urlencoded body (Airalo uses this for OAuth-style calls). */
  form?: Record<string, string>;
  /** multipart/form-data body (Airalo's order endpoints document this shape). */
  multipart?: Record<string, string | number | boolean>;
  /** Extra headers, merged over (and able to override) the client defaults. */
  headers?: Record<string, string>;
  /**
   * How many times to retry when Airalo rate-limits the request (HTTP 429),
   * honouring the Retry-After header. Set to 0 for tests that assert 429
   * behaviour itself. Default: 3.
   */
  rateLimitRetries?: number;
}

export interface AiraloApiClientOptions {
  /** Airalo Partner API root including /v2, e.g. https://partners-api.airalo.com/v2 */
  baseURL: string;
  /**
   * Bearer token from the OAuth2 client_credentials exchange. Optional so
   * UI-only runs can construct the client without Partner API credentials;
   * the first actual request will fail with a clear message instead.
   */
  accessToken?: string;
}

/**
 * Thin, Airalo-aware wrapper around Playwright's APIRequestContext.
 *
 * Every request funnels through the single `send()` core so the Airalo base
 * URL, bearer auth, default headers and error context live in exactly one
 * place. `send()` itself is generic over verb/path — only the configuration
 * (base URL, token) is Airalo-specific. Service objects (see /services)
 * call into this client instead of touching APIRequestContext directly.
 */
export class AiraloApiClient {
  constructor(
    private readonly context: APIRequestContext,
    private readonly options: AiraloApiClientOptions,
  ) {}

  /**
   * Core request method — all verbs go through here.
   * Returns the raw APIResponse so tests can assert on any status code.
   */
  async send(method: HttpMethod, path: string, options: SendOptions = {}): Promise<APIResponse> {
    const { baseURL, accessToken } = this.options;
    if (!accessToken) {
      throw new Error(
        'Airalo Partner API access token is missing. ' +
          'Set AIRALO_CLIENT_ID and AIRALO_CLIENT_SECRET in .env (see .env.example) ' +
          'so the airaloAuthToken fixture can perform the OAuth2 exchange.',
      );
    }

    const url = `${baseURL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
    const rateLimitRetries = options.rateLimitRetries ?? 3;

    for (let attempt = 0; ; attempt++) {
      let response: APIResponse;
      try {
        response = await this.context.fetch(url, {
          method,
          params: options.params,
          data: options.data,
          form: options.form,
          multipart: options.multipart,
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
            ...options.headers,
          },
        });
      } catch (error) {
        throw new Error(
          `Airalo API request failed: ${method} ${url} — ${(error as Error).message}`,
        );
      }

      if (response.status() !== 429 || attempt >= rateLimitRetries) {
        return response;
      }

      // Airalo rate-limits per endpoint; wait for the advertised Retry-After
      // (falling back to an increasing delay) and try again.
      const retryAfterSeconds = Number(response.headers()['retry-after']);
      const delayMs = Number.isFinite(retryAfterSeconds)
        ? retryAfterSeconds * 1_000
        : 15_000 * (attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  get(path: string, options?: SendOptions): Promise<APIResponse> {
    return this.send('GET', path, options);
  }

  post(path: string, options?: SendOptions): Promise<APIResponse> {
    return this.send('POST', path, options);
  }

  put(path: string, options?: SendOptions): Promise<APIResponse> {
    return this.send('PUT', path, options);
  }

  patch(path: string, options?: SendOptions): Promise<APIResponse> {
    return this.send('PATCH', path, options);
  }

  delete(path: string, options?: SendOptions): Promise<APIResponse> {
    return this.send('DELETE', path, options);
  }
}
