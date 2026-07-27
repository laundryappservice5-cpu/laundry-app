import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller';
import { requireAuth } from '../middlewares/auth';

const router = Router();

router.use(requireAuth);

router.get('/', notificationController.listMyNotifications);
router.patch('/:id/read', notificationController.markRead);

export default router;
