import { Types, PipelineStage } from 'mongoose';
import { Payment } from '../models/Payment';
import { Bill } from '../models/Bill';
import { UserRole } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { recordAudit } from '../audit/recordAudit';

interface PaymentListFilter {
  dateFrom?: string;
  dateTo?: string;
  method?: string;
  minAmount?: number;
  maxAmount?: number;
  orderId?: string;
  search?: string;
}

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export const paymentService = {
  async list(filter: PaymentListFilter, skip: number, limit: number) {
    const match: Record<string, unknown> = {};
    if (filter.dateFrom || filter.dateTo) {
      const range: Record<string, Date> = {};
      if (filter.dateFrom) range.$gte = new Date(filter.dateFrom);
      if (filter.dateTo) range.$lte = new Date(filter.dateTo);
      match.createdAt = range;
    }
    if (filter.method) match.method = filter.method;
    if (filter.minAmount !== undefined || filter.maxAmount !== undefined) {
      const range: Record<string, number> = {};
      if (filter.minAmount !== undefined) range.$gte = filter.minAmount;
      if (filter.maxAmount !== undefined) range.$lte = filter.maxAmount;
      match.amount = range;
    }

    const pipeline: PipelineStage[] = [
      { $match: match },
      { $lookup: { from: 'bills', localField: 'bill', foreignField: '_id', as: 'bill' } },
      { $unwind: '$bill' },
      { $lookup: { from: 'orders', localField: 'bill.order', foreignField: '_id', as: 'order' } },
      { $unwind: '$order' },
      { $lookup: { from: 'customers', localField: 'order.customer', foreignField: '_id', as: 'customer' } },
      { $unwind: '$customer' },
    ];

    if (filter.orderId) {
      pipeline.push({ $match: { 'order._id': new Types.ObjectId(filter.orderId) } });
    }
    if (filter.search) {
      const regex = new RegExp(filter.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      pipeline.push({ $match: { $or: [{ 'customer.name': regex }, { 'customer.mobileNumber': regex }] } });
    }

    pipeline.push(
      { $lookup: { from: 'users', localField: 'collectedBy', foreignField: '_id', as: 'collectedBy' } },
      { $unwind: '$collectedBy' },
      { $sort: { createdAt: -1 } },
    );

    const [rows, totalAgg] = await Promise.all([
      Payment.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]),
      Payment.aggregate([...pipeline, { $count: 'total' }]),
    ]);

    return [rows, totalAgg[0]?.total ?? 0] as const;
  },

  async summary() {
    const today = startOfDay();
    const monthStart = startOfMonth();

    const [totalAgg, todayAgg, monthAgg, pendingAgg] = await Promise.all([
      Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.aggregate([{ $match: { createdAt: { $gte: today } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.aggregate([{ $match: { createdAt: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Bill.aggregate([
        { $match: { paymentStatus: { $in: ['PENDING', 'PARTIAL'] } } },
        { $group: { _id: null, total: { $sum: { $subtract: ['$finalAmount', '$amountPaid'] } } } },
      ]),
    ]);

    return {
      totalCollected: totalAgg[0]?.total ?? 0,
      todaysCollection: todayAgg[0]?.total ?? 0,
      monthsCollection: monthAgg[0]?.total ?? 0,
      pendingAmount: pendingAgg[0]?.total ?? 0,
      // Refunds aren't a supported concept yet.
      refunds: 0,
    };
  },

  async pendingByDriver() {
    return Payment.aggregate([
      { $match: { settledToAdmin: false } },
      { $group: { _id: '$collectedBy', totalPending: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'driver' } },
      { $unwind: '$driver' },
      { $project: { driverId: '$_id', driverName: '$driver.name', totalPending: 1, count: 1, _id: 0 } },
      { $sort: { totalPending: -1 } },
    ]);
  },

  async pendingForDriver(driverId: string) {
    return Payment.find({ collectedBy: driverId, settledToAdmin: false })
      .sort({ createdAt: -1 })
      .populate({ path: 'bill', populate: { path: 'order' } });
  },

  async settle(actorId: string, actorRole: UserRole, paymentIds: string[]) {
    if (paymentIds.length === 0) throw ApiError.badRequest('Select at least one payment to mark as received');

    const payments = await Payment.find({ _id: { $in: paymentIds } });
    if (payments.length !== paymentIds.length) throw ApiError.notFound('One or more payments were not found');
    if (payments.some((p) => p.settledToAdmin)) {
      throw ApiError.conflict('One or more of these payments have already been marked as received');
    }

    const now = new Date();
    await Payment.updateMany({ _id: { $in: paymentIds } }, { $set: { settledToAdmin: true, settledAt: now, settledBy: actorId } });

    await recordAudit({
      actor: actorId,
      actorRole,
      action: 'SETTLE_DRIVER_PAYMENTS',
      entityType: 'Payment',
      entityId: paymentIds[0],
      after: { paymentIds, count: paymentIds.length, total: payments.reduce((sum, p) => sum + p.amount, 0) },
    });

    return Payment.find({ _id: { $in: paymentIds } }).populate('collectedBy').populate('settledBy');
  },
};
