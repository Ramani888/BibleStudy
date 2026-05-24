import { Router } from 'express';
import * as notesController from './notes.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { CreateNoteDto, UpdateNoteDto } from './notes.dto';

const router = Router();

router.use(authMiddleware);

router.post('/',    validate(CreateNoteDto), notesController.createNote);
router.get('/',                              notesController.listNotes);
router.get('/:id',                           notesController.getNoteById);
router.put('/:id',  validate(UpdateNoteDto), notesController.updateNote);
router.delete('/:id',                        notesController.deleteNote);

export default router;
