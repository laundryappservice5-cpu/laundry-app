import { Types } from 'mongoose';
import { pickupRepository } from '../repositories/pickup.repository';
import { IPickup, PickupStatus } from '../models/Pickup';
import { ApiError } from '../utils/ApiError';
import { recordAudit } from '../audit/recordAudit';
import { UserRole, User } from '../models/User';
import { notificationService } from './notification.service';
import { orderService } from './order.service';

function refId(ref: unknown): string | undefined {
  if (!ref) return undefined;
  const value = ref as { _id?: unknown };
  return String(value._id ?? ref);
}

export const pickupService = {
  async create(actorId: string, actorRole: UserRole, data: Partial<IPickup>) {
    const pickup = await pickupRepository.create({
      ...data,
      status: data.assignedDriver ? 'DRIVER_ASSIGNED' : 'CREATED',
      createdBy: actorId as unknown as Types.ObjectId,
    });

    await recordAudit({ actor: actorId, actorRole, action: 'CREATE_PICKUP', entityType: 'Pickup', entityId: pickup._id, after: pickup });

    if (pickup.assignedDriver) {
      await notificationService.notify({
        recipientId: pickup.assignedDriver,
        type: pickup.isExpressPickup ? 'EXPRESS_PICKUP' : 'NEW_PICKUP',
        title: pickup.isExpressPickup ? 'New Express Pickup' : 'New Pickup Assigned',
        body: `You have a new pickup scheduled on ${pickup.pickupDate.toDateString()} at ${pickup.pickupTime}.`,
        payload: { pickupId: String(pickup._id) },
      });
    }

    return pickup;
  },

  async assignDriver(actorId: string, actorRole: UserRole, pickupId: string, driverId: string) {
    const pickup = await pickupRepository.findById(pickupId);
    if (!pickup) throw ApiError.notFound('Pickup not found');
    if (pickup.status === 'CANCELLED') throw ApiError.badRequest('Cannot assign a driver to a cancelled pickup');

    const before = { assignedDriver: pickup.assignedDriver, status: pickup.status };
    pickup.assignedDriver = driverId as unknown as Types.ObjectId;
    pickup.status = 'DRIVER_ASSIGNED';
    await pickup.save();

    await recordAudit({ actor: actorId, actorRole, action: 'ASSIGN_DRIVER', entityType: 'Pickup', entityId: pickup._id, before, after: { assignedDriver: driverId, status: pickup.status } });

    await notificationService.notify({
      recipientId: driverId,
      type: pickup.isExpressPickup ? 'EXPRESS_PICKUP' : 'NEW_PICKUP',
      title: pickup.isExpressPickup ? 'New Express Pickup' : 'New Pickup Assigned',
      body: `You have a new pickup scheduled on ${pickup.pickupDate.toDateString()} at ${pickup.pickupTime}.`,
      payload: { pickupId: String(pickup._id) },
    });

    return pickup;
  },

  async selfAssign(driverId: string, driverRole: UserRole, pickupId: string) {
    const pickup = await pickupRepository.findById(pickupId);
    if (!pickup) throw ApiError.notFound('Pickup not found');
    if (pickup.status !== 'CREATED') {
      throw ApiError.conflict('This pickup has already been claimed by another driver.');
    }

    pickup.assignedDriver = driverId as unknown as Types.ObjectId;
    pickup.status = 'ACCEPTED';
    await pickup.save();

    await recordAudit({
      actor: driverId,
      actorRole: driverRole,
      action: 'DRIVER_SELF_ASSIGN',
      entityType: 'Pickup',
      entityId: pickup._id,
      after: { assignedDriver: driverId, status: 'ACCEPTED' },
    });

    const admins = await User.find({ role: { $in: ['ROOT_ADMIN', 'ADMIN'] } });
    await notificationService.notifyMany(admins.map((a) => a._id), {
      type: 'DRIVER_SELF_ASSIGNED',
      title: 'Pickup Claimed',
      body: `A driver has claimed the pickup scheduled on ${pickup.pickupDate.toDateString()}.`,
      payload: { pickupId: String(pickup._id) },
    });

    return pickup;
  },

  async accept(driverId: string, driverRole: UserRole, pickupId: string) {
    const pickup = await pickupRepository.findById(pickupId);
    if (!pickup) throw ApiError.notFound('Pickup not found');
    if (refId(pickup.assignedDriver) !== driverId) throw ApiError.forbidden('This pickup is not assigned to you');
    if (pickup.status !== 'DRIVER_ASSIGNED') throw ApiError.badRequest(`Pickup cannot be accepted from status ${pickup.status}`);

    pickup.status = 'ACCEPTED';
    await pickup.save();
    await recordAudit({ actor: driverId, actorRole: driverRole, action: 'ACCEPT_PICKUP', entityType: 'Pickup', entityId: pickup._id, after: { status: 'ACCEPTED' } });
    return pickup;
  },

  async cancel(actorId: string, actorRole: UserRole, pickupId: string, reason: string) {
    const pickup = await pickupRepository.findById(pickupId);
    if (!pickup) throw ApiError.notFound('Pickup not found');
    if (pickup.status === 'PICKED_UP') throw ApiError.badRequest('Cannot cancel a pickup that has already been collected');

    const before = { status: pickup.status };
    pickup.status = 'CANCELLED';
    pickup.cancelledReason = reason;
    await pickup.save();

    await recordAudit({ actor: actorId, actorRole, action: 'CANCEL_PICKUP', entityType: 'Pickup', entityId: pickup._id, before, after: { status: 'CANCELLED', reason } });

    if (pickup.assignedDriver) {
      await notificationService.notify({
        recipientId: pickup.assignedDriver,
        type: 'PICKUP_CANCELLED',
        title: 'Pickup Cancelled',
        body: `The pickup scheduled on ${pickup.pickupDate.toDateString()} has been cancelled.`,
        payload: { pickupId: String(pickup._id) },
      });
    }

    return pickup;
  },

  async updateCollectedItems(
    driverId: string,
    driverRole: UserRole,
    pickupId: string,
    items: { clothType: string; quantity: number }[],
  ) {
    const pickup = await pickupRepository.findById(pickupId);
    if (!pickup) throw ApiError.notFound('Pickup not found');
    if (refId(pickup.assignedDriver) !== driverId) throw ApiError.forbidden('This pickup is not assigned to you');

    pickup.collectedItems = items.map((i) => ({ clothType: i.clothType as unknown as Types.ObjectId, quantity: i.quantity }));
    await pickup.save();
    await recordAudit({ actor: driverId, actorRole: driverRole, action: 'UPDATE_COLLECTED_ITEMS', entityType: 'Pickup', entityId: pickup._id, after: { items } });
    return pickup;
  },

  async adminUpdateCollectedItems(
    actorId: string,
    actorRole: UserRole,
    pickupId: string,
    items: { clothType: string; quantity: number }[],
  ) {
    const pickup = await pickupRepository.findById(pickupId);
    if (!pickup) throw ApiError.notFound('Pickup not found');

    const before = { items: pickup.collectedItems };
    pickup.collectedItems = items.map((i) => ({ clothType: i.clothType as unknown as Types.ObjectId, quantity: i.quantity }));
    await pickup.save();
    await recordAudit({
      actor: actorId,
      actorRole,
      action: 'ADMIN_UPDATE_COLLECTED_ITEMS',
      entityType: 'Pickup',
      entityId: pickup._id,
      before,
      after: { items },
    });
    return pickup;
  },

  async complete(
    driverId: string,
    driverRole: UserRole,
    pickupId: string,
    data: {
      items: { clothType: string; quantity: number }[];
      images?: string[];
      pickupRemarks?: string;
      damagedItemNotes?: string;
      gpsLocation?: { lat: number; lng: number };
    },
  ) {
    const pickup = await pickupRepository.findById(pickupId);
    if (!pickup) throw ApiError.notFound('Pickup not found');
    if (refId(pickup.assignedDriver) !== driverId) throw ApiError.forbidden('This pickup is not assigned to you');
    if (!['ACCEPTED', 'DRIVER_ASSIGNED'].includes(pickup.status)) {
      throw ApiError.badRequest(`Pickup cannot be completed from status ${pickup.status}`);
    }

    pickup.collectedItems = data.items.map((i) => ({ clothType: i.clothType as unknown as Types.ObjectId, quantity: i.quantity }));
    pickup.images = data.images ?? pickup.images;
    pickup.pickupRemarks = data.pickupRemarks;
    pickup.damagedItemNotes = data.damagedItemNotes;
    pickup.gpsLocation = data.gpsLocation;
    pickup.status = 'PICKED_UP';
    await pickup.save();

    await recordAudit({ actor: driverId, actorRole: driverRole, action: 'COMPLETE_PICKUP', entityType: 'Pickup', entityId: pickup._id, after: pickup });

    const order = await orderService.createFromPickup(pickup, driverId, driverRole);
    return { pickup, order };
  },

  findById: pickupRepository.findById,
  list: pickupRepository.list,
  listForDriver: pickupRepository.listForDriver,
  listAvailable: pickupRepository.listAvailable,
  listMyHistory: pickupRepository.listMyHistory,
};
