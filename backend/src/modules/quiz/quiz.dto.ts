import { z } from 'zod';

const SummaryItemDto = z.object({
  index:         z.number().int(),
  cardId:        z.string().optional(),
  mode:          z.string(),
  prompt:        z.string(),
  isCorrect:     z.boolean(),
  userAnswer:    z.string(),
  correctAnswer: z.string(),
});

export const RecordAttemptDto = z
  .object({
    // Empty for AI quizzes (topic / generated) — they have no source set and are
    // recorded set-less. When present, every id is validated for ownership in the service.
    setIds:    z.array(z.string().min(1)).default([]),
    total:     z.number().int().positive('total must be a positive integer'),
    correct:   z.number().int().min(0, 'correct cannot be negative'),
    mode:      z.string().max(30).optional(),
    quizName:  z.string().max(100).optional(),
    timeSecs:  z.number().int().min(0).optional(),
    responses: z.array(SummaryItemDto).optional(),
  })
  .refine(d => d.correct <= d.total, {
    message: 'correct cannot exceed total',
    path: ['correct'],
  });

export type RecordAttemptDtoType = z.infer<typeof RecordAttemptDto>;

// AI quiz generation: from a topic OR grounded in the user's own sets (sets win).
// count capped at 10 to match parseAIResponse's 10-card ceiling; floor 4 so
// Multiple Choice is available.
export const GenerateQuizDto = z
  .object({
    topic: z.string().trim().min(2, 'topic is too short').max(80, 'topic is too long').optional(),
    setIds: z.array(z.string().min(1)).optional(),
    count: z.number().int().min(4).max(10).default(8),
  })
  .refine(d => (d.setIds?.length ?? 0) > 0 || !!d.topic, {
    message: 'Provide a topic or select sets',
  });

export type GenerateQuizDtoType = z.infer<typeof GenerateQuizDto>;
