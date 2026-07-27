import mongoose from 'mongoose';
import { env } from '../src/config/env';

beforeAll(async () => {
  await mongoose.connect(env.mongodbUri);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
});
