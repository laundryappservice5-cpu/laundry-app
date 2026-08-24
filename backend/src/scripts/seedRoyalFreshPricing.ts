import { connectDB, disconnectDB } from '../config/db';
import { ClothType } from '../models/ClothType';
import { Service } from '../models/Service';
import { Settings, getSettings } from '../models/Settings';
import { logger } from '../config/logger';

// Renames existing default cloth types to match the official price list naming,
// only when the target name isn't already taken by a separate entry.
const RENAMES: [string, string][] = [
  ['Saree', 'Sari'],
  ['Pillow Cover', 'Pillow Case'],
  ['Blanket', 'Blanket S'],
  ['Bedsheet', 'Bedsheet S'],
  ['Curtain', 'Curtain (Blackout)'],
  ['Blazer', 'Jacket / Blazer'],
  ['Coat', 'Overcoat'],
  ['Suit', 'Suit (2 Pcs)'],
];

// [name, Press price, Clean+Press (Dry Cleaning) price] — undefined means "not offered"
const PRICE_ROWS: [string, number | undefined, number | undefined][] = [
  // Men's garments
  ['Shirt', 4, 9],
  ['Silk Shirt', 6, 12],
  ['Pant', 5, 10],
  ['Jeans', 5, 10],
  ['Suit (2 Pcs)', 20, 35],
  ['Suit (3 Pcs)', 25, 45],
  ['Jacket / Blazer', 12, 22],
  ['Kandura / Thobe', 8, 15],
  ['Ghutra', 3, 6],
  ['T-Shirt', 4, 8],
  ['Polo Shirt', 4, 8],
  ['Waistcoat', 8, 15],
  ['Overcoat', 20, 35],
  ['Tie', 3, 6],
  ['Scarf', 4, 7],
  // Ladies' garments
  ['Blouse', 4, 9],
  ['Silk Blouse', 5, 10],
  ['Skirt', 3, 6],
  ['Skirt (Short/Normal)', 4, 12],
  ['Skirt (Long/Plaza)', 10, 20],
  ['Dress (Regular)', 15, 30],
  ['Evening Dress', 25, 50],
  ['Ladies Suit (2Pcs)', 25, 40],
  ['Sari', 25, 40],
  ['Abaya', 8, 15],
  // Household items
  ['Bedsheet S', 7, 10],
  ['Bedsheet D', 8, 12],
  ['Duvet Cover S', 9, 12],
  ['Duvet Cover D', 10, 14],
  ['Pillow Case', 3, 6],
  ['Blanket S', undefined, 30],
  ['Blanket D', undefined, 35],
  ['Duvet S', undefined, 40],
  ['Bath Towel', undefined, 6],
  ['Curtain (Blackout)', 35, 100],
  ['Curtain (Netted)', 30, 50],
  ['Carpet (per m²)', undefined, 35],
  ['Wool Carpet (m²)', undefined, 45],
];

async function main() {
  await connectDB();

  const pressService = await Service.findOne({ name: 'Press' });
  const dryCleaningService = await Service.findOne({ name: 'Dry Cleaning' });
  if (!pressService || !dryCleaningService) {
    throw new Error('Press / Dry Cleaning services not found — run `npm run seed:defaults` first');
  }

  for (const [from, to] of RENAMES) {
    const existing = await ClothType.findOne({ name: from });
    if (!existing) continue;
    const clash = await ClothType.findOne({ name: to });
    if (clash) continue;
    existing.name = to;
    await existing.save();
    logger.info(`Renamed cloth type "${from}" -> "${to}"`);
  }

  let created = 0;
  let updated = 0;
  for (const [name, pressPrice, cpPrice] of PRICE_ROWS) {
    let clothType = await ClothType.findOne({ name });
    if (!clothType) {
      clothType = await ClothType.create({ name, isCustom: false });
      created++;
    } else {
      updated++;
    }
    if (pressPrice !== undefined) clothType.prices.set(String(pressService._id), pressPrice);
    if (cpPrice !== undefined) clothType.prices.set(String(dryCleaningService._id), cpPrice);
    await clothType.save();
  }
  logger.info(`Cloth type pricing seeded from The Royal Fresh Laundry price list: ${created} created, ${updated} updated`);

  const settings = await getSettings();
  await Settings.findByIdAndUpdate(settings._id, {
    businessName: settings.businessName || 'The Royal Fresh Laundry',
    address: settings.address || 'Dubai, UAE',
    supportPhone: settings.supportPhone || '0529916885',
  });
  logger.info('Business settings confirmed (only filled in blanks, did not overwrite existing values)');

  await disconnectDB();
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
