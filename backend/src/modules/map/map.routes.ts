import { Router } from 'express';
import * as mapController from './map.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { UpdateLocationDto, PrivacyDto } from './map.dto';

const router = Router();

router.use(authMiddleware);

router.post('/location',    validate(UpdateLocationDto), mapController.updateLocation);
router.get('/friends',      mapController.getFriendsLocations);
router.get('/gatherings',   mapController.getNearbyGatherings);
router.put('/privacy',      validate(PrivacyDto), mapController.updatePrivacy);

export default router;
