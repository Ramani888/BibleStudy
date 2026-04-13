import { Router } from 'express';
import * as activitiesController from './activities.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/',        activitiesController.getMyFeed);
router.get('/friends', activitiesController.getFriendsFeed);

export default router;
