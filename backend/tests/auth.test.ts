import request from 'supertest';
import { app, createRootAdmin } from './helpers';

describe('Auth', () => {
  it('logs in the root admin and excludes the password hash from the response', async () => {
    await createRootAdmin();

    const res = await request(app).post('/api/auth/login').send({ mobileNumber: '9999999999', password: 'RootPass123' });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('rejects an invalid password', async () => {
    await createRootAdmin();

    const res = await request(app).post('/api/auth/login').send({ mobileNumber: '9999999999', password: 'WrongPassword' });

    expect(res.status).toBe(401);
  });

  it('only allows ROOT_ADMIN to create admins', async () => {
    await createRootAdmin();
    const { accessToken } = await request(app)
      .post('/api/auth/login')
      .send({ mobileNumber: '9999999999', password: 'RootPass123' })
      .then((r) => r.body.data);

    const res = await request(app)
      .post('/api/auth/admins')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Staff Admin', mobileNumber: '8888888888', password: 'AdminPass123', confirmPassword: 'AdminPass123' });

    expect(res.status).toBe(201);
    expect(res.body.data.passwordHash).toBeUndefined();
    expect(res.body.data.role).toBe('ADMIN');
  });

  it('rejects admin creation without auth', async () => {
    const res = await request(app)
      .post('/api/auth/admins')
      .send({ name: 'Staff Admin', mobileNumber: '8888888888', password: 'AdminPass123', confirmPassword: 'AdminPass123' });

    expect(res.status).toBe(401);
  });
});
