import { Customer, ICustomer } from '../models/Customer';

export const customerRepository = {
  create(data: Partial<ICustomer>) {
    return Customer.create(data);
  },
  findById(id: string) {
    return Customer.findById(id);
  },
  findByMobile(mobileNumber: string) {
    return Customer.findOne({ mobileNumber });
  },
  update(id: string, data: Partial<ICustomer>) {
    return Customer.findByIdAndUpdate(id, data, { new: true });
  },
  search(query: string, skip: number, limit: number) {
    const filter = query
      ? {
          $or: [
            { mobileNumber: { $regex: query, $options: 'i' } },
            { name: { $regex: query, $options: 'i' } },
            { 'addresses.address': { $regex: query, $options: 'i' } },
            { 'addresses.area': { $regex: query, $options: 'i' } },
          ],
        }
      : {};
    return Promise.all([
      Customer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Customer.countDocuments(filter),
    ]);
  },
};
