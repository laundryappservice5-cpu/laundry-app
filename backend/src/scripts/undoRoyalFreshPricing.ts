import { connectDB, disconnectDB } from '../config/db';
import { ClothType } from '../models/ClothType';
import { Service } from '../models/Service';
import { Settings, getSettings } from '../models/Settings';
import { logger } from '../config/logger';

// Reverses seedRoyalFreshPricing.ts exactly.
const RENAMES_BACK: [string, string][] = [
  ['Sari', 'Saree'],
  ['Pillow Case', 'Pillow Cover'],
  ['Blanket S', 'Blanket'],
  ['Bedsheet S', 'Bedsheet'],
  ['Curtain (Blackout)', 'Curtain'],
  ['Jacket / Blazer', 'Blazer'],
  ['Overcoat', 'Coat'],
  ['Suit (2 Pcs)', 'Suit'],
];

// Newly created cloth types to delete outright.
const CREATED_NAMES = [
  'Silk Shirt',
  'Suit (3 Pcs)',
  'Kandura / Thobe',
  'Ghutra',
  'Polo Shirt',
  'Waistcoat',
  'Tie',
  'Scarf',
  'Blouse',
  'Silk Blouse',
  'Skirt',
  'Skirt (Short/Normal)',
  'Skirt (Long/Plaza)',
  'Dress (Regular)',
  'Evening Dress',
  'Ladies Suit (2Pcs)',
  'Abaya',
  'Bedsheet D',
  'Blanket D',
  'Duvet Cover S',
  'Duvet Cover D',
  'Duvet S',
  'Bath Towel',
  'Curtain (Netted)',
  'Carpet (per m²)',
  'Wool Carpet (m²)',
];

// Pre-existing cloth types that only had their Press/Dry Cleaning prices set (not created/renamed).
const PRICE_ONLY_NAMES = ['Shirt', 'T-Shirt', 'Pant', 'Jeans'];

async function main() {
  await connectDB();

  const pressService = await Service.findOne({ name: 'Press' });
  const dryCleaningService = await Service.findOne({ name: 'Dry Cleaning' });
  if (!pressService || !dryCleaningService) throw new Error('Press / Dry Cleaning services not found');

  // Delete newly created cloth types
  const deleteResult = await ClothType.deleteMany({ name: { $in: CREATED_NAMES } });
  logger.info(`Deleted ${deleteResult.deletedCount} newly created cloth types`);

  // Clear the Press/Dry Cleaning prices we set on renamed + pre-existing items, then rename back
  const priceCleared: string[] = [];
  for (const [current] of RENAMES_BACK) {
    const ct = await ClothType.findOne({ name: current });
    if (ct) {
      ct.prices.delete(String(pressService._id));
      ct.prices.delete(String(dryCleaningService._id));
      await ct.save();
      priceCleared.push(current);
    }
  }
  for (const name of PRICE_ONLY_NAMES) {
    const ct = await ClothType.findOne({ name });
    if (ct) {
      ct.prices.delete(String(pressService._id));
      ct.prices.delete(String(dryCleaningService._id));
      await ct.save();
      priceCleared.push(name);
    }
  }
  logger.info(`Cleared Press/Dry Cleaning prices on: ${priceCleared.join(', ')}`);

  // Rename back
  for (const [current, original] of RENAMES_BACK) {
    const existing = await ClothType.findOne({ name: current });
    if (!existing) continue;
    const clash = await ClothType.findOne({ name: original });
    if (clash) {
      logger.warn(`Skipped renaming "${current}" back to "${original}" — that name already exists`);
      continue;
    }
    existing.name = original;
    await existing.save();
    logger.info(`Renamed cloth type "${current}" -> "${original}"`);
  }

  // Revert business settings only if they still match exactly what the seed script set
  const settings = await getSettings();
  const updates: Record<string, string> = {};
  if (settings.address === 'Dubai, UAE') updates.address = '';
  if (settings.supportPhone === '0529916885') updates.supportPhone = '';
  if (Object.keys(updates).length > 0) {
    await Settings.findByIdAndUpdate(settings._id, updates);
    logger.info(`Reverted business settings fields: ${Object.keys(updates).join(', ')}`);
  } else {
    logger.info('Business settings were changed since the seed ran — left untouched');
  }

  await disconnectDB();
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
