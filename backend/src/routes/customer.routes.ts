import { Router } from 'express';
import * as customerController from '../controllers/customer.controller';
import { requireAuth, requireRole } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { createCustomerSchema, updateCustomerSchema } from '../validators/customer.validators';

const router = Router();

router.use(requireAuth, requireRole('ROOT_ADMIN', 'ADMIN'));

router.get('/search', customerController.searchCustomers);
router.get('/by-mobile/:mobileNumber', customerController.getCustomerByMobile);
router.get('/:id', customerController.getCustomerById);
router.post('/', validateBody(createCustomerSchema), customerController.createCustomer);
router.patch('/:id', validateBody(updateCustomerSchema), customerController.updateCustomer);

export default router;
