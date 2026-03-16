import { Router } from 'express';
import * as cardsController from './cards.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authMiddleware } from '../../middlewares/auth.middleware';
import {
  CreateCardDto,
  BulkCreateCardsDto,
  UpdateCardDto,
  ReorderCardsDto,
  StudyCardDto,
} from './cards.dto';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(CreateCardDto), cardsController.createCard);
router.post('/bulk', validate(BulkCreateCardsDto), cardsController.bulkCreateCards);
router.post('/reorder', validate(ReorderCardsDto), cardsController.reorderCards);
router.get('/set/:setId', cardsController.listCardsBySet);
router.get('/:id', cardsController.getCardById);
router.put('/:id', validate(UpdateCardDto), cardsController.updateCard);
router.delete('/:id', cardsController.deleteCard);
router.post('/:id/study', validate(StudyCardDto), cardsController.recordStudyResult);

export default router;
