import type { APIResponse } from '@playwright/test';
import type { AiraloApiClient } from './airalo-api-client';

export interface SubmitOrderRequest {
  /** Airalo package id, e.g. 'moshi-moshi-7days-1gb'. */
  packageId: string;
  /** Number of eSIMs to order (Airalo allows up to 50 per order). */
  quantity: number;
  /** Optional free-text note to identify the order. */
  description?: string;
}

/** An eSIM entry inside a submitted order (data.sims[]). */
export interface OrderSim {
  id: number;
  created_at: string;
  iccid: string;
  lpa: string;
  matching_id: string;
  qrcode: string;
  qrcode_url: string;
  direct_apple_installation_url: string;
}

/** Order payload returned by POST /orders (data object). */
export interface SubmittedOrder {
  id: number;
  code: string;
  currency: string;
  package_id: string;
  quantity: number;
  type: string;
  description: string | null;
  esim_type: string;
  validity: number;
  package: string;
  data: string;
  price: number;
  created_at: string;
  sims: OrderSim[];
}

export interface SubmitOrderResponse {
  data: SubmittedOrder;
  meta: { message: string };
}

/**
 * Service object for Airalo's order endpoints.
 * Docs: https://developers.partners.airalo.com/submit-order-11883024e0
 */
export class OrdersService {
  constructor(private readonly client: AiraloApiClient) {}

  /**
   * POST /orders — submit an order for `quantity` eSIMs of a package.
   * Airalo documents this endpoint as multipart/form-data.
   */
  submit({ packageId, quantity, description }: SubmitOrderRequest): Promise<APIResponse> {
    return this.client.post('/orders', {
      multipart: {
        package_id: packageId,
        quantity,
        ...(description !== undefined ? { description } : {}),
      },
    });
  }
}
