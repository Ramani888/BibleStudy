import { Router } from 'express';
import * as creditsController from './credits.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/balance', creditsController.getBalance);
router.get('/transactions', creditsController.getTransactions);
router.post('/daily-login', creditsController.claimDailyLogin);

export default router;
