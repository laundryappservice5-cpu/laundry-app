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
import { isAtOrPastStage, OrderStage } from '../models/orderStages';
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
    if (!isAtOrPastStage(order.currentStatus as OrderStage, 'READY_FOR_DELIVERY')) {
      throw ApiError.badRequest('Bill can only be generated once the order is marked Ready for Delivery or later');
    }

    const existing = await billRepository.findByOrder(orderId);
    if (existing && existing.paymentStatus === 'PAID') {
      throw ApiError.conflict('This bill has already been paid and cannot be regenerated');
    }

    const collectedItems = order.pickup
      ? ((await Pickup.findById(order.pickup).populate('collectedItems.clothType').populate('collectedItems.service'))
          ?.collectedItems ?? [])
      : order.collectedItems;

    const lineItems = collectedItems.map((item) => {
      const clothTypeDoc = item.clothType as unknown as { _id: Types.ObjectId; prices?: Map<string, number> };
      const serviceDoc = item.service as unknown as { _id: Types.ObjectId };
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

  async recordPayment(actorId: string, actorRole: UserRole, billId: string, amount: number, method: 'CASH' | 'UPI' | 'CARD') {
    const bill = await billRepository.findById(billId);
    if (!bill) throw ApiError.notFound('Bill not found');
    if (bill.paymentStatus === 'PAID') throw ApiError.conflict('This bill has already been paid');

    const payment = await Payment.create({ bill: bill._id, amount, method, status: 'PAID', collectedBy: actorId });

    bill.paymentMethod = method;
    if (amount >= bill.finalAmount) {
      bill.paymentStatus = 'PAID';
    }
    await bill.save();

    await recordAudit({ actor: actorId, actorRole, action: 'RECORD_PAYMENT', entityType: 'Payment', entityId: payment._id, after: payment });

    const admins = await User.find({ role: { $in: ['ROOT_ADMIN', 'ADMIN'] } });
    await notificationService.notifyMany(admins.map((a) => a._id), {
      type: 'PAYMENT_RECEIVED',
      title: 'Payment Received',
      body: `Payment of ${amount} received via ${method} for invoice ${bill.invoiceNumber}.`,
      payload: { billId: String(bill._id) },
    });

    return { bill, payment };
  },

  findById: billRepository.findById,
};
