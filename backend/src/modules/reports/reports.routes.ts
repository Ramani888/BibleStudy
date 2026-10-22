import { Router } from 'express';
import * as reportsController from './reports.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { reportRateLimit } from '../../middlewares/rateLimit.middleware';
import { CreateReportDto } from './reports.dto';

const router = Router();

router.use(authMiddleware);

router.post('/', reportRateLimit, validate(CreateReportDto), reportsController.create);

export default router;
