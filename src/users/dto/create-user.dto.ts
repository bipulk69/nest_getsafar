import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateUserSchema = z.object({
    name: z
        .string({ error: 'Name is required' })
        .min(2, 'Name must be at least 2 characters long'),
    email: z
        .string({ error: 'Email is required' })
        .email('Invalid email format'),
});

export class CreateUserDto extends createZodDto(CreateUserSchema) { }
