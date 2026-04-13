import { Router } from 'express';
import * as friendsController from './friends.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { SendRequestDto } from './friends.dto';

const router = Router();

router.use(authMiddleware);

router.get('/search', friendsController.searchUsers);
router.get('/requests', friendsController.listRequests);
router.get('/blocked', friendsController.listBlocked);
router.get('/', friendsController.listFriends);
router.post('/request', validate(SendRequestDto), friendsController.sendRequest);
router.put('/request/:requestId/accept', friendsController.acceptRequest);
router.put('/request/:requestId/reject', friendsController.rejectRequest);
router.post('/block/:userId', friendsController.blockUser);
router.delete('/block/:userId', friendsController.unblockUser);
router.delete('/:friendId', friendsController.removeFriend);

export default router;
