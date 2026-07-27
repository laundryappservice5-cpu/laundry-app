import { Router } from 'express';
import * as settingsController from '../controllers/settings.controller';
import { requireAuth, requireRole } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { updateSettingsSchema } from '../validators/settings.validators';

const router = Router();

router.use(requireAuth);

router.get('/', settingsController.getSettingsHandler);
router.patch('/', requireRole('ROOT_ADMIN', 'ADMIN'), validateBody(updateSettingsSchema), settingsController.updateSettingsHandler);

export default router;
