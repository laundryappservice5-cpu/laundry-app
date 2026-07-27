import { Router } from 'express';
import { upload } from '../middlewares/upload';
import { requireAuth } from '../middlewares/auth';
import * as uploadController from '../controllers/upload.controller';

const router = Router();

router.post('/', requireAuth, upload.array('images', 10), uploadController.uploadImages);

export default router;
