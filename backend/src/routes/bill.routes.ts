import { Router } from 'express';
import * as billController from '../controllers/bill.controller';
import { requireAuth, requireRole } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { generateBillSchema, applyDiscountSchema, recordPaymentSchema } from '../validators/bill.validators';

const router = Router();

router.use(requireAuth);

router.post('/orders/:orderId/generate', requireRole('ROOT_ADMIN', 'ADMIN'), validateBody(generateBillSchema), billController.generateBill);
router.get('/:id', billController.getBillById);
router.patch('/:id/discount', requireRole('ROOT_ADMIN', 'ADMIN'), validateBody(applyDiscountSchema), billController.applyDiscount);
router.delete('/:id/discount', requireRole('ROOT_ADMIN', 'ADMIN'), billController.removeDiscount);
router.post('/:id/payments', requireRole('ROOT_ADMIN', 'ADMIN', 'DRIVER'), validateBody(recordPaymentSchema), billController.recordPayment);

export default router;
