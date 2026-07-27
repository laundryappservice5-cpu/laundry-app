import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(__dirname, '.mongo-test-config.json');

export default async function globalSetup(): Promise<void> {
  const instance = await MongoMemoryServer.create();
  const uri = instance.getUri('laundry_jest');

  (globalThis as Record<string, unknown>).__MONGO_INSTANCE__ = instance;
  fs.writeFileSync(CONFIG_PATH, JSON.stringify({ uri }));
}
