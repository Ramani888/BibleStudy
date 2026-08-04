import { z } from 'zod';

export const CreateCardDto = z.object({
  setId: z.string().uuid('Invalid set ID'),
  question: z.string().trim().min(1, 'Question is required').max(5000, 'Max 5000 characters'),
  answer: z.string().trim().min(1, 'Answer is required').max(5000, 'Max 5000 characters'),
  note: z.string().trim().max(2000).optional(),
  imageId: z.string().uuid('Invalid image ID').optional(),
  order: z.number().int().min(0).optional(),
  isBlurred: z.boolean().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
});

export const BulkCreateCardsDto = z.object({
  setId: z.string().uuid('Invalid set ID'),
  cards: z
    .array(
      z.object({
        question: z.string().trim().min(1, 'Question is required').max(5000, 'Max 5000 characters'),
        answer: z.string().trim().min(1, 'Answer is required').max(5000, 'Max 5000 characters'),
        note: z.string().trim().max(2000).optional(),
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
  question: z.string().trim().min(1).max(5000, 'Max 5000 characters').optional(),
  answer: z.string().trim().min(1).max(5000, 'Max 5000 characters').optional(),
  note: z.string().trim().max(2000).nullable().optional(),
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
