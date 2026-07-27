import { Router } from 'express';
import * as catalogController from '../controllers/catalog.controller';
import { requireAuth, requireRole } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import {
  createClothTypeSchema,
  createServiceSchema,
  updateServiceSchema,
  setClothTypePriceSchema,
} from '../validators/catalog.validators';

const clothTypeRouter = Router();
clothTypeRouter.use(requireAuth);
clothTypeRouter.get('/', catalogController.listClothTypes);
clothTypeRouter.post('/', validateBody(createClothTypeSchema), catalogController.createClothType);
clothTypeRouter.patch(
  '/:id/price',
  requireRole('ROOT_ADMIN', 'ADMIN'),
  validateBody(setClothTypePriceSchema),
  catalogController.setClothTypePrice,
);

const serviceRouter = Router();
serviceRouter.use(requireAuth);
serviceRouter.get('/', catalogController.listServices);
serviceRouter.post('/', requireRole('ROOT_ADMIN', 'ADMIN'), validateBody(createServiceSchema), catalogController.createService);
serviceRouter.patch('/:id', requireRole('ROOT_ADMIN', 'ADMIN'), validateBody(updateServiceSchema), catalogController.updateService);

export { clothTypeRouter, serviceRouter };
