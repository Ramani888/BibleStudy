import { Router } from 'express';
import * as usersController from './users.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { UpdateProfileDto, ChangePasswordDto, DeviceTokenDto, RemoveTokenDto } from './users.dto';

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

router.get('/profile', usersController.getProfile);
router.put('/profile', validate(UpdateProfileDto), usersController.updateProfile);
router.put('/change-password', validate(ChangePasswordDto), usersController.changePassword);
router.delete('/account', usersController.deleteAccount);
router.post('/device-token', validate(DeviceTokenDto), usersController.registerDeviceToken);
router.delete('/device-token', validate(RemoveTokenDto), usersController.removeDeviceToken);
router.get('/:id', usersController.getUserById);

export default router;
