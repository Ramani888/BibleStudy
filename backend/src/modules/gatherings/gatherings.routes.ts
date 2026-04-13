import { Router } from 'express';
import * as gatheringsController from './gatherings.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { CreateGatheringDto, UpdateGatheringDto, RsvpDto } from './gatherings.dto';

const router = Router();

router.use(authMiddleware);

router.post('/',              validate(CreateGatheringDto), gatheringsController.createGathering);
router.get('/',               gatheringsController.listGatherings);
router.get('/nearby',         gatheringsController.getNearby);
router.get('/:id',            gatheringsController.getGathering);
router.put('/:id',            validate(UpdateGatheringDto), gatheringsController.updateGathering);
router.delete('/:id',         gatheringsController.cancelGathering);
router.post('/:id/rsvp',      validate(RsvpDto), gatheringsController.rsvp);
router.delete('/:id/leave',   gatheringsController.leaveGathering);
router.get('/:id/participants', gatheringsController.listParticipants);

export default router;
