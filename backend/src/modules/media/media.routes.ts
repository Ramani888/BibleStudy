import { Router } from 'express';
import multer from 'multer';
import * as mediaController from './media.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

router.use(authMiddleware);

router.post('/upload',   upload.single('file'), mediaController.uploadFile);
router.get('/',                                 mediaController.listFiles);
router.get('/storage',                          mediaController.getStorageUsage);
router.delete('/:id',                           mediaController.deleteFile);

export default router;
