import { z } from 'zod';

export const CreateCardDto = z.object({
  setId: z.string().uuid('Invalid set ID'),
  question: z.string().min(1, 'Question is required'),
  answer: z.string().min(1, 'Answer is required'),
  note: z.string().max(2000).optional(),
  imageId: z.string().optional(),
  order: z.number().int().min(0).optional(),
  isBlurred: z.boolean().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
});

export const BulkCreateCardsDto = z.object({
  setId: z.string().uuid('Invalid set ID'),
  cards: z
    .array(
      z.object({
        question: z.string().min(1, 'Question is required'),
        answer: z.string().min(1, 'Answer is required'),
        note: z.string().max(2000).optional(),
        imageId: z.string().optional(),
        order: z.number().int().min(0).optional(),
        isBlurred: z.boolean().optional(),
        difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
      })
    )
    .min(1, 'At least one card is required')
    .max(100, 'Cannot create more than 100 cards at once'),
});

export const UpdateCardDto = z.object({
  question: z.string().min(1).optional(),
  answer: z.string().min(1).optional(),
  note: z.string().max(2000).nullable().optional(),
  imageId: z.string().nullable().optional(),
  order: z.number().int().min(0).optional(),
  isBlurred: z.boolean().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
});

export const ReorderCardsDto = z.object({
  cardIds: z.array(z.string().uuid()).min(1, 'Card IDs are required'),
});

export const StudyCardDto = z.object({
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
});

export const MoveCardDto = z.object({
  targetSetId: z.string().uuid('Invalid target set ID'),
});

export type CreateCardDtoType = z.infer<typeof CreateCardDto>;
export type BulkCreateCardsDtoType = z.infer<typeof BulkCreateCardsDto>;
export type UpdateCardDtoType = z.infer<typeof UpdateCardDto>;
export type ReorderCardsDtoType = z.infer<typeof ReorderCardsDto>;
export type StudyCardDtoType = z.infer<typeof StudyCardDto>;
export type MoveCardDtoType = z.infer<typeof MoveCardDto>;
