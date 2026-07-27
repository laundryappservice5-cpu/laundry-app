import fs from 'fs';
import path from 'path';
import { MongoMemoryServer } from 'mongodb-memory-server';

const CONFIG_PATH = path.join(__dirname, '.mongo-test-config.json');

export default async function globalTeardown(): Promise<void> {
  const instance = (globalThis as Record<string, unknown>).__MONGO_INSTANCE__ as MongoMemoryServer | undefined;
  if (instance) {
    await instance.stop();
  }
  if (fs.existsSync(CONFIG_PATH)) {
    fs.unlinkSync(CONFIG_PATH);
  }
}
