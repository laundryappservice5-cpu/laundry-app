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
    .send({ name: 'Driver One', mobileNumber: '7000000002', password: 'DriverPass123' });
  const driverOneId = driverRes.body.data.id;
  const driverOne = await loginAs('7000000002', 'DriverPass123');

  const driverTwoRes = await request(app)
    .post('/api/drivers')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ name: 'Driver Two', mobileNumber: '7000000003', password: 'DriverPass123' });
  const driverTwo = await loginAs('7000000003', 'DriverPass123');

  return { admin, driverOne, driverOneId, driverTwo };
}

describe('Driver self-assignment', () => {
  it('lets a driver claim an unassigned pickup, and blocks a second driver from claiming the same one', async () => {
    const { admin, driverOne, driverTwo } = await setupAdminAndDriver();
    const { wash } = await seedCatalog();

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
        pickupDate: '2026-06-25',
        pickupTime: '10:00 AM',
        servicesRequested: [wash._id],
      });
    expect(pickupRes.body.data.status).toBe('CREATED');
    const pickupId = pickupRes.body.data._id;

    const availableRes = await request(app)
      .get('/api/pickups/available')
      .set('Authorization', `Bearer ${driverOne.accessToken}`);
    expect(availableRes.body.data.map((p: { _id: string }) => p._id)).toContain(pickupId);

    const claimRes = await request(app)
      .patch(`/api/pickups/${pickupId}/self-assign`)
      .set('Authorization', `Bearer ${driverOne.accessToken}`);
    expect(claimRes.status).toBe(200);
    expect(claimRes.body.data.status).toBe('ACCEPTED');

    const secondClaimRes = await request(app)
      .patch(`/api/pickups/${pickupId}/self-assign`)
      .set('Authorization', `Bearer ${driverTwo.accessToken}`);
    expect(secondClaimRes.status).toBe(409);
  });
});

describe('Driver stage-transition restrictions', () => {
  it('blocks a driver from advancing internal processing stages but allows the store/delivery boundary stages', async () => {
    const { admin, driverOne, driverOneId } = await setupAdminAndDriver();
    const { wash, shirt } = await seedCatalog();

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
        pickupDate: '2026-06-25',
        pickupTime: '10:00 AM',
        servicesRequested: [wash._id],
        assignedDriver: driverOneId,
      });
    const pickupId = pickupRes.body.data._id;

    await request(app).patch(`/api/pickups/${pickupId}/accept`).set('Authorization', `Bearer ${driverOne.accessToken}`);
    const completeRes = await request(app)
      .patch(`/api/pickups/${pickupId}/complete`)
      .set('Authorization', `Bearer ${driverOne.accessToken}`)
      .send({ items: [{ clothType: shirt._id, quantity: 2 }] });
    const orderId = completeRes.body.data.order._id;
    expect(completeRes.body.data.order.currentStatus).toBe('PICKED_UP');

    // Driver-allowed: PICKED_UP -> RECEIVED_AT_LAUNDRY ("Delivered to Store")
    const storeRes = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${driverOne.accessToken}`)
      .send({ status: 'RECEIVED_AT_LAUNDRY', itemCount: 2 });
    expect(storeRes.status).toBe(200);
    expect(storeRes.body.data.currentStatus).toBe('RECEIVED_AT_LAUNDRY');
    expect(storeRes.body.data.statusHistory.at(-1).itemCount).toBe(2);

    // Driver-blocked: RECEIVED_AT_LAUNDRY -> READY_FOR_DELIVERY is admin/staff territory
    const readyAsDriverRes = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${driverOne.accessToken}`)
      .send({ status: 'READY_FOR_DELIVERY' });
    expect(readyAsDriverRes.status).toBe(403);

    // Admin can do it instead
    const readyAsAdminRes = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'READY_FOR_DELIVERY' });
    expect(readyAsAdminRes.status).toBe(200);
  });
});
