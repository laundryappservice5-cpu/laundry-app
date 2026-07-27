import { User, IUser, UserRole } from '../models/User';

export const userRepository = {
  findByMobile(mobileNumber: string) {
    return User.findOne({ mobileNumber }).select('+passwordHash');
  },
  findById(id: string) {
    return User.findById(id);
  },
  findByIdWithPassword(id: string) {
    return User.findById(id).select('+passwordHash');
  },
  create(data: Partial<IUser>) {
    return User.create(data);
  },
  listByRole(role: UserRole, isActive?: boolean) {
    const query: Record<string, unknown> = { role };
    if (isActive !== undefined) query.isActive = isActive;
    return User.find(query).sort({ createdAt: -1 });
  },
  update(id: string, data: Partial<IUser>) {
    return User.findByIdAndUpdate(id, data, { new: true });
  },
  addFcmToken(id: string, token: string) {
    return User.findByIdAndUpdate(id, { $addToSet: { fcmTokens: token } });
  },
};
