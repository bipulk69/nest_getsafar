import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyM: z.number().nonnegative().optional(),
  observedAt: z.iso.datetime().optional(),
});

export class UpdateLocationDto extends createZodDto(updateLocationSchema) {}