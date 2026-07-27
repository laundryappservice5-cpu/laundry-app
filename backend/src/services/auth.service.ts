import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/user.repository';
import { ApiError } from '../utils/ApiError';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { recordAudit } from '../audit/recordAudit';
import { IUser, UserRole } from '../models/User';

const SALT_ROUNDS = 10;

function toPublicUser(user: IUser) {
  return {
    id: user._id,
    name: user.name,
    mobileNumber: user.mobileNumber,
    role: user.role,
    isActive: user.isActive,
    vehicleNumber: user.vehicleNumber,
  };
}

export const authService = {
  async login(mobileNumber: string, password: string, fcmToken?: string) {
    const user = await userRepository.findByMobile(mobileNumber);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('Invalid mobile number or password');
    }
    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      throw ApiError.unauthorized('Invalid mobile number or password');
    }
    if (fcmToken) {
      await userRepository.addFcmToken(String(user._id), fcmToken);
    }
    const accessToken = signAccessToken({ userId: String(user._id), role: user.role, mobileNumber: user.mobileNumber });
    const refreshToken = signRefreshToken({ userId: String(user._id) });
    return { user: toPublicUser(user), accessToken, refreshToken };
  },

  async refresh(refreshToken: string) {
    let payload: { userId: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }
    const user = await userRepository.findById(payload.userId);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('User not found or inactive');
    }
    const accessToken = signAccessToken({ userId: String(user._id), role: user.role, mobileNumber: user.mobileNumber });
    return { accessToken };
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) throw ApiError.notFound('User not found');
    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) throw ApiError.badRequest('Current password is incorrect');
    user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();
    await recordAudit({
      actor: user._id,
      actorRole: user.role,
      action: 'CHANGE_PASSWORD',
      entityType: 'User',
      entityId: user._id,
    });
  },

  async createAdmin(rootAdminId: string, rootAdminRole: UserRole, data: { name: string; mobileNumber: string; password: string }) {
    const existing = await userRepository.findByMobile(data.mobileNumber);
    if (existing) throw ApiError.conflict('A user with this mobile number already exists');
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    const admin = await userRepository.create({
      name: data.name,
      mobileNumber: data.mobileNumber,
      passwordHash,
      role: 'ADMIN',
      createdBy: rootAdminId as unknown as IUser['createdBy'],
    });
    await recordAudit({
      actor: rootAdminId,
      actorRole: rootAdminRole,
      action: 'CREATE_ADMIN',
      entityType: 'User',
      entityId: admin._id,
      after: toPublicUser(admin),
    });
    return toPublicUser(admin);
  },

  async createDriver(creatorId: string, creatorRole: UserRole, data: { name: string; mobileNumber: string; password: string; vehicleNumber?: string }) {
    const existing = await userRepository.findByMobile(data.mobileNumber);
    if (existing) throw ApiError.conflict('A user with this mobile number already exists');
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    const driver = await userRepository.create({
      name: data.name,
      mobileNumber: data.mobileNumber,
      passwordHash,
      role: 'DRIVER',
      vehicleNumber: data.vehicleNumber,
      createdBy: creatorId as unknown as IUser['createdBy'],
    });
    await recordAudit({
      actor: creatorId,
      actorRole: creatorRole,
      action: 'CREATE_DRIVER',
      entityType: 'User',
      entityId: driver._id,
      after: toPublicUser(driver),
    });
    return toPublicUser(driver);
  },

  toPublicUser,
};
