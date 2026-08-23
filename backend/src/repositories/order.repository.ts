import { Order, IOrder } from '../models/Order';
import { Bill, PaymentStatus } from '../models/Bill';
import { OrderStage } from '../models/orderStages';

interface OrderListFilter {
  currentStatus?: OrderStage | OrderStage[];
  excludeStatus?: OrderStage[];
  driver?: string;
  isExpress?: boolean;
  updatedToday?: boolean;
  paymentStatus?: PaymentStatus;
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
    if (filter.paymentStatus) {
      const billIds = await Bill.find({ paymentStatus: filter.paymentStatus }).distinct('_id');
      query.bill = { $in: billIds };
    }

    return Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('customer').populate('driver'),
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
