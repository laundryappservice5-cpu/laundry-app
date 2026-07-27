import { Router } from 'express';
import * as orderController from '../controllers/order.controller';
import { requireAuth, requireRole } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import {
  advanceOrderStatusSchema,
  updateServiceStatusSchema,
  updateStageEntrySchema,
  assignDeliveryDriverSchema,
  addOrderServiceSchema,
  createInStoreOrderSchema,
  updateOrderItemsSchema,
} from '../validators/order.validators';

const router = Router();

router.use(requireAuth);

router.get('/my-deliveries', requireRole('DRIVER'), orderController.myDeliveryJobs);
router.get('/available-for-delivery', requireRole('DRIVER'), orderController.availableForDelivery);
router.get('/my-store-dropoffs', requireRole('DRIVER'), orderController.myStoreDropoffs);
router.get('/my-history', requireRole('DRIVER'), orderController.myOrderHistory);
router.get('/', requireRole('ROOT_ADMIN', 'ADMIN'), orderController.listOrders);
router.post('/walk-in', requireRole('ROOT_ADMIN', 'ADMIN'), validateBody(createInStoreOrderSchema), orderController.createInStoreOrder);
router.get('/:id', orderController.getOrderById);
router.patch('/:id/items', requireRole('ROOT_ADMIN', 'ADMIN'), validateBody(updateOrderItemsSchema), orderController.updateItems);
router.patch('/:id/status', requireRole('ROOT_ADMIN', 'ADMIN', 'DRIVER'), validateBody(advanceOrderStatusSchema), orderController.advanceStatus);
router.post('/:id/services', requireRole('ROOT_ADMIN', 'ADMIN'), validateBody(addOrderServiceSchema), orderController.addService);
router.patch('/:id/services/:serviceId', requireRole('ROOT_ADMIN', 'ADMIN'), validateBody(updateServiceStatusSchema), orderController.updateServiceStatus);
router.patch('/:id/stages/:entryId', requireRole('ROOT_ADMIN', 'ADMIN'), validateBody(updateStageEntrySchema), orderController.updateStageEntry);
router.patch('/:id/assign-driver', requireRole('ROOT_ADMIN', 'ADMIN'), validateBody(assignDeliveryDriverSchema), orderController.assignDeliveryDriver);
router.patch('/:id/self-assign', requireRole('DRIVER'), orderController.selfAssignDelivery);

export default router;
