import { z } from 'zod';

export const UpdateLocationDto = z.object({
  lat:          z.number().min(-90).max(90),
  lng:          z.number().min(-180).max(180),
  locationName: z.string().max(200).optional(),
});

export const PrivacyDto = z.object({
  privacy: z.enum(['OFF', 'FRIENDS', 'SELECTED', 'EVERYONE']),
});

export type UpdateLocationDtoType = z.infer<typeof UpdateLocationDto>;
export type PrivacyDtoType        = z.infer<typeof PrivacyDto>;
