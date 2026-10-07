import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
// import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';

type CreatedUserRow = {
    id: number;
    name: string;
    email: string;
    created_at: Date;
    updated_at: Date;
};

@Injectable()
export class AuthService {
    constructor(private readonly databaseService: DatabaseService) { }

    async createUser(body: CreateUserDto) {
        const name = body?.name?.trim();
        const email = body?.email?.trim();

        if (!name) {
            throw new BadRequestException('Name is required');
        }

        if (!email) {
            throw new BadRequestException('Email is required');
        }

        try {
            const existingUser = await this.databaseService.query(
                `SELECT id FROM users WHERE email = $1`, [email]
            )
            if(existingUser){
                throw new ConflictException('Email already existis')
            }

            const result = await this.databaseService.query<CreatedUserRow>(
                `INSERT INTO users (name, email)
                VALUES ($1, $2)
                RETURNING id, name, email, created_at, updated_at`,
                [name, email],
            );

            const user = result.rows[0];

            return {
                message: 'User created successfully',
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    createdAt: user.created_at,
                    updatedAt: user.updated_at,
                },
            };
        } catch (error: any) {
            if (error?.code === '23505') {
                throw new ConflictException('Email already exists');
            }
            throw error;
        }
    }
}
