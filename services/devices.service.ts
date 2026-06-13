import type { APIResponse } from '@playwright/test';
import type { AiraloApiClient } from './airalo-api-client';

/** A device entry from the compatible-devices-lite list. */
export interface CompatibleDevice {
  /** Operating system, e.g. 'ios' | 'android'. */
  os: string;
  /** Device manufacturer, e.g. 'Apple'. */
  brand: string;
  /** Device model name, e.g. 'iPhone 12 Pro Max'. */
  name: string;
}

export interface CompatibleDevicesResponse {
  data: CompatibleDevice[];
  /** Airalo envelope message - may be absent on this endpoint (asserted live). */
  meta?: { message?: string };
}

/**
 * Service object for Airalo's device-compatibility endpoints.
 * Docs: https://developers.partners.airalo.com/get-compatible-device-lite-list-19504054e0
 */
export class DevicesService {
  constructor(private readonly client: AiraloApiClient) {}

  /**
   * GET /compatible-devices-lite - list eSIM-compatible devices.
   * No query parameters; each device is { os, brand, name }.
   */
  listCompatibleLite(): Promise<APIResponse> {
    return this.client.get('/compatible-devices-lite');
  }
}
