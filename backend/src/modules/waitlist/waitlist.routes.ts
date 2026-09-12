import { Router } from 'express';
import * as waitlistController from './waitlist.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authRateLimit } from '../../middlewares/rateLimit.middleware';
import { CreateWaitlistDto } from './waitlist.dto';

const router = Router();

// Public, unauthenticated endpoints for the marketing site.
router.get('/count', waitlistController.count);
router.post('/', authRateLimit, validate(CreateWaitlistDto), waitlistController.join);

export default router;
