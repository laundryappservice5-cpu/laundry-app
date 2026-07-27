import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { requireAuth, requireRole } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { loginSchema, refreshSchema, changePasswordSchema, createAdminSchema, fcmTokenSchema } from '../validators/auth.validators';
import { authRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.post('/login', authRateLimiter, validateBody(loginSchema), authController.login);
router.post('/refresh', authRateLimiter, validateBody(refreshSchema), authController.refresh);
router.post('/change-password', requireAuth, validateBody(changePasswordSchema), authController.changePassword);
router.get('/me', requireAuth, authController.me);
router.post('/admins', requireAuth, requireRole('ROOT_ADMIN'), validateBody(createAdminSchema), authController.createAdmin);
router.post('/fcm-token', requireAuth, validateBody(fcmTokenSchema), authController.registerFcmToken);

export default router;
