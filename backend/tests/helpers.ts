import bcrypt from 'bcryptjs';
import request from 'supertest';
import { createApp } from '../src/app';
import { User } from '../src/models/User';
import { Service } from '../src/models/Service';
import { ClothType } from '../src/models/ClothType';

export const app = createApp();

export async function createRootAdmin(mobileNumber = '9999999999', password = 'RootPass123') {
  const passwordHash = await bcrypt.hash(password, 10);
  return User.create({ name: 'Root Admin', mobileNumber, passwordHash, role: 'ROOT_ADMIN' });
}

export async function loginAs(mobileNumber: string, password: string) {
  const res = await request(app).post('/api/auth/login').send({ mobileNumber, password });
  return res.body.data as { accessToken: string; refreshToken: string; user: { id: string } };
}

export async function seedCatalog() {
  const [wash, iron] = await Service.create([{ name: 'Wash' }, { name: 'Iron' }]);
  const [shirt] = await ClothType.create([{ name: 'Shirt' }]);
  return { wash, iron, shirt };
}
