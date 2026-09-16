import { Router } from 'express';
import * as subscriptionsController from './subscriptions.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

// RevenueCat webhook — public route (auth via Authorization header), MUST be before authMiddleware.
router.post('/rc-webhook', subscriptionsController.rcWebhook);

router.use(authMiddleware);

// Legacy POST /verify removed — RevenueCat is the sole entitlement source (see PLAN.md #20).
router.get('/status', subscriptionsController.getStatus);

export default router;
