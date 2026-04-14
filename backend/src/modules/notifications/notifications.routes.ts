import { Router } from 'express';
import * as notificationsController from './notifications.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/',            notificationsController.listNotifications);
router.put('/read-all',   notificationsController.markAllAsRead);
router.put('/:id/read',   notificationsController.markAsRead);
router.delete('/:id',     notificationsController.deleteNotification);

export default router;
