import { Order } from '../models/Order';
import { Bill } from '../models/Bill';
import { Pickup } from '../models/Pickup';
import { Customer } from '../models/Customer';
import { User } from '../models/User';
import { Payment } from '../models/Payment';

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export const reportService = {
  async dashboard() {
    const today = startOfDay();
    const monthStart = startOfMonth();

    const [
      todaysPickups,
      pendingPickups,
      laundryInProgress,
      readyForDelivery,
      expressOrders,
      deliveredOrders,
      pendingPaymentBills,
      dailyRevenueAgg,
      monthlyRevenueAgg,
      customerCount,
      driverCount,
    ] = await Promise.all([
      Pickup.countDocuments({ createdAt: { $gte: today } }),
      Pickup.countDocuments({ status: { $in: ['CREATED', 'DRIVER_ASSIGNED', 'ACCEPTED'] } }),
      Order.countDocuments({ currentStatus: { $nin: ['READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERED'] } }),
      Order.countDocuments({ currentStatus: 'READY_FOR_DELIVERY' }),
      Order.countDocuments({ $or: [{ isExpressPickup: true }, { isExpressDelivery: true }], currentStatus: { $ne: 'DELIVERED' } }),
      Order.countDocuments({ currentStatus: 'DELIVERED', updatedAt: { $gte: today } }),
      Bill.countDocuments({ paymentStatus: { $in: ['PENDING', 'PARTIAL'] } }),
      Payment.aggregate([{ $match: { createdAt: { $gte: today } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.aggregate([{ $match: { createdAt: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Customer.countDocuments(),
      User.countDocuments({ role: 'DRIVER', isActive: true }),
    ]);

    return {
      todaysPickups,
      pendingPickups,
      laundryInProgress,
      readyForDelivery,
      expressOrders,
      deliveredOrdersToday: deliveredOrders,
      pendingPayments: pendingPaymentBills,
      dailyRevenue: dailyRevenueAgg[0]?.total ?? 0,
      monthlyRevenue: monthlyRevenueAgg[0]?.total ?? 0,
      customerCount,
      driverCount,
    };
  },

  async revenueChart(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    return Payment.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$amount' } } },
      { $sort: { _id: 1 } },
    ]);
  },

  async orderStatusChart() {
    return Order.aggregate([{ $group: { _id: '$currentStatus', count: { $sum: 1 } } }]);
  },

  async driverPerformance() {
    return Order.aggregate([
      { $match: { currentStatus: 'DELIVERED' } },
      { $group: { _id: '$driver', completedOrders: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'driver' } },
      { $unwind: '$driver' },
      { $project: { driverName: '$driver.name', completedOrders: 1 } },
    ]);
  },

  async adminPerformance() {
    return Bill.aggregate([
      { $group: { _id: '$generatedBy', billsGenerated: { $sum: 1 }, totalRevenue: { $sum: '$finalAmount' } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'admin' } },
      { $unwind: '$admin' },
      { $project: { adminName: '$admin.name', billsGenerated: 1, totalRevenue: 1 } },
    ]);
  },

  async discountsReport() {
    return Bill.find({ discount: { $exists: true } })
      .select('invoiceNumber discount')
      .sort({ 'discount.timestamp': -1 });
  },

  async paymentsReport(skip: number, limit: number) {
    const groupStage = {
      $group: {
        _id: { $ifNull: ['$batchId', '$_id'] },
        createdAt: { $min: '$createdAt' },
        bill: { $first: '$bill' },
        collectedBy: { $first: '$collectedBy' },
        amount: { $sum: '$amount' },
        legs: { $push: { amount: '$amount', method: '$method' } },
        settledToAdmin: { $first: '$settledToAdmin' },
      },
    };

    const [rows, totalAgg] = await Promise.all([
      Payment.aggregate([{ $sort: { createdAt: -1 } }, groupStage, { $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: limit }]),
      Payment.aggregate([groupStage, { $count: 'total' }]),
    ]);

    const populated = await Payment.populate(rows, [{ path: 'bill' }, { path: 'collectedBy' }]);
    return [populated, totalAgg[0]?.total ?? 0] as const;
  },

  async repeatCustomers() {
    return Order.aggregate([
      { $group: { _id: '$customer', orderCount: { $sum: 1 } } },
      { $match: { orderCount: { $gt: 1 } } },
      { $lookup: { from: 'customers', localField: '_id', foreignField: '_id', as: 'customer' } },
      { $unwind: '$customer' },
      { $project: { name: '$customer.name', mobileNumber: '$customer.mobileNumber', orderCount: 1 } },
      { $sort: { orderCount: -1 } },
    ]);
  },

  async pendingVsCompleted() {
    const [pending, completed] = await Promise.all([
      Order.countDocuments({ currentStatus: { $ne: 'DELIVERED' } }),
      Order.countDocuments({ currentStatus: 'DELIVERED' }),
    ]);
    return { pending, completed };
  },

  async expressOrdersReport() {
    return Order.find({ $or: [{ isExpressPickup: true }, { isExpressDelivery: true }] })
      .sort({ createdAt: -1 })
      .populate('customer')
      .populate('driver');
  },
};
