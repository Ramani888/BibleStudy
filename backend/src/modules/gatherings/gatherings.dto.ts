import { z } from 'zod';

export const CreateGatheringDto = z.object({
  title:        z.string().min(1, 'Title is required').max(200),
  description:  z.string().max(1000).optional(),
  date:         z.string().datetime('Invalid date format'),
  groupId:      z.string().uuid().optional(),
  locationName: z.string().max(200).optional(),
  locationLat:  z.number().min(-90).max(90).optional(),
  locationLng:  z.number().min(-180).max(180).optional(),
  meetingLink:  z.string().url().optional(),
  visibility:   z.enum(['PRIVATE', 'PUBLIC', 'FRIENDS']).optional(),
});

export const UpdateGatheringDto = CreateGatheringDto.partial();

export const RsvpDto = z.object({
  status: z.enum(['GOING', 'MAYBE', 'NOT_GOING']),
});

export type CreateGatheringDtoType = z.infer<typeof CreateGatheringDto>;
export type UpdateGatheringDtoType = z.infer<typeof UpdateGatheringDto>;
export type RsvpDtoType            = z.infer<typeof RsvpDto>;
