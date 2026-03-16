import { Router } from 'express';
import * as foldersController from './folders.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { CreateFolderDto, UpdateFolderDto } from './folders.dto';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(CreateFolderDto), foldersController.createFolder);
router.get('/', foldersController.listFolders);
router.get('/:id', foldersController.getFolderById);
router.put('/:id', validate(UpdateFolderDto), foldersController.updateFolder);
router.delete('/:id', foldersController.deleteFolder);

export default router;
