import { Types } from 'mongoose';
import { billRepository } from '../repositories/bill.repository';
import { orderService } from './order.service';
import { ApiError } from '../utils/ApiError';
import { recordAudit } from '../audit/recordAudit';
import { generateInvoiceNumber } from '../utils/invoiceNumber';
import { UserRole, User } from '../models/User';
import { Pickup } from '../models/Pickup';
import { Payment } from '../models/Payment';
import { getSettings } from '../models/Settings';
import { notificationService } from './notification.service';

export const billService = {
  async generate(
    actorId: string,
    actorRole: UserRole,
    orderId: string,
    data: {
      extraCharges?: number;
      taxes?: number;
      pickupCharge?: number;
      deliveryCharge?: number;
      discountAmount?: number;
      discountReason?: string;
    },
  ) {
    const order = await orderService.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');

    const existing = await billRepository.findByOrder(orderId);
    if (existing && existing.paymentStatus !== 'PENDING') {
      throw ApiError.conflict('This bill already has payments recorded and cannot be regenerated');
    }

    const collectedItems = order.pickup
      ? ((await Pickup.findById(order.pickup).populate('collectedItems.clothType').populate('collectedItems.service'))
          ?.collectedItems ?? [])
      : order.collectedItems;

    const lineItems = collectedItems.map((item) => {
      const serviceDoc = item.service as unknown as { _id: Types.ObjectId; flatPrice?: number };
      if (!item.clothType) {
        const unitPrice = serviceDoc.flatPrice ?? 0;
        return { service: serviceDoc._id, quantity: 1, unitPrice, lineTotal: unitPrice };
      }
      const clothTypeDoc = item.clothType as unknown as { _id: Types.ObjectId; prices?: Map<string, number> };
      const unitPrice = clothTypeDoc.prices?.get(String(serviceDoc._id)) ?? 0;
      return {
        clothType: clothTypeDoc._id,
        service: serviceDoc._id,
        quantity: item.quantity,
        unitPrice,
        lineTotal: unitPrice * item.quantity,
      };
    });

    const subtotal = lineItems.reduce((sum, li) => sum + li.lineTotal, 0);
    const settings = await getSettings();
    const pickupCharge = data.pickupCharge ?? (order.isInStorePickup ? 0 : settings.homePickupCharge ?? 0);
    const deliveryCharge = data.deliveryCharge ?? (order.isInStoreDelivery ? 0 : settings.homeDeliveryCharge ?? 0);
    const extraCharges = data.extraCharges ?? 0;
    const taxes = data.taxes ?? 0;
    const baseAmount = subtotal + pickupCharge + deliveryCharge + extraCharges + taxes;

    let discount = existing?.discount;
    let discountHistory = existing?.discountHistory ?? [];
    if (data.discountAmount) {
      if (data.discountAmount > baseAmount) throw ApiError.badRequest('Discount cannot exceed the bill amount');
      discount = {
        originalAmount: baseAmount,
        discountAmount: data.discountAmount,
        finalAmount: baseAmount - data.discountAmount,
        reason: data.discountReason!,
        givenBy: actorId as unknown as Types.ObjectId,
        timestamp: new Date(),
      };
      discountHistory = [...discountHistory, discount];
    } else if (discount) {
      discount =
        discount.discountAmount > baseAmount
          ? undefined
          : { ...discount, originalAmount: baseAmount, finalAmount: baseAmount - discount.discountAmount };
    }

    const finalAmount = discount ? discount.finalAmount : baseAmount;

    let bill;
    if (existing) {
      existing.lineItems = lineItems;
      existing.pickupCharge = pickupCharge;
      existing.deliveryCharge = deliveryCharge;
      existing.extraCharges = extraCharges;
      existing.taxes = taxes;
      existing.subtotal = subtotal;
      existing.finalAmount = finalAmount;
      existing.discount = discount;
      existing.discountHistory = discountHistory;
      await existing.save();
      bill = existing;
      await recordAudit({ actor: actorId, actorRole, action: 'REGENERATE_BILL', entityType: 'Bill', entityId: bill._id, after: bill });
    } else {
      const invoiceNumber = await generateInvoiceNumber();
      bill = await billRepository.create({
        order: order._id,
        invoiceNumber,
        lineItems,
        pickupCharge,
        deliveryCharge,
        extraCharges,
        taxes,
        discount,
        discountHistory,
        subtotal,
        finalAmount,
        paymentStatus: 'PENDING',
        generatedBy: actorId as unknown as Types.ObjectId,
      });
      order.bill = bill._id;
      await order.save();
      await recordAudit({ actor: actorId, actorRole, action: 'GENERATE_BILL', entityType: 'Bill', entityId: bill._id, after: bill });
    }

    return billRepository.findById(String(bill._id));
  },

  async applyDiscount(actorId: string, actorRole: UserRole, billId: string, discountAmount: number, reason: string) {
    const bill = await billRepository.findById(billId);
    if (!bill) throw ApiError.notFound('Bill not found');
    if (bill.paymentStatus === 'PAID') throw ApiError.badRequest('Cannot apply a discount to an already paid bill');
    if (bill.amountPaid > 0) throw ApiError.badRequest('Cannot apply a discount after a payment has been recorded');
    if (discountAmount > bill.finalAmount) throw ApiError.badRequest('Discount cannot exceed the bill amount');

    const originalAmount = bill.finalAmount;
    const finalAmount = originalAmount - discountAmount;
    const discount = { originalAmount, discountAmount, finalAmount, reason, givenBy: actorId as unknown as Types.ObjectId, timestamp: new Date() };

    bill.discount = discount;
    bill.discountHistory.push(discount);
    bill.finalAmount = finalAmount;
    await bill.save();

    await recordAudit({ actor: actorId, actorRole, action: 'APPLY_DISCOUNT', entityType: 'Bill', entityId: bill._id, after: discount });

    return bill;
  },

  async removeDiscount(actorId: string, actorRole: UserRole, billId: string) {
    const bill = await billRepository.findById(billId);
    if (!bill) throw ApiError.notFound('Bill not found');
    if (!bill.discount) throw ApiError.badRequest('This bill has no discount to remove');
    if (bill.paymentStatus === 'PAID') throw ApiError.badRequest('Cannot modify an already paid bill');
    if (bill.amountPaid > 0) throw ApiError.badRequest('Cannot remove a discount after a payment has been recorded');

    const before = bill.discount;
    bill.finalAmount = bill.discount.originalAmount;
    bill.discount = undefined;
    await bill.save();

    await recordAudit({ actor: actorId, actorRole, action: 'REMOVE_DISCOUNT', entityType: 'Bill', entityId: bill._id, before });

    return bill;
  },

  async recordPayment(
    actorId: string,
    actorRole: UserRole,
    billId: string,
    splits: { amount: number; method: 'CASH' | 'UPI' | 'CARD' }[],
  ) {
    const bill = await billRepository.findById(billId);
    if (!bill) throw ApiError.notFound('Bill not found');
    if (bill.paymentStatus === 'PAID') throw ApiError.conflict('This bill has already been paid');
    if (splits.length === 0) throw ApiError.badRequest('At least one payment amount is required');

    const total = splits.reduce((sum, s) => sum + s.amount, 0);
    const balanceDue = bill.finalAmount - (bill.amountPaid ?? 0);
    if (total > balanceDue + 0.01) throw ApiError.badRequest('Amount exceeds the remaining balance due');

    const batchId = splits.length > 1 ? new Types.ObjectId() : undefined;
    const settledToAdmin = actorRole !== 'DRIVER';
    const payments = await Payment.insertMany(
      splits.map((s) => ({
        bill: bill._id,
        amount: s.amount,
        method: s.method,
        status: 'PAID',
        collectedBy: actorId,
        batchId,
        settledToAdmin,
      })),
    );

    bill.paymentMethod = splits[splits.length - 1].method;
    bill.amountPaid = (bill.amountPaid ?? 0) + total;
    bill.paymentStatus = bill.amountPaid >= bill.finalAmount ? 'PAID' : 'PARTIAL';
    await bill.save();

    await recordAudit({
      actor: actorId,
      actorRole,
      action: 'RECORD_PAYMENT',
      entityType: 'Payment',
      entityId: payments[0]._id,
      after: { splits, total, batchId },
    });

    const admins = await User.find({ role: { $in: ['ROOT_ADMIN', 'ADMIN'] } });
    const remaining = bill.finalAmount - bill.amountPaid;
    const methodSummary = splits.length > 1 ? splits.map((s) => `${s.method} ${s.amount}`).join(' + ') : splits[0].method;
    await notificationService.notifyMany(admins.map((a) => a._id), {
      type: 'PAYMENT_RECEIVED',
      title: 'Payment Received',
      body:
        remaining > 0.01
          ? `Partial payment of ${total} (${methodSummary}) received for invoice ${bill.invoiceNumber}. Balance due: ${remaining.toFixed(2)}.`
          : `Payment of ${total} (${methodSummary}) received for invoice ${bill.invoiceNumber}.`,
      payload: { billId: String(bill._id) },
    });

    return { bill, payments };
  },

  findById: billRepository.findById,
};
