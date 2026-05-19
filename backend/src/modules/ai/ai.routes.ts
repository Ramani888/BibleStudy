import { Router } from 'express';
import * as aiController from './ai.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { aiRateLimit } from '../../middlewares/rateLimit.middleware';
import { AskQuestionDto, BookmarkDto, RenameSessionDto, UpdateTagsDto } from './ai.dto';

const router = Router();

// Free endpoint - no auth required
router.get('/daily-verse', aiController.getDailyVerse);

// Protected routes
router.use(authMiddleware);

// Chat
router.post('/chat', aiRateLimit, validate(AskQuestionDto), aiController.askQuestion);

// History
router.get('/history',                              aiController.getChatHistory);
router.delete('/history',                           aiController.clearHistory);
router.delete('/history/:sessionId',                aiController.deleteSession);
router.patch('/history/:sessionId/title',  validate(RenameSessionDto),  aiController.renameSession);
router.patch('/history/:sessionId/tags',   validate(UpdateTagsDto),     aiController.updateSessionTags);

// Bookmarks
router.get('/bookmarks',              aiController.getBookmarks);
router.post('/bookmarks',  validate(BookmarkDto),  aiController.addBookmark);
router.delete('/bookmarks/:chatId',   aiController.removeBookmark);

export default router;
