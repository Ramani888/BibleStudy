import { Router } from 'express';
import * as subscriptionsController from './subscriptions.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { VerifyPurchaseDto } from './subscriptions.dto';

const router = Router();

// RevenueCat webhook — public route (auth via Authorization header), MUST be before authMiddleware.
router.post('/rc-webhook', subscriptionsController.rcWebhook);

router.use(authMiddleware);

router.post('/verify', validate(VerifyPurchaseDto), subscriptionsController.verifyPurchase);
router.get('/status', subscriptionsController.getStatus);

export default router;
