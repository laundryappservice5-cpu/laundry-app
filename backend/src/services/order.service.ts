import { Types } from 'mongoose';
import { orderRepository } from '../repositories/order.repository';
import { IPickup } from '../models/Pickup';
import { ApiError } from '../utils/ApiError';
import { recordAudit } from '../audit/recordAudit';
import { ORDER_STAGES, OrderStage, isForwardTransition } from '../models/orderStages';
import { UserRole, User } from '../models/User';
import { notificationService } from './notification.service';

const DRIVER_ALLOWED_TRANSITIONS: Array<[OrderStage, OrderStage]> = [
  ['PICKED_UP', 'RECEIVED_AT_LAUNDRY'],
  ['READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY'],
  ['OUT_FOR_DELIVERY', 'DELIVERED'],
];

function isDriverAllowedTransition(current: OrderStage, next: OrderStage): boolean {
  return DRIVER_ALLOWED_TRANSITIONS.some(([from, to]) => from === current && to === next);
}

export const orderService = {
  async createFromPickup(pickup: IPickup, actorId: string, actorRole: UserRole) {
    const now = new Date();
    const order = await orderRepository.create({
      pickup: pickup._id,
      customer: pickup.customer,
      driver: pickup.assignedDriver,
      services: pickup.servicesRequested.map((service) => ({ service, isCompleted: false })),
      currentStatus: 'PICKED_UP',
      statusHistory: [
        { status: 'PICKUP_CREATED', timestamp: pickup.createdAt, updatedBy: pickup.createdBy },
        ...(pickup.assignedDriver
          ? [{ status: 'DRIVER_ASSIGNED' as OrderStage, timestamp: now, updatedBy: pickup.assignedDriver as Types.ObjectId }]
          : []),
        { status: 'PICKED_UP', timestamp: now, updatedBy: actorId as unknown as Types.ObjectId, remarks: pickup.pickupRemarks },
      ],
      isExpressPickup: pickup.isExpressPickup,
      isExpressDelivery: pickup.isExpressDelivery,
      isInStoreDelivery: pickup.isInStoreDelivery,
    });

    await recordAudit({ actor: actorId, actorRole, action: 'CREATE_ORDER_FROM_PICKUP', entityType: 'Order', entityId: order._id, after: order });

    const admins = await User.find({ role: { $in: ['ROOT_ADMIN', 'ADMIN'] } });
    await notificationService.notifyMany(admins.map((a) => a._id), {
      type: 'PICKUP_COMPLETED',
      title: 'Pickup Completed',
      body: `Pickup for order ${order._id} has been completed by the driver.`,
      payload: { orderId: String(order._id) },
    });

    return order;
  },

  async createInStore(
    actorId: string,
    actorRole: UserRole,
    data: {
      customer: string;
      servicesRequested: string[];
      items: { clothType: string; quantity: number }[];
      isExpressDelivery?: boolean;
      isInStoreDelivery?: boolean;
      notes?: string;
    },
  ) {
    const now = new Date();
    const order = await orderRepository.create({
      customer: data.customer as unknown as Types.ObjectId,
      services: data.servicesRequested.map((service) => ({ service: service as unknown as Types.ObjectId, isCompleted: false })),
      collectedItems: data.items.map((i) => ({ clothType: i.clothType as unknown as Types.ObjectId, quantity: i.quantity })),
      currentStatus: 'PICKED_UP',
      statusHistory: [
        { status: 'PICKUP_CREATED', timestamp: now, updatedBy: actorId as unknown as Types.ObjectId },
        { status: 'PICKED_UP', timestamp: now, updatedBy: actorId as unknown as Types.ObjectId, remarks: data.notes },
      ],
      isExpressPickup: false,
      isExpressDelivery: data.isExpressDelivery ?? false,
      isInStorePickup: true,
      isInStoreDelivery: data.isInStoreDelivery ?? false,
    });

    await recordAudit({ actor: actorId, actorRole, action: 'CREATE_IN_STORE_ORDER', entityType: 'Order', entityId: order._id, after: order });

    return order;
  },

  async updateItems(orderId: string, actorId: string, actorRole: UserRole, items: { clothType: string; quantity: number }[]) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');
    if (order.pickup) throw ApiError.badRequest('This order was created from a pickup — edit the items on the pickup instead.');

    const before = { collectedItems: order.collectedItems };
    order.collectedItems = items.map((i) => ({ clothType: i.clothType as unknown as Types.ObjectId, quantity: i.quantity })) as never;
    await order.save();

    await recordAudit({ actor: actorId, actorRole, action: 'UPDATE_ORDER_ITEMS', entityType: 'Order', entityId: order._id, before, after: { items } });
    return order;
  },

  async advanceStatus(
    orderId: string,
    nextStatus: OrderStage,
    actorId: string,
    actorRole: UserRole,
    remarks?: string,
    itemCount?: number,
  ) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');

    const current = order.currentStatus as OrderStage;
    if (!isForwardTransition(current, nextStatus)) {
      throw ApiError.badRequest(`Cannot move order from ${current} to ${nextStatus}. Statuses must progress forward and cannot be skipped backwards.`);
    }
    if (actorRole === 'DRIVER' && !isDriverAllowedTransition(current, nextStatus)) {
      throw ApiError.forbidden('Drivers can only mark a pickup delivered to the store, start a delivery, or mark it delivered.');
    }

    const before = { currentStatus: order.currentStatus };
    order.statusHistory.push({
      status: nextStatus,
      timestamp: new Date(),
      updatedBy: actorId as unknown as Types.ObjectId,
      remarks,
      itemCount,
    });
    order.currentStatus = nextStatus;
    await order.save();

    await recordAudit({ actor: actorId, actorRole, action: 'ADVANCE_ORDER_STATUS', entityType: 'Order', entityId: order._id, before, after: { currentStatus: nextStatus } });

    if (nextStatus === 'READY_FOR_DELIVERY' && order.driver) {
      await notificationService.notify({ recipientId: order.driver, type: 'READY_FOR_DELIVERY', title: 'Ready for Delivery', body: `Order ${order._id} is ready for delivery.`, payload: { orderId: String(order._id) } });
    }
    if (nextStatus === 'OUT_FOR_DELIVERY' && order.driver) {
      await notificationService.notify({ recipientId: order.driver, type: 'OUT_FOR_DELIVERY', title: 'Out for Delivery', body: `Order ${order._id} is out for delivery.`, payload: { orderId: String(order._id) } });
    }
    if (nextStatus === 'RECEIVED_AT_LAUNDRY') {
      const admins = await User.find({ role: { $in: ['ROOT_ADMIN', 'ADMIN'] } });
      await notificationService.notifyMany(admins.map((a) => a._id), {
        type: 'DELIVERED_TO_STORE',
        title: 'Delivered to Store',
        body: `Order ${order._id} has been dropped off at the store by the driver.`,
        payload: { orderId: String(order._id) },
      });
    }

    return order;
  },

  async updateServiceStatus(orderId: string, serviceId: string, isCompleted: boolean, actorId: string, actorRole: UserRole) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');
    const entry = order.services.find((s) => String(s.service._id ?? s.service) === serviceId);
    if (!entry) throw ApiError.notFound('Service not found on this order');
    entry.isCompleted = isCompleted;
    entry.completedAt = isCompleted ? new Date() : undefined;
    await order.save();

    const allCompleted = order.services.every((s) => s.isCompleted);
    if (allCompleted) {
      const admins = await User.find({ role: { $in: ['ROOT_ADMIN', 'ADMIN'] } });
      await notificationService.notifyMany(admins.map((a) => a._id), {
        type: 'LAUNDRY_COMPLETED',
        title: 'Laundry Completed',
        body: `All services completed for order ${order._id}. Ready to generate the bill.`,
        payload: { orderId: String(order._id) },
      });

      if (order.currentStatus === 'RECEIVED_AT_LAUNDRY') {
        order.statusHistory.push({ status: 'READY_FOR_DELIVERY', timestamp: new Date(), updatedBy: actorId as unknown as Types.ObjectId });
        order.currentStatus = 'READY_FOR_DELIVERY';
        await order.save();

        if (order.driver) {
          await notificationService.notify({
            recipientId: order.driver,
            type: 'READY_FOR_DELIVERY',
            title: 'Ready for Delivery',
            body: `Order ${order._id} is ready for delivery.`,
            payload: { orderId: String(order._id) },
          });
        }
      }
    }

    await recordAudit({ actor: actorId, actorRole, action: 'UPDATE_SERVICE_STATUS', entityType: 'Order', entityId: order._id, after: { serviceId, isCompleted } });
    return order;
  },

  async addService(orderId: string, serviceId: string, actorId: string, actorRole: UserRole) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');
    const exists = order.services.some((s) => String(s.service._id ?? s.service) === serviceId);
    if (exists) throw ApiError.conflict('This service is already on the order');

    order.services.push({ service: serviceId as unknown as Types.ObjectId, isCompleted: false } as never);
    await order.save();

    await recordAudit({ actor: actorId, actorRole, action: 'ADD_ORDER_SERVICE', entityType: 'Order', entityId: order._id, after: { serviceId } });
    return order;
  },

  allServicesCompleted(order: { services: { isCompleted: boolean }[] }): boolean {
    return order.services.length > 0 && order.services.every((s) => s.isCompleted);
  },

  async updateStageEntry(
    orderId: string,
    actorId: string,
    actorRole: UserRole,
    entryId: string,
    data: { itemCount?: number; remarks?: string },
  ) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');
    const entry = order.statusHistory.find((h) => String(h._id) === entryId);
    if (!entry) throw ApiError.notFound('Stage entry not found');

    const before = { itemCount: entry.itemCount, remarks: entry.remarks };
    if (data.itemCount !== undefined) entry.itemCount = data.itemCount;
    if (data.remarks !== undefined) entry.remarks = data.remarks;
    await order.save();

    await recordAudit({
      actor: actorId,
      actorRole,
      action: 'UPDATE_STAGE_DETAILS',
      entityType: 'Order',
      entityId: order._id,
      before,
      after: { itemCount: entry.itemCount, remarks: entry.remarks },
    });
    return order;
  },

  async assignDriver(orderId: string, actorId: string, actorRole: UserRole, driverId: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');

    const before = { driver: order.driver };
    order.driver = driverId as unknown as Types.ObjectId;
    await order.save();

    await recordAudit({ actor: actorId, actorRole, action: 'ASSIGN_DELIVERY_DRIVER', entityType: 'Order', entityId: order._id, before, after: { driver: driverId } });
    await notificationService.notify({
      recipientId: driverId,
      type: 'READY_FOR_DELIVERY',
      title: 'Delivery Assigned',
      body: `You've been assigned a delivery for order ${order._id}.`,
      payload: { orderId: String(order._id) },
    });
    return order;
  },

  async selfAssignDelivery(orderId: string, driverId: string, driverRole: UserRole) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');
    if (order.currentStatus !== 'READY_FOR_DELIVERY') {
      throw ApiError.badRequest('This order is not available for delivery right now.');
    }

    const before = { driver: order.driver };
    order.driver = driverId as unknown as Types.ObjectId;
    await order.save();

    await recordAudit({
      actor: driverId,
      actorRole: driverRole,
      action: 'DRIVER_SELF_ASSIGN_DELIVERY',
      entityType: 'Order',
      entityId: order._id,
      before,
      after: { driver: driverId },
    });
    return order;
  },

  list: orderRepository.list,
  listForDriver: orderRepository.listForDriver,
  listAvailableForDelivery: orderRepository.listAvailableForDelivery,
  listMyStoreDropoffs: orderRepository.listMyStoreDropoffs,
  listMyHistory: orderRepository.listMyHistory,
  findById: orderRepository.findById,
  stages: ORDER_STAGES,
};
