import { Router } from 'express';
import * as aiController from './ai.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { aiRateLimit } from '../../middlewares/rateLimit.middleware';
import { AskQuestionDto } from './ai.dto';

const router = Router();

// Free endpoint - no auth required
router.get('/daily-verse', aiController.getDailyVerse);

// Protected routes
router.use(authMiddleware);

router.post('/chat', aiRateLimit, validate(AskQuestionDto), aiController.askQuestion);
router.get('/history', aiController.getChatHistory);

export default router;
