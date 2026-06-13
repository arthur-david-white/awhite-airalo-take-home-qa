import type { SubmitOrderResponse } from '../../services/orders.service';
import type { GetEsimResponse } from '../../services/sims.service';
import { expect, test } from '../../fixtures';

const packageId = 'moshi-moshi-7days-1gb';
const quantity = 6;

test.describe('Airalo Partner API - orders and eSIMs', () => {
  test(`Submit order for ${quantity} eSIMs and retrieve each eSIM's details`, async ({
    ordersApi,
    simsApi,
  }) => {
    // --- Endpoint 1: Submit order -------------------------------------------
    const orderResponse = await ordersApi.submit({
      packageId,
      quantity,
      description: 'awhite-airalo-take-home-qa automated order test',
    });

    expect(orderResponse.status(), 'Submit order should return HTTP 200').toBe(200);

    const orderBody = (await orderResponse.json()) as SubmitOrderResponse;
    expect(orderBody.meta.message, 'Submit order response message should be "success"').toBe(
      'success',
    );

    const order = orderBody.data;
    await test.step('verify order details in the response body', async () => {
      expect(order.package_id, 'Order should be for the requested package').toBe(packageId);
      expect(order.quantity, 'Order quantity should match the request').toBe(quantity);
      expect(order.type, 'Order type should default to "sim"').toBe('sim');
      expect(order.id, 'Order should have a numeric id').toEqual(expect.any(Number));
      expect(order.code, 'Order should have a reference code').toBeTruthy();
      expect(order.created_at, 'Order should have a creation timestamp').toBeTruthy();
    });

    await test.step('verify the order contains one well-formed eSIM per requested unit', async () => {
      expect(order.sims, `Order should contain exactly ${quantity} eSIMs`).toHaveLength(quantity);

      for (const sim of order.sims) {
        expect(sim.iccid, 'Each eSIM should have a numeric ICCID').toMatch(/^\d{18,22}$/);
        expect(sim.id, 'Each eSIM should have a numeric id').toEqual(expect.any(Number));
        expect(sim.lpa, 'Each eSIM should have an LPA address').toBeTruthy();
        expect(sim.matching_id, 'Each eSIM should have a matching id').toBeTruthy();
        expect(
          sim.qrcode,
          'Each eSIM QR payload should embed its LPA address and matching id',
        ).toBe(`LPA:1$${sim.lpa}$${sim.matching_id}`);
      }

      const iccids = order.sims.map((sim) => sim.iccid);
      expect(new Set(iccids).size, 'Every eSIM in the order should have a unique ICCID').toBe(
        quantity,
      );
    });

    // --- Endpoint 2: Get eSIM for every eSIM in the order -------------------
    for (const orderedSim of order.sims) {
      await test.step(`get eSIM details for ICCID ${orderedSim.iccid}`, async () => {
        const simResponse = await simsApi.get(orderedSim.iccid, { include: 'order' });

        expect(simResponse.status(), 'Get eSIM should return HTTP 200').toBe(200);

        const simBody = (await simResponse.json()) as GetEsimResponse;
        expect(simBody.meta.message, 'Get eSIM response message should be "success"').toBe(
          'success',
        );

        const esim = simBody.data;
        expect(esim.iccid, 'Returned eSIM should have the requested ICCID').toBe(
          orderedSim.iccid,
        );
        expect(esim.id, 'Returned eSIM id should match the ordered eSIM').toBe(orderedSim.id);
        expect(esim.lpa, 'Returned LPA should match the ordered eSIM').toBe(orderedSim.lpa);
        expect(
          esim.matching_id,
          'Returned matching id should match the ordered eSIM',
        ).toBe(orderedSim.matching_id);
        expect(esim.qrcode, 'Returned QR payload should match the ordered eSIM').toBe(
          orderedSim.qrcode,
        );

        expect(
          esim.simable,
          'Included order (simable) should be present when include=order is requested',
        ).toBeTruthy();
        expect(esim.simable?.id, 'eSIM should belong to the submitted order').toBe(order.id);
        expect(esim.simable?.code, 'Included order code should match the submitted order').toBe(
          order.code,
        );
      });
    }
  });
});
