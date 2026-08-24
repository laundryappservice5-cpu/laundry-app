import request from 'supertest';
import { app, createRootAdmin, loginAs, seedCatalog } from './helpers';

describe('Catalog delete', () => {
  it('deletes a cloth type and a service, and blocks non-admins', async () => {
    await createRootAdmin();
    const admin = await loginAs('9999999999', 'RootPass123');
    const { shirt, wash } = await seedCatalog();

    await request(app)
      .post('/api/drivers')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Driver One', mobileNumber: '7000000003', password: 'DriverPass123' });
    const driver = await loginAs('7000000003', 'DriverPass123');

    const forbiddenClothType = await request(app)
      .delete(`/api/cloth-types/${shirt._id}`)
      .set('Authorization', `Bearer ${driver.accessToken}`);
    expect(forbiddenClothType.status).toBe(403);

    const deleteClothType = await request(app)
      .delete(`/api/cloth-types/${shirt._id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(deleteClothType.status).toBe(200);

    const listAfter = await request(app).get('/api/cloth-types').set('Authorization', `Bearer ${admin.accessToken}`);
    expect(listAfter.body.data.find((c: { _id: string }) => c._id === String(shirt._id))).toBeUndefined();

    const notFoundAgain = await request(app)
      .delete(`/api/cloth-types/${shirt._id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(notFoundAgain.status).toBe(404);

    const deleteService = await request(app)
      .delete(`/api/services/${wash._id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(deleteService.status).toBe(200);

    const servicesAfter = await request(app).get('/api/services').set('Authorization', `Bearer ${admin.accessToken}`);
    expect(servicesAfter.body.data.find((s: { _id: string }) => s._id === String(wash._id))).toBeUndefined();
  });
});
