import type { APIResponse } from '@playwright/test';
import type { AiraloApiClient } from './airalo-api-client';

/**
 * Related-data models the Get eSIM endpoint can include.
 * Comma-separate to combine, e.g. 'order,order.status'.
 */
export type SimInclude = 'order' | 'order.status' | 'order.user' | 'share';

/** eSIM details returned by GET /sims/{iccid} (data object). */
export interface EsimDetails {
  id: number;
  created_at: string;
  iccid: string;
  lpa: string;
  matching_id: string;
  qrcode: string;
  qrcode_url: string;
  direct_apple_installation_url: string;
  is_roaming: boolean;
  /** Parent order, present when include=order is requested. */
  simable?: {
    id: number;
    code: string;
    package_id: string;
    quantity: number;
    package: string;
    data: string;
    currency: string;
  };
}

export interface GetEsimResponse {
  data: EsimDetails;
  meta: { message: string };
}

/**
 * Service object for Airalo's eSIM endpoints.
 * Docs: https://developers.partners.airalo.com/get-esim-11883028e0
 * Note: only eSIMs ordered via the API are retrievable here.
 */
export class SimsService {
  constructor(private readonly client: AiraloApiClient) {}

  /** GET /sims/{iccid} — retrieve one eSIM's details by ICCID. */
  get(iccid: string, options?: { include?: string }): Promise<APIResponse> {
    return this.client.get(`/sims/${iccid}`, {
      params: options?.include ? { include: options.include } : undefined,
    });
  }
}
