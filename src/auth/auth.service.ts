import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';

type CreatedUserRow = {
    id: number;
    name: string;
    email: string;
    token: string;
    created_at: Date;
    updated_at: Date;
};

@Injectable()
export class AuthService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly jwtService: JwtService,
    ) { }

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
            const existingUser = await this.databaseService.query<{ id: number }>(
                `SELECT id FROM users WHERE email = $1`,
                [email],
            );

            if (existingUser.rows.length > 0) {
                throw new ConflictException('Email already exists');
            }

            const token = this.jwtService.sign({
                email,
                name,
            });

            const result = await this.databaseService.query<CreatedUserRow>(
                `INSERT INTO users (name, email, token)
                VALUES ($1, $2, $3)
                RETURNING id, name, email, token, created_at, updated_at`,
                [name, email, token],
            );

            const user = result.rows[0];

            return {
                message: 'User created successfully',
                token: user.token,
                expiresIn: '24h',
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    token: user.token,
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
