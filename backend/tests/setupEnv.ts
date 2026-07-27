import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(__dirname, '.mongo-test-config.json');
const { uri } = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')) as { uri: string };

process.env.MONGODB_URI = uri;
process.env.JWT_ACCESS_SECRET = 'jest-access-secret';
process.env.JWT_REFRESH_SECRET = 'jest-refresh-secret';
process.env.ROOT_ADMIN_MOBILE = '9999999999';
process.env.ROOT_ADMIN_PASSWORD = 'RootPass123';
process.env.CORS_ORIGINS = '';
