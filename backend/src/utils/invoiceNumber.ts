import { Counter } from '../models/Counter';

export async function generateInvoiceNumber(): Promise<string> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const key = `invoice-${yearMonth}`;
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true },
  );
  return `INV-${yearMonth}-${String(counter.seq).padStart(4, '0')}`;
}
