import type { CompatibleDevice, CompatibleDevicesResponse } from '../../services/devices.service';
import { expect, test } from '../../fixtures';

/**
 * GET /compatible-devices-lite returns { data: [{ os, brand, name }] }.
 * Unlike most Partner API endpoints it has NO `meta` envelope (verified
 * against the live response), so there is no message layer to assert here -
 * the test validates the status code and the response body instead.
 * Read-only endpoint: no side effects on the partner account.
 */
test.describe('Airalo Partner API - compatible devices', () => {
  test('Get compatible device lite list returns eSIM-compatible devices', async ({
    devicesApi,
  }) => {
    const response = await devicesApi.listCompatibleLite();

    // Status code
    expect(
      response.status(),
      'GET /compatible-devices-lite should return HTTP 200',
    ).toBe(200);

    const body = (await response.json()) as CompatibleDevicesResponse;

    await test.step('verify the response body is a non-empty device list', async () => {
      expect(Array.isArray(body.data), 'Response should contain a data array').toBe(true);
      expect(
        body.data.length,
        'Compatible device list should not be empty',
      ).toBeGreaterThan(0);
    });

    await test.step('verify every device is well-formed { os, brand, name }', async () => {
      const isNonEmptyString = (value: unknown): boolean =>
        typeof value === 'string' && value.trim().length > 0;
      const malformed = body.data.filter(
        (d: CompatibleDevice) =>
          !isNonEmptyString(d.os) || !isNonEmptyString(d.brand) || !isNonEmptyString(d.name),
      );
      expect(
        malformed,
        `Every device should have non-empty os/brand/name (first offenders: ${JSON.stringify(
          malformed.slice(0, 3),
        )})`,
      ).toHaveLength(0);
    });

    await test.step('verify the list covers the eSIM platforms we expect', async () => {
      const osValues = new Set(body.data.map((d) => d.os.toLowerCase()));
      expect(osValues, 'List should include iOS devices').toContain('ios');
      expect(osValues, 'List should include Android devices').toContain('android');

      const hasAppleIphone = body.data.some(
        (d) => d.brand.toLowerCase() === 'apple' && /iphone/i.test(d.name),
      );
      expect(
        hasAppleIphone,
        'List should include at least one Apple iPhone (a known eSIM-compatible device)',
      ).toBe(true);
    });
  });
});
