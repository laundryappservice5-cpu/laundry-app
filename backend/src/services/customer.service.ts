import { Types } from 'mongoose';
import { customerRepository } from '../repositories/customer.repository';
import { Order } from '../models/Order';
import { Pickup } from '../models/Pickup';
import { ApiError } from '../utils/ApiError';
import { recordAudit } from '../audit/recordAudit';
import { ICustomer } from '../models/Customer';
import { UserRole } from '../models/User';

export const customerService = {
  async create(actorId: string, actorRole: UserRole, data: Partial<ICustomer>) {
    const existing = await customerRepository.findByMobile(data.mobileNumber!);
    if (existing) throw ApiError.conflict('A customer with this mobile number already exists');
    const customer = await customerRepository.create({ ...data, createdBy: actorId as unknown as Types.ObjectId });
    await recordAudit({ actor: actorId, actorRole, action: 'CREATE_CUSTOMER', entityType: 'Customer', entityId: customer._id, after: customer });
    return customer;
  },

  async update(actorId: string, actorRole: UserRole, id: string, data: Partial<ICustomer>) {
    const before = await customerRepository.findById(id);
    if (!before) throw ApiError.notFound('Customer not found');
    const updated = await customerRepository.update(id, data);
    await recordAudit({ actor: actorId, actorRole, action: 'UPDATE_CUSTOMER', entityType: 'Customer', entityId: id, before, after: updated });
    return updated;
  },

  async getByMobile(mobileNumber: string) {
    const customer = await customerRepository.findByMobile(mobileNumber);
    if (!customer) return null;
    return this.withHistory(customer);
  },

  async getById(id: string) {
    const customer = await customerRepository.findById(id);
    if (!customer) throw ApiError.notFound('Customer not found');
    return this.withHistory(customer);
  },

  async withHistory(customer: ICustomer) {
    const [pickups, orders] = await Promise.all([
      Pickup.find({ customer: customer._id }).sort({ createdAt: -1 }).limit(20),
      Order.find({ customer: customer._id }).sort({ createdAt: -1 }).limit(20).populate('bill'),
    ]);
    return { customer, pickupHistory: pickups, orderHistory: orders };
  },

  search(query: string, skip: number, limit: number) {
    return customerRepository.search(query, skip, limit);
  },
};
