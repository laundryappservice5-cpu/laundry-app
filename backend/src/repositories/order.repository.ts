import { Order, IOrder } from '../models/Order';
import { Bill, PaymentStatus } from '../models/Bill';
import { Customer } from '../models/Customer';
import { OrderStage } from '../models/orderStages';

interface OrderListFilter {
  currentStatus?: OrderStage | OrderStage[];
  excludeStatus?: OrderStage[];
  driver?: string;
  isExpress?: boolean;
  updatedToday?: boolean;
  paymentStatus?: PaymentStatus;
  search?: string;
  service?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
}

function intersectIds(a: unknown[], b: unknown[]): unknown[] {
  const bSet = new Set(b.map(String));
  return a.filter((id) => bSet.has(String(id)));
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export const orderRepository = {
  create(data: Partial<IOrder>) {
    return Order.create(data);
  },
  findById(id: string) {
    return Order.findById(id)
      .populate('customer')
      .populate('driver')
      .populate({
        path: 'pickup',
        populate: [{ path: 'collectedItems.clothType' }, { path: 'collectedItems.service' }],
      })
      .populate('collectedItems.clothType')
      .populate('collectedItems.service')
      .populate('bill');
  },
  update(id: string, data: Partial<IOrder>) {
    return Order.findByIdAndUpdate(id, data, { new: true });
  },
  async list(filter: OrderListFilter, skip: number, limit: number) {
    const query: Record<string, unknown> = {};
    if (filter.currentStatus) {
      query.currentStatus = Array.isArray(filter.currentStatus) ? { $in: filter.currentStatus } : filter.currentStatus;
    }
    if (filter.excludeStatus?.length) {
      query.currentStatus = { ...(query.currentStatus as object), $nin: filter.excludeStatus };
    }
    if (filter.driver) query.driver = filter.driver;
    if (filter.isExpress) query.$or = [{ isExpressPickup: true }, { isExpressDelivery: true }];
    if (filter.updatedToday) query.updatedAt = { $gte: startOfToday() };
    if (filter.service) query['collectedItems.service'] = filter.service;
    if (filter.dateFrom || filter.dateTo) {
      const range: Record<string, Date> = {};
      if (filter.dateFrom) range.$gte = new Date(filter.dateFrom);
      if (filter.dateTo) range.$lte = new Date(filter.dateTo);
      query.createdAt = range;
    }
    if (filter.search) {
      const regex = new RegExp(filter.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const customerIds = await Customer.find({ $or: [{ name: regex }, { mobileNumber: regex }] }).distinct('_id');
      query.customer = { $in: customerIds };
    }

    // paymentStatus and amount-range both narrow by bill — resolve each to a bill-id
    // set and intersect them, rather than clobbering each other on `query.bill`.
    if (filter.paymentStatus || filter.minAmount !== undefined || filter.maxAmount !== undefined) {
      let billIds: unknown[] | undefined;
      if (filter.paymentStatus) {
        billIds = await Bill.find({ paymentStatus: filter.paymentStatus }).distinct('_id');
      }
      if (filter.minAmount !== undefined || filter.maxAmount !== undefined) {
        const amountRange: Record<string, number> = {};
        if (filter.minAmount !== undefined) amountRange.$gte = filter.minAmount;
        if (filter.maxAmount !== undefined) amountRange.$lte = filter.maxAmount;
        const amountBillIds = await Bill.find({ finalAmount: amountRange }).distinct('_id');
        billIds = billIds ? intersectIds(billIds, amountBillIds) : amountBillIds;
      }
      query.bill = { $in: billIds };
    }

    return Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('customer').populate('driver').populate('bill'),
      Order.countDocuments(query),
    ]);
  },
  listForDriver(driverId: string) {
    return Order.find({ driver: driverId, currentStatus: { $in: ['READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY'] } })
      .sort({ createdAt: -1 })
      .populate('customer')
      .populate('bill');
  },
  listAvailableForDelivery() {
    return Order.find({ currentStatus: 'READY_FOR_DELIVERY', isInStoreDelivery: { $ne: true } })
      .sort({ createdAt: -1 })
      .populate('customer')
      .populate('driver');
  },
  listMyStoreDropoffs(driverId: string) {
    return Order.find({ driver: driverId, currentStatus: 'PICKED_UP' })
      .sort({ createdAt: -1 })
      .populate('customer')
      .populate('pickup');
  },
  listMyHistory(driverId: string) {
    return Order.find({ driver: driverId, currentStatus: 'DELIVERED' })
      .sort({ updatedAt: -1 })
      .populate('customer')
      .populate('bill');
  },
};
