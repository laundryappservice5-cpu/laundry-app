import { Pickup, IPickup, PickupStatus } from '../models/Pickup';

interface PickupListFilter {
  status?: PickupStatus | PickupStatus[];
  driver?: string;
  createdToday?: boolean;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export const pickupRepository = {
  create(data: Partial<IPickup>) {
    return Pickup.create(data);
  },
  findById(id: string) {
    return Pickup.findById(id).populate('customer').populate('servicesRequested').populate('assignedDriver').populate('collectedItems.clothType');
  },
  update(id: string, data: Partial<IPickup>) {
    return Pickup.findByIdAndUpdate(id, data, { new: true });
  },
  list(filter: PickupListFilter, skip: number, limit: number) {
    const query: Record<string, unknown> = {};
    if (filter.status) {
      query.status = Array.isArray(filter.status) ? { $in: filter.status } : filter.status;
    }
    if (filter.driver) query.assignedDriver = filter.driver;
    if (filter.createdToday) query.createdAt = { $gte: startOfToday() };
    return Promise.all([
      Pickup.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('customer').populate('assignedDriver'),
      Pickup.countDocuments(query),
    ]);
  },
  listForDriver(driverId: string) {
    return Pickup.find({ assignedDriver: driverId, status: { $in: ['DRIVER_ASSIGNED', 'ACCEPTED'] } })
      .sort({ createdAt: -1 })
      .populate('customer')
      .populate('servicesRequested');
  },
  listAvailable() {
    return Pickup.find({ status: 'CREATED' })
      .sort({ createdAt: -1 })
      .populate('customer')
      .populate('servicesRequested');
  },
  listMyHistory(driverId: string) {
    return Pickup.find({ assignedDriver: driverId, status: { $in: ['PICKED_UP', 'CANCELLED'] } })
      .sort({ updatedAt: -1 })
      .populate('customer')
      .populate('servicesRequested');
  },
};
