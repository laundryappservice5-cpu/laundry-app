import { Router } from 'express';
import * as driverController from '../controllers/driver.controller';
import { requireAuth, requireRole } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { createDriverSchema, setDriverActiveSchema } from '../validators/driver.validators';

const router = Router();

router.use(requireAuth, requireRole('ROOT_ADMIN', 'ADMIN'));

router.get('/', driverController.listDrivers);
router.post('/', validateBody(createDriverSchema), driverController.createDriver);
router.patch('/:id/active', validateBody(setDriverActiveSchema), driverController.setDriverActive);

export default router;
