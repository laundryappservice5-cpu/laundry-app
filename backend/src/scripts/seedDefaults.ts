import { connectDB, disconnectDB } from '../config/db';
import { ClothType, DEFAULT_CLOTH_TYPES } from '../models/ClothType';
import { Service, DEFAULT_SERVICES } from '../models/Service';
import { logger } from '../config/logger';

async function main() {
  await connectDB();

  for (const name of DEFAULT_CLOTH_TYPES) {
    await ClothType.updateOne({ name }, { $setOnInsert: { name, isCustom: false } }, { upsert: true });
  }
  logger.info(`Seeded ${DEFAULT_CLOTH_TYPES.length} default cloth types`);

  for (const name of DEFAULT_SERVICES) {
    await Service.updateOne({ name }, { $setOnInsert: { name, isActive: true } }, { upsert: true });
  }
  logger.info(`Seeded ${DEFAULT_SERVICES.length} default services`);

  await disconnectDB();
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
