import { z } from 'zod';

export const CreateCardDto = z
  .object({
    setId: z.string().uuid('Invalid set ID'),
    type: z.enum(['QA', 'STORY']).optional(),
    // QA: question required (enforced below). STORY: question = reference, optional.
    question: z.string().trim().max(300, 'Max 300 characters').optional().default(''),
    answer: z.string().trim().min(2, 'Answer is required').max(2000, 'Max 2000 characters'),
    note: z.string().trim().max(500).optional(),
    imageId: z.string().uuid('Invalid image ID').optional(),
    order: z.number().int().min(0).optional(),
    isBlurred: z.boolean().optional(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  })
  .refine(d => d.type === 'STORY' || d.question.trim().length >= 2, {
    message: 'Question must be at least 2 characters',
    path: ['question'],
  });

export const BulkCreateCardsDto = z.object({
  setId: z.string().uuid('Invalid set ID'),
  cards: z
    .array(
      z.object({
        question: z.string().trim().min(2, 'Question must be at least 2 characters').max(300, 'Max 300 characters'),
        answer: z.string().trim().min(2, 'Answer is required').max(2000, 'Max 2000 characters'),
        note: z.string().trim().max(500).optional(),
        imageId: z.string().uuid('Invalid image ID').optional(),
        order: z.number().int().min(0).optional(),
        isBlurred: z.boolean().optional(),
        difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
      })
    )
    .min(1, 'At least one card is required')
    .max(100, 'Cannot create more than 100 cards at once'),
});

export const UpdateCardDto = z.object({
  type: z.enum(['QA', 'STORY']).optional(),
  question: z.string().trim().max(300, 'Max 300 characters').optional(),
  answer: z.string().trim().min(2).max(2000, 'Max 2000 characters').optional(),
  note: z.string().trim().max(500).nullable().optional(),
  imageId: z.string().uuid('Invalid image ID').nullable().optional(),
  order: z.number().int().min(0).optional(),
  isBlurred: z.boolean().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
});

export const ReorderCardsDto = z.object({
  setId: z.string().uuid('Invalid set ID'),
  cardIds: z.array(z.string().uuid()).min(1, 'Card IDs are required').max(500, 'Cannot reorder more than 500 cards'),
});

export const MoveCardDto = z.object({
  targetSetId: z.string().uuid('Invalid target set ID'),
});

export type CreateCardDtoType = z.infer<typeof CreateCardDto>;
export type BulkCreateCardsDtoType = z.infer<typeof BulkCreateCardsDto>;
export type UpdateCardDtoType = z.infer<typeof UpdateCardDto>;
export type ReorderCardsDtoType = z.infer<typeof ReorderCardsDto>;
export type MoveCardDtoType = z.infer<typeof MoveCardDto>;
