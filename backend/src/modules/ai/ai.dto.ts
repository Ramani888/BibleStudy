import { z } from 'zod';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(4000),
});

export const AskQuestionDto = z.object({
  question: z.string().min(1, 'Question is required').max(2000),
  history: z.array(ChatMessageSchema).max(20).optional(),
  sessionId: z.string().uuid().optional(),
});

export const RenameSessionDto = z.object({
  title: z.string().min(1).max(200),
});

export const UpdateTagsDto = z.object({
  tags: z.array(z.string().min(1).max(50)).max(5),
});

export const BookmarkDto = z.object({
  chatId: z.string().uuid(),
});

export type AskQuestionDtoType = z.infer<typeof AskQuestionDto>;
export type RenameSessionDtoType = z.infer<typeof RenameSessionDto>;
export type UpdateTagsDtoType = z.infer<typeof UpdateTagsDto>;
export type BookmarkDtoType = z.infer<typeof BookmarkDto>;
