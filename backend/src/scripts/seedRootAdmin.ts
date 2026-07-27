import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db';
import { env } from '../config/env';
import { User } from '../models/User';
import { logger } from '../config/logger';

async function main() {
  if (!env.rootAdmin.mobileNumber || !env.rootAdmin.password) {
    throw new Error('Set ROOT_ADMIN_MOBILE and ROOT_ADMIN_PASSWORD in .env before seeding');
  }

  await connectDB();

  const existing = await User.findOne({ role: 'ROOT_ADMIN' });
  if (existing) {
    logger.warn(`Root Admin already exists (mobile: ${existing.mobileNumber}). Skipping.`);
  } else {
    const passwordHash = await bcrypt.hash(env.rootAdmin.password, 10);
    const rootAdmin = await User.create({
      name: 'Root Admin',
      mobileNumber: env.rootAdmin.mobileNumber,
      passwordHash,
      role: 'ROOT_ADMIN',
    });
    logger.info(`Root Admin created with mobile number: ${rootAdmin.mobileNumber}`);
  }

  await disconnectDB();
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
