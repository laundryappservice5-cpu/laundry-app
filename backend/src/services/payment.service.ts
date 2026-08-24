import { Payment } from '../models/Payment';
import { UserRole } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { recordAudit } from '../audit/recordAudit';

export const paymentService = {
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
