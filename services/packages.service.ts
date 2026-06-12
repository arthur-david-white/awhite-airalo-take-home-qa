import type { APIResponse } from '@playwright/test';
import type { AiraloApiClient } from './airalo-api-client';

export interface ListPackagesParams {
  /** Filter by package type, e.g. 'global' | 'local'. */
  'filter[type]'?: string;
  /** Filter by country code, e.g. 'US'. */
  'filter[country]'?: string;
  limit?: number;
  page?: number;
}

/**
 * Example Airalo service object demonstrating the service pattern:
 * a small, endpoint-focused class that calls into AiraloApiClient rather
 * than touching APIRequestContext. Real business services (orders, sims,
 * top-ups, ...) follow this same shape later.
 */
export class PackagesService {
  constructor(private readonly client: AiraloApiClient) {}

  /** GET /packages — list available eSIM packages. */
  list(params?: ListPackagesParams): Promise<APIResponse> {
    return this.client.get('/packages', {
      params: params as Record<string, string | number | boolean> | undefined,
    });
  }
}
