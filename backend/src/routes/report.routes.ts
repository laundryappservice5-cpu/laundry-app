import { Router } from 'express';
import * as reportController from '../controllers/report.controller';
import { requireAuth, requireRole } from '../middlewares/auth';

const router = Router();

router.use(requireAuth, requireRole('ROOT_ADMIN', 'ADMIN'));

router.get('/dashboard', reportController.dashboard);
router.get('/revenue-chart', reportController.revenueChart);
router.get('/order-status-chart', reportController.orderStatusChart);
router.get('/driver-performance', reportController.driverPerformance);
router.get('/admin-performance', reportController.adminPerformance);
router.get('/discounts', reportController.discounts);
router.get('/payments', reportController.payments);
router.get('/repeat-customers', reportController.repeatCustomers);
router.get('/pending-vs-completed', reportController.pendingVsCompleted);
router.get('/express-orders', reportController.expressOrders);

export default router;
