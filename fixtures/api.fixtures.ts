import { test as base, type APIRequestContext } from '@playwright/test';
import { airaloEnv } from '../env';
import { AiraloApiClient } from '../services/airalo-api-client';
import { fetchAiraloAccessToken } from '../services/airalo-auth';
import { PackagesService } from '../services/packages.service';

export interface ApiWorkerFixtures {
  /**
   * Bearer token from Airalo's OAuth2 client_credentials exchange.
   * WORKER-SCOPED: the exchange runs ONCE per worker and the token (valid
   * 24h, endpoint rate limited) is reused by every test in that worker.
   * `undefined` when credentials are not configured — see fixture body.
   */
  airaloAuthToken: string | undefined;
}

export interface ApiFixtures {
  /** Request context pointed at the Airalo Partner API base URL. */
  apiContext: APIRequestContext;
  /** Authenticated Airalo Partner API client. */
  api: AiraloApiClient;
  /** Example service object (see services/packages.service.ts). */
  packagesApi: PackagesService;
}

export const test = base.extend<ApiFixtures, ApiWorkerFixtures>({
  airaloAuthToken: [
    async ({ playwright }, use) => {
      if (!airaloEnv.clientId || !airaloEnv.clientSecret) {
        // No credentials configured. Don't fail here: UI page objects depend
        // on `api` (for optional state setup), and pure-UI runs must work
        // without Partner API credentials. AiraloApiClient throws a clear
        // error if a test actually sends a request without a token.
        await use(undefined);
        return;
      }
      const context = await playwright.request.newContext();
      let token: string;
      try {
        token = await fetchAiraloAccessToken(context, {
          apiBaseURL: airaloEnv.apiBaseURL,
          clientId: airaloEnv.clientId,
          clientSecret: airaloEnv.clientSecret,
        });
      } finally {
        await context.dispose();
      }
      await use(token);
    },
    { scope: 'worker' },
  ],

  apiContext: async ({ playwright }, use) => {
    const context = await playwright.request.newContext({
      baseURL: airaloEnv.apiBaseURL,
    });
    await use(context);
    await context.dispose();
  },

  api: async ({ apiContext, airaloAuthToken }, use) => {
    await use(
      new AiraloApiClient(apiContext, {
        baseURL: airaloEnv.apiBaseURL,
        accessToken: airaloAuthToken,
      }),
    );
  },

  packagesApi: async ({ api }, use) => {
    await use(new PackagesService(api));
  },
});
