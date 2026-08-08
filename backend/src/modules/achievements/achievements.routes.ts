import { Router } from 'express';
import * as achievementsController from './achievements.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', achievementsController.getAchievements);

export default router;
