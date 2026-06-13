import { expect, test } from '../../fixtures';

/**
 * Trivial API smoke spec - proves the api project, worker-scoped OAuth2
 * token fixture, AiraloApiClient and service-object plumbing work.
 * Real API test cases come later.
 */
test.describe('Airalo Partner API smoke', () => {
  test('authenticated client can list packages', async ({ packagesApi }) => {
    const response = await packagesApi.list({ limit: 1 });

    expect(
      response.status(),
      'GET /packages should return 200 for an authenticated client',
    ).toBe(200);

    const body = (await response.json()) as { data?: unknown };
    expect(
      Array.isArray(body.data),
      'Packages response should contain a data array',
    ).toBe(true);
  });
});
