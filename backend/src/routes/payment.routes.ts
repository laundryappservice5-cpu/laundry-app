import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { requireAuth, requireRole } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { settlePaymentsSchema } from '../validators/payment.validators';

const router = Router();

router.use(requireAuth, requireRole('ROOT_ADMIN', 'ADMIN'));

router.get('/export', paymentController.exportPayments);
router.get('/', paymentController.listPayments);
router.get('/summary', paymentController.paymentSummary);
router.get('/pending-by-driver', paymentController.pendingByDriver);
router.get('/pending/:driverId', paymentController.pendingForDriver);
router.patch('/settle', validateBody(settlePaymentsSchema), paymentController.settle);

export default router;
