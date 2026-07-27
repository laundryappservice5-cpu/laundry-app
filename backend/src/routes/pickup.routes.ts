import { Router } from 'express';
import * as pickupController from '../controllers/pickup.controller';
import { requireAuth, requireRole } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import {
  createPickupSchema,
  assignDriverSchema,
  collectedItemsSchema,
  completePickupSchema,
  cancelPickupSchema,
} from '../validators/pickup.validators';

const router = Router();

router.use(requireAuth);

router.get('/my-assigned', requireRole('DRIVER'), pickupController.myAssignedPickups);
router.get('/available', requireRole('DRIVER'), pickupController.availablePickups);
router.get('/my-history', requireRole('DRIVER'), pickupController.myPickupHistory);
router.get('/', requireRole('ROOT_ADMIN', 'ADMIN'), pickupController.listPickups);
router.get('/:id', pickupController.getPickupById);
router.post('/', requireRole('ROOT_ADMIN', 'ADMIN'), validateBody(createPickupSchema), pickupController.createPickup);
router.patch('/:id/assign-driver', requireRole('ROOT_ADMIN', 'ADMIN'), validateBody(assignDriverSchema), pickupController.assignDriver);
router.patch('/:id/self-assign', requireRole('DRIVER'), pickupController.selfAssignPickup);
router.patch('/:id/cancel', requireRole('ROOT_ADMIN', 'ADMIN'), validateBody(cancelPickupSchema), pickupController.cancelPickup);
router.patch('/:id/accept', requireRole('DRIVER'), pickupController.acceptPickup);
router.patch('/:id/collected-items', requireRole('DRIVER'), validateBody(collectedItemsSchema), pickupController.updateCollectedItems);
router.patch('/:id/items', requireRole('ROOT_ADMIN', 'ADMIN'), validateBody(collectedItemsSchema), pickupController.adminUpdateCollectedItems);
router.patch('/:id/complete', requireRole('DRIVER'), validateBody(completePickupSchema), pickupController.completePickup);

export default router;
