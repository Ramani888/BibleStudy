import { z } from 'zod';

export const CreateNoteDto = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  body:  z.string().min(1, 'Body is required'),
  tags:  z.array(z.string()).optional(),
});

export const UpdateNoteDto = z.object({
  title: z.string().min(1, 'Title is required').max(500).optional(),
  body:  z.string().min(1, 'Body is required').optional(),
  tags:  z.array(z.string()).optional(),
});

export type CreateNoteDtoType = z.infer<typeof CreateNoteDto>;
export type UpdateNoteDtoType = z.infer<typeof UpdateNoteDto>;
