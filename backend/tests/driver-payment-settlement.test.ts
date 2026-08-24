import request from 'supertest';
import { app, createRootAdmin, loginAs, seedCatalog } from './helpers';

async function createOrderReadyForDelivery() {
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
    .send({ items: [{ clothType: shirt._id, service: wash._id, quantity: 4 }] });

  const orderId = completeRes.body.data.order._id;
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
    .send({ taxes: 50 });

  return { admin, driver, driverId: driverRes.body.data.id, billId: genRes.body.data._id, total: genRes.body.data.finalAmount };
}

describe('Driver payment settlement', () => {
  it('marks driver-collected payments unsettled until an admin settles them, and settles selected ones', async () => {
    const { admin, driver, driverId, billId, total } = await createOrderReadyForDelivery();

    const payRes = await request(app)
      .post(`/api/bills/${billId}/payments`)
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send({ splits: [{ amount: total, method: 'CASH' }] });
    expect(payRes.status).toBe(201);

    const pendingByDriverRes = await request(app)
      .get('/api/payments/pending-by-driver')
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(pendingByDriverRes.status).toBe(200);
    const driverRow = pendingByDriverRes.body.data.find((r: { driverId: string }) => r.driverId === driverId);
    expect(driverRow).toBeDefined();
    expect(driverRow.totalPending).toBe(total);
    expect(driverRow.count).toBe(1);

    const pendingForDriverRes = await request(app)
      .get(`/api/payments/pending/${driverId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(pendingForDriverRes.status).toBe(200);
    expect(pendingForDriverRes.body.data).toHaveLength(1);
    const paymentId = pendingForDriverRes.body.data[0]._id;

    const forbiddenSettleRes = await request(app)
      .patch('/api/payments/settle')
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send({ paymentIds: [paymentId] });
    expect(forbiddenSettleRes.status).toBe(403);

    const settleRes = await request(app)
      .patch('/api/payments/settle')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ paymentIds: [paymentId] });
    expect(settleRes.status).toBe(200);
    expect(settleRes.body.data[0].settledToAdmin).toBe(true);

    const doubleSettleRes = await request(app)
      .patch('/api/payments/settle')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ paymentIds: [paymentId] });
    expect(doubleSettleRes.status).toBe(409);

    const afterSettleRes = await request(app)
      .get('/api/payments/pending-by-driver')
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(afterSettleRes.body.data.find((r: { driverId: string }) => r.driverId === driverId)).toBeUndefined();
  });

  it('admin-collected payments are settled immediately and never appear as pending', async () => {
    const { admin, billId, total } = await createOrderReadyForDelivery();

    const payRes = await request(app)
      .post(`/api/bills/${billId}/payments`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ splits: [{ amount: total, method: 'CARD' }] });
    expect(payRes.status).toBe(201);

    const pendingRes = await request(app)
      .get('/api/payments/pending-by-driver')
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(pendingRes.body.data).toHaveLength(0);
  });
});
