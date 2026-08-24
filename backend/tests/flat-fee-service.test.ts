import request from 'supertest';
import { app, createRootAdmin, loginAs } from './helpers';

describe('Flat-fee services (e.g. House Cleaning)', () => {
  it('bills a flat-fee service as a single line item with no cloth type, ignoring quantity', async () => {
    await createRootAdmin();
    const admin = await loginAs('9999999999', 'RootPass123');

    const customerRes = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Fatima Noor', mobileNumber: '7000000009', addresses: [{ address: '3 Palm Villas' }] });

    const serviceRes = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'House Cleaning Test' });
    const serviceId = serviceRes.body.data._id;

    const setFlatPriceRes = await request(app)
      .patch(`/api/services/${serviceId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ flatPrice: 250 });
    expect(setFlatPriceRes.status).toBe(200);
    expect(setFlatPriceRes.body.data.flatPrice).toBe(250);

    const orderRes = await request(app)
      .post('/api/orders/walk-in')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        customer: customerRes.body.data._id,
        items: [{ service: serviceId, quantity: 1 }],
        isInStoreDelivery: true,
      });
    expect(orderRes.status).toBe(201);
    const orderId = orderRes.body.data._id;

    await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'RECEIVED_AT_LAUNDRY' });
    await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'READY_FOR_DELIVERY' });

    const genRes = await request(app)
      .post(`/api/bills/orders/${orderId}/generate`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({});
    expect(genRes.status).toBe(201);
    expect(genRes.body.data.subtotal).toBe(250);
    expect(genRes.body.data.finalAmount).toBe(250);
    expect(genRes.body.data.lineItems).toHaveLength(1);
    expect(genRes.body.data.lineItems[0].unitPrice).toBe(250);
    expect(genRes.body.data.lineItems[0].quantity).toBe(1);
    expect(genRes.body.data.lineItems[0].clothType).toBeFalsy();
  });
});
