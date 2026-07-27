import { Bill, IBill } from '../models/Bill';

export const billRepository = {
  create(data: Partial<IBill>) {
    return Bill.create(data);
  },
  findById(id: string) {
    return Bill.findById(id).populate('order').populate('lineItems.clothType').populate('lineItems.service');
  },
  findByOrder(orderId: string) {
    return Bill.findOne({ order: orderId });
  },
  update(id: string, data: Partial<IBill>) {
    return Bill.findByIdAndUpdate(id, data, { new: true });
  },
};
