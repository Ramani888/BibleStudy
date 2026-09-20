import { z } from 'zod';

const SummaryItemDto = z.object({
  index:         z.number().int(),
  cardId:        z.string().max(64).optional(),
  mode:          z.string().max(30),
  prompt:        z.string().max(4000),
  isCorrect:     z.boolean(),
  userAnswer:    z.string().max(4000),
  correctAnswer: z.string().max(4000),
});

const INT4_MAX = 2_147_483_647; // Postgres Int upper bound — QuizAttempt persists total/correct/timeSecs as Int

export const RecordAttemptDto = z
  .object({
    // Empty for AI quizzes (topic / generated) — they have no source set and are
    // recorded set-less. When present, every id is validated for ownership in the service.
    // Per-field caps bound abuse at this trust boundary; array COUNTS are intentionally uncapped
    // (a large set or a many-set review is legitimate — capping them would 400 a completed attempt
    // and drop its SR updates). The 10 MB body limit is the size backstop; ints are bounded to the
    // DB Int range so an oversized value 400s here instead of 500ing Prisma at persistence.
    setIds:    z.array(z.string().min(1).max(64)).default([]),
    total:     z.number().int().positive('total must be a positive integer').max(INT4_MAX),
    correct:   z.number().int().min(0, 'correct cannot be negative').max(INT4_MAX),
    mode:      z.string().max(30).optional(),
    quizName:  z.string().max(100).optional(),
    topic:     z.string().max(80).optional(), // AI topic source (set-less topic quizzes)
    timeSecs:  z.number().int().min(0).max(INT4_MAX).optional(),
    responses: z.array(SummaryItemDto).optional(),
  })
  .refine(d => d.correct <= d.total, {
    message: 'correct cannot exceed total',
    path: ['correct'],
  });

export type RecordAttemptDtoType = z.infer<typeof RecordAttemptDto>;

// AI quiz generation: from a document (media) OR the user's own sets OR a topic.
// Precedence in the service is media > sets > topic. count capped at 10 to match
// parseAIResponse's 10-card ceiling; floor 4 so Multiple Choice is available.
// mediaIds max 1 mirrors the chat DTO — one document per quiz.
export const GenerateQuizDto = z
  .object({
    topic: z.string().trim().min(2, 'topic is too short').max(80, 'topic is too long').optional(),
    setIds: z.array(z.string().min(1).max(64)).optional(),
    mediaIds: z.array(z.string().uuid()).max(1).optional(),
    count: z.number().int().min(4).max(10).default(8),
  })
  .refine(d => (d.mediaIds?.length ?? 0) > 0 || (d.setIds?.length ?? 0) > 0 || !!d.topic, {
    message: 'Provide a document, a topic, or select sets',
  });

export type GenerateQuizDtoType = z.infer<typeof GenerateQuizDto>;
