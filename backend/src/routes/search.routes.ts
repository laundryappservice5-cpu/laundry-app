import { Router } from 'express';
import * as searchController from '../controllers/search.controller';
import { requireAuth, requireRole } from '../middlewares/auth';

const router = Router();

router.use(requireAuth, requireRole('ROOT_ADMIN', 'ADMIN'));
router.get('/', searchController.globalSearch);

export default router;
