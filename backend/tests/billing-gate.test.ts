import request from 'supertest';
import { app, createRootAdmin, loginAs, seedCatalog } from './helpers';

async function createOrderUpToPickedUp() {
  await createRootAdmin();
  const root = await loginAs('9999999999', 'RootPass123');
  await request(app)
    .post('/api/auth/admins')
    .set('Authorization', `Bearer ${root.accessToken}`)
    .send({ name: 'Staff Admin', mobileNumber: '8888888888', password: 'AdminPass123', confirmPassword: 'AdminPass123' });
  const admin = await loginAs('8888888888', 'AdminPass123');

  const driverRes = await request(app)
    .post('/api/drivers')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ name: 'Suresh Driver', mobileNumber: '7000000002', password: 'DriverPass123' });
  const driver = await loginAs('7000000002', 'DriverPass123');

  const { wash, iron, shirt } = await seedCatalog();

  const customerRes = await request(app)
    .post('/api/customers')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ name: 'Ravi Kumar', mobileNumber: '7000000001', addresses: [{ address: '12 MG Road' }] });

  const pickupRes = await request(app)
    .post('/api/pickups')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({
      customer: customerRes.body.data._id,
      pickupAddress: { address: '12 MG Road' },
      pickupDate: '2026-06-23',
      pickupTime: '10:00 AM',
      servicesRequested: [wash._id, iron._id],
      assignedDriver: driverRes.body.data.id,
    });

  await request(app).patch(`/api/pickups/${pickupRes.body.data._id}/accept`).set('Authorization', `Bearer ${driver.accessToken}`);
  const completeRes = await request(app)
    .patch(`/api/pickups/${pickupRes.body.data._id}/complete`)
    .set('Authorization', `Bearer ${driver.accessToken}`)
    .send({
      items: [
        { clothType: shirt._id, service: wash._id, quantity: 5 },
        { clothType: shirt._id, service: iron._id, quantity: 3 },
      ],
    });

  return { admin, driver, order: completeRes.body.data.order, wash, iron, shirt };
}

async function advanceToReadyForDelivery(admin: { accessToken: string }, orderId: string) {
  await request(app)
    .patch(`/api/orders/${orderId}/status`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ status: 'RECEIVED_AT_LAUNDRY' });
  await request(app)
    .patch(`/api/orders/${orderId}/status`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ status: 'READY_FOR_DELIVERY' });
}

describe('Billing gate', () => {
  it('blocks bill generation until the order reaches Ready for Delivery, then computes line items from per-item prices', async () => {
    const { admin, order, wash, iron, shirt } = await createOrderUpToPickedUp();

    await request(app)
      .patch(`/api/cloth-types/${shirt._id}/price`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ service: wash._id, price: 10 });
    await request(app)
      .patch(`/api/cloth-types/${shirt._id}/price`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ service: iron._id, price: 5 });

    const blockedRes = await request(app)
      .post(`/api/bills/orders/${order._id}/generate`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({});
    expect(blockedRes.status).toBe(400);

    await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'RECEIVED_AT_LAUNDRY' });

    const stillBlockedRes = await request(app)
      .post(`/api/bills/orders/${order._id}/generate`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({});
    expect(stillBlockedRes.status).toBe(400);

    await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'READY_FOR_DELIVERY' });

    const allowedRes = await request(app)
      .post(`/api/bills/orders/${order._id}/generate`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ taxes: 7.5 });

    // 5 shirts x ₹10 wash + 3 shirts x ₹5 iron = ₹65 subtotal, + ₹7.5 tax = ₹72.5
    expect(allowedRes.status).toBe(201);
    expect(allowedRes.body.data.subtotal).toBe(65);
    expect(allowedRes.body.data.finalAmount).toBe(72.5);
    expect(allowedRes.body.data.lineItems).toHaveLength(2);
    expect(allowedRes.body.data.invoiceNumber).toMatch(/^INV-\d{6}-\d{4}$/);
  });

  it('allows regenerating an unpaid bill, but blocks regeneration once paid', async () => {
    const { admin, order } = await createOrderUpToPickedUp();

    await advanceToReadyForDelivery(admin, order._id);

    const firstRes = await request(app).post(`/api/bills/orders/${order._id}/generate`).set('Authorization', `Bearer ${admin.accessToken}`).send({});
    expect(firstRes.status).toBe(201);
    const billId = firstRes.body.data._id;

    const regenRes = await request(app).post(`/api/bills/orders/${order._id}/generate`).set('Authorization', `Bearer ${admin.accessToken}`).send({ taxes: 2 });
    expect(regenRes.status).toBe(201);
    expect(regenRes.body.data._id).toBe(billId);
    expect(regenRes.body.data.taxes).toBe(2);

    await request(app)
      .post(`/api/bills/${billId}/payments`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ amount: regenRes.body.data.finalAmount, method: 'CASH' });

    const blockedAfterPaidRes = await request(app).post(`/api/bills/orders/${order._id}/generate`).set('Authorization', `Bearer ${admin.accessToken}`).send({});
    expect(blockedAfterPaidRes.status).toBe(409);
  });
});
