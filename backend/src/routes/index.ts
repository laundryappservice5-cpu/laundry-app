import { Router } from 'express';
import authRoutes from './auth.routes';
import customerRoutes from './customer.routes';
import { clothTypeRouter, serviceRouter } from './catalog.routes';
import driverRoutes from './driver.routes';
import pickupRoutes from './pickup.routes';
import orderRoutes from './order.routes';
import billRoutes from './bill.routes';
import notificationRoutes from './notification.routes';
import reportRoutes from './report.routes';
import searchRoutes from './search.routes';
import uploadRoutes from './upload.routes';
import settingsRoutes from './settings.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/cloth-types', clothTypeRouter);
router.use('/services', serviceRouter);
router.use('/drivers', driverRoutes);
router.use('/pickups', pickupRoutes);
router.use('/orders', orderRoutes);
router.use('/bills', billRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);
router.use('/search', searchRoutes);
router.use('/uploads', uploadRoutes);
router.use('/settings', settingsRoutes);

export default router;
