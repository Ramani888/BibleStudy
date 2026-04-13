import { z } from 'zod';

export const CreateGroupDto = z.object({
  name:        z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  visibility:  z.enum(['PRIVATE', 'PUBLIC', 'FRIENDS']).optional(),
});

export const UpdateGroupDto = CreateGroupDto.partial();

export const UpdateRoleDto = z.object({
  role: z.enum(['ADMIN', 'MEMBER']),
});

export type CreateGroupDtoType = z.infer<typeof CreateGroupDto>;
export type UpdateGroupDtoType = z.infer<typeof UpdateGroupDto>;
export type UpdateRoleDtoType  = z.infer<typeof UpdateRoleDto>;
