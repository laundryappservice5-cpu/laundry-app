import { Customer } from '../models/Customer';
import { Pickup } from '../models/Pickup';
import { Order } from '../models/Order';
import { Bill } from '../models/Bill';
import { Types } from 'mongoose';

export const searchService = {
  async globalSearch(q: string) {
    const regex = { $regex: q, $options: 'i' };
    const isObjectId = Types.ObjectId.isValid(q);

    const [customers, pickups, orders, bills] = await Promise.all([
      Customer.find({
        $or: [{ mobileNumber: regex }, { name: regex }, { 'addresses.address': regex }, { 'addresses.area': regex }],
      }).limit(10),
      Pickup.find(isObjectId ? { _id: q } : { status: regex }).limit(10).populate('customer').populate('assignedDriver'),
      Order.find(isObjectId ? { _id: q } : { currentStatus: regex }).limit(10).populate('customer').populate('driver'),
      Bill.find({ invoiceNumber: regex }).limit(10),
    ]);

    return { customers, pickups, orders, bills };
  },
};
