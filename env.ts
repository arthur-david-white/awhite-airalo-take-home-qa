import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Airalo-specific environment configuration, loaded once from .env.
 *
 * Base URLs fall back to Airalo's real public hosts so a fresh clone works
 * out of the box; credentials intentionally have NO fallback — they must come
 * from the environment (see .env.example) and are never hardcoded.
 */
export const airaloEnv = {
  /** Airalo website under test (ui project baseURL). */
  webBaseURL: process.env.AIRALO_WEB_BASE_URL ?? 'https://www.airalo.com',
  /** Airalo Partner API root, including the /v2 prefix (api project baseURL). */
  apiBaseURL: process.env.AIRALO_API_BASE_URL ?? 'https://partners-api.airalo.com/v2',
  /** OAuth2 client credentials for the Partner API token exchange. */
  clientId: process.env.AIRALO_CLIENT_ID,
  clientSecret: process.env.AIRALO_CLIENT_SECRET,
} as const;
