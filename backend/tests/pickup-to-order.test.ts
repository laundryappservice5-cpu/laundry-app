import request from 'supertest';
import { app, createRootAdmin, loginAs, seedCatalog } from './helpers';

async function setupAdminAndDriver() {
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
  const driverId = driverRes.body.data.id;
  const driver = await loginAs('7000000002', 'DriverPass123');

  return { admin, driver, driverId };
}

describe('Pickup -> Order flow', () => {
  it('creates an order with an append-only status history once a driver completes the pickup', async () => {
    const { admin, driver, driverId } = await setupAdminAndDriver();
    const { wash, iron, shirt } = await seedCatalog();

    const customerRes = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Ravi Kumar', mobileNumber: '7000000001', addresses: [{ address: '12 MG Road' }] });
    const customerId = customerRes.body.data._id;

    const pickupRes = await request(app)
      .post('/api/pickups')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        customer: customerId,
        pickupAddress: { address: '12 MG Road' },
        pickupDate: '2026-06-23',
        pickupTime: '10:00 AM',
        servicesRequested: [wash._id, iron._id],
        assignedDriver: driverId,
      });
    expect(pickupRes.status).toBe(201);
    expect(pickupRes.body.data.status).toBe('DRIVER_ASSIGNED');
    const pickupId = pickupRes.body.data._id;

    const acceptRes = await request(app)
      .patch(`/api/pickups/${pickupId}/accept`)
      .set('Authorization', `Bearer ${driver.accessToken}`);
    expect(acceptRes.status).toBe(200);

    const completeRes = await request(app)
      .patch(`/api/pickups/${pickupId}/complete`)
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send({ items: [{ clothType: shirt._id, quantity: 5 }], pickupRemarks: 'All good' });

    expect(completeRes.status).toBe(200);
    const order = completeRes.body.data.order;
    expect(order.currentStatus).toBe('PICKED_UP');
    expect(order.statusHistory.map((h: { status: string }) => h.status)).toEqual([
      'PICKUP_CREATED',
      'DRIVER_ASSIGNED',
      'PICKED_UP',
    ]);
    expect(order.services).toHaveLength(2);
    expect(order.services.every((s: { isCompleted: boolean }) => s.isCompleted === false)).toBe(true);

    // Forward-only transitions: skipping ahead should still work, but going backwards must not
    const advanceRes = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'RECEIVED_AT_LAUNDRY' });
    expect(advanceRes.status).toBe(200);
    expect(advanceRes.body.data.statusHistory).toHaveLength(4);

    const backwardsRes = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'PICKED_UP' });
    expect(backwardsRes.status).toBe(400);
  });
});
