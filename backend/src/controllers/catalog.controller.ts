import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';
import { ClothType } from '../models/ClothType';
import { Service } from '../models/Service';
import { recordAudit } from '../audit/recordAudit';

export const listClothTypes = asyncHandler(async (_req: Request, res: Response) => {
  const items = await ClothType.find().sort({ name: 1 });
  ok(res, items);
});

export const createClothType = asyncHandler(async (req: Request, res: Response) => {
  const existing = await ClothType.findOne({ name: req.body.name });
  if (existing) throw ApiError.conflict('This cloth type already exists');
  const clothType = await ClothType.create({ name: req.body.name, isCustom: true, createdBy: req.user!.userId });
  await recordAudit({ actor: req.user!.userId, actorRole: req.user!.role, action: 'CREATE_CLOTH_TYPE', entityType: 'ClothType', entityId: clothType._id, after: clothType });
  ok(res, clothType, 201);
});

export const setClothTypePrice = asyncHandler(async (req: Request, res: Response) => {
  const clothType = await ClothType.findById(req.params.id);
  if (!clothType) throw ApiError.notFound('Cloth type not found');

  const before = clothType.prices.get(req.body.service);
  clothType.prices.set(req.body.service, req.body.price);
  await clothType.save();

  await recordAudit({
    actor: req.user!.userId,
    actorRole: req.user!.role,
    action: 'SET_CLOTH_TYPE_PRICE',
    entityType: 'ClothType',
    entityId: clothType._id,
    before: { service: req.body.service, price: before },
    after: { service: req.body.service, price: req.body.price },
  });
  ok(res, clothType);
});

export const listServices = asyncHandler(async (_req: Request, res: Response) => {
  const items = await Service.find({ isActive: true }).sort({ name: 1 });
  ok(res, items);
});

export const createService = asyncHandler(async (req: Request, res: Response) => {
  const existing = await Service.findOne({ name: req.body.name });
  if (existing) throw ApiError.conflict('This service already exists');
  const service = await Service.create(req.body);
  await recordAudit({ actor: req.user!.userId, actorRole: req.user!.role, action: 'CREATE_SERVICE', entityType: 'Service', entityId: service._id, after: service });
  ok(res, service, 201);
});

export const updateService = asyncHandler(async (req: Request, res: Response) => {
  const before = await Service.findById(req.params.id);
  if (!before) throw ApiError.notFound('Service not found');
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
  await recordAudit({
    actor: req.user!.userId,
    actorRole: req.user!.role,
    action: 'UPDATE_SERVICE',
    entityType: 'Service',
    entityId: req.params.id,
    before,
    after: service,
  });
  ok(res, service);
});
