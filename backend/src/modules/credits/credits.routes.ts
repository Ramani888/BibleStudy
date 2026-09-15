import { Router } from 'express';
import * as creditsController from './credits.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { RedeemReferralDto } from './credits.dto';

const router = Router();

router.use(authMiddleware);

router.get('/balance', creditsController.getBalance);
router.get('/streak', creditsController.getStreak);
router.get('/transactions', creditsController.getTransactions);
router.get('/stats', creditsController.getStats);
router.post('/daily-login', creditsController.claimDailyLogin);
router.get('/referral', creditsController.getReferral);
router.post('/referral/redeem', validate(RedeemReferralDto), creditsController.redeemReferral);

export default router;
