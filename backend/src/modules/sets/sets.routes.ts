import { Router } from 'express';
import * as setsController from './sets.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { CreateSetDto, UpdateSetDto } from './sets.dto';

const router = Router();

router.use(authMiddleware);

router.get('/public', setsController.getPublicSets);
router.post('/', validate(CreateSetDto), setsController.createSet);
router.get('/', setsController.listSets);
router.get('/:id', setsController.getSetById);
router.put('/:id', validate(UpdateSetDto), setsController.updateSet);
router.delete('/:id', setsController.deleteSet);
router.post('/:id/clone', setsController.cloneSet);

export default router;
