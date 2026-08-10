import { z } from 'zod';

export const CreatePlanDto = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(1000).optional(),
  setIds: z.array(z.string().uuid()).min(1, 'Add at least one set').max(100),
});

export const UpdatePlanDto = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
});

export const AddStepDto = z.object({
  setId: z.string().uuid(),
  title: z.string().trim().max(200).optional(),
});

export const ReorderStepsDto = z.object({
  stepIds: z.array(z.string().uuid()).min(1).max(100),
});

export type CreatePlanDtoType = z.infer<typeof CreatePlanDto>;
export type UpdatePlanDtoType = z.infer<typeof UpdatePlanDto>;
export type AddStepDtoType = z.infer<typeof AddStepDto>;
export type ReorderStepsDtoType = z.infer<typeof ReorderStepsDto>;
