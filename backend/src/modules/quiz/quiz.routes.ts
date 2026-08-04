import { Router } from 'express';
import * as quizController from './quiz.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { RecordAttemptDto } from './quiz.dto';

const router = Router();

router.use(authMiddleware);

router.post('/attempts', validate(RecordAttemptDto), quizController.recordAttempt);
router.get('/best',                                  quizController.getAllBest);
router.get('/sets/:setId/best',                      quizController.getBest);

export default router;
