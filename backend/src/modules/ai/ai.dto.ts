import { z } from 'zod';

export const AskQuestionDto = z.object({
  question: z.string().min(1, 'Question is required').max(2000),
});

export type AskQuestionDtoType = z.infer<typeof AskQuestionDto>;
