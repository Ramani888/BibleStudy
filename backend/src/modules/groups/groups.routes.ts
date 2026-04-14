import { Router } from 'express';
import * as groupsController from './groups.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { CreateGroupDto, UpdateGroupDto, UpdateRoleDto } from './groups.dto';

const router = Router();

router.use(authMiddleware);

router.post('/',                          validate(CreateGroupDto), groupsController.createGroup);
router.get('/',                           groupsController.listMyGroups);
router.get('/public',                     groupsController.listPublicGroups);
router.get('/:id',                        groupsController.getGroup);
router.put('/:id',                        validate(UpdateGroupDto), groupsController.updateGroup);
router.delete('/:id',                     groupsController.deleteGroup);
router.post('/join/:inviteCode',           groupsController.joinGroup);
router.delete('/:id/leave',              groupsController.leaveGroup);
router.put('/:id/members/:uid/role',      validate(UpdateRoleDto), groupsController.updateMemberRole);
router.delete('/:id/members/:uid',        groupsController.removeMember);
router.post('/:id/regenerate-invite',     groupsController.regenerateInviteCode);

export default router;
