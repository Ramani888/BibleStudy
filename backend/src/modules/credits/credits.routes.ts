import { Router } from 'express';
import * as creditsController from './credits.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/balance', creditsController.getBalance);
router.get('/streak', creditsController.getStreak);
router.get('/transactions', creditsController.getTransactions);
router.get('/stats', creditsController.getStats);
router.post('/daily-login', creditsController.claimDailyLogin);
router.post('/watch-ad',   creditsController.watchAd);

export default router;
