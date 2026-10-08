import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const tripRequestSchema = z.object({
  tripType: z.enum([
    'wedding',
    'corporate-offsite',
    'weekend-getaway',
    'pilgrimage',
    'food-tour',
    'local-guide',
    'festival',
    'adventure',
    'family-holiday',
    'workation',
  ]),
  origin: z.string().trim().min(2).max(120),
  destination: z.string().trim().min(2).max(120),
  startDate: z.iso.date(),
  days: z.number().int().min(1).max(30),
  travellers: z.number().int().min(1).max(50),
  vehicle: z.enum(['bike', 'car', 'suv', 'electric-vehicle']),
  fuelType: z.enum(['petrol', 'diesel', 'cng', 'electric']),
  budget: z.number().positive().optional(),
});

export class CreateTripRequestDto extends createZodDto(tripRequestSchema) {}