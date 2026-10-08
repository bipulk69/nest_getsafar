import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import crypto from 'node:crypto';
import { DatabaseService } from '../database/database.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { GoogleProfile } from './interfaces/google-profile.interface.js';

type CreatedUserRow = {
    id: number;
    name: string;
    email: string;
    password: string;
    token: string;
    created_at: Date;
    updated_at: Date;
};

type GoogleUserRow = {
    id: number;
    name: string;
    email: string;
};


@Injectable()
export class AuthService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly jwtService: JwtService,
    ) { }

    private hashPassword(password: string): string {
        const salt = crypto.randomBytes(16).toString('hex');
        const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
        return `${salt}:${derivedKey}`;
    }

    private verifyPassword(password: string, hashedPassword: string): boolean {
        if (!hashedPassword || typeof hashedPassword !== 'string') {
            return false;
        }

        const [salt, hash] = hashedPassword.split(':');

        if (!salt || !hash) {
            return false;
        }

        const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
        const hashBuffer = Buffer.from(hash, 'hex');
        const derivedKeyBuffer = Buffer.from(derivedKey, 'hex');

        if (hashBuffer.length !== derivedKeyBuffer.length) {
            return false;
        }

        return crypto.timingSafeEqual(hashBuffer, derivedKeyBuffer);
    }

    async createUser(body: CreateUserDto) {
        const { name, email, password } = body;

        if (!name) {
            throw new BadRequestException('Name is required');
        }

        if (!email) {
            throw new BadRequestException('Email is required');
        }

        if (!password) {
            throw new BadRequestException('Password is required')
        }

        try {
            const existingUser = await this.databaseService.query<{ id: number }>(
                `SELECT id FROM users WHERE email = $1`,
                [email],
            );

            if (existingUser.rows.length > 0) {
                throw new ConflictException('Email already exists');
            }

            const hashedPassword = this.hashPassword(password);

            const token = this.jwtService.sign({
                email,
                name,
            });

            const result = await this.databaseService.query<CreatedUserRow>(
                `INSERT INTO users (name, email, password, token)
                VALUES ($1, $2, $3, $4)
                RETURNING id, name, email, token, created_at, updated_at`,
                [name, email, hashedPassword, token],
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

    async userLogin(body: CreateUserDto) {
        const { email, password } = body;

        if (!email || !email.trim()) {
            throw new BadRequestException('Email is required');
        }

        if (!password || !password.trim()) {
            throw new BadRequestException('Password is required');
        }

        const result = await this.databaseService.query(
            `SELECT id, name, email, password, token
            FROM users
            where email = $1`,
            [email]
        )

        if (result.rows.length === 0) {
            throw new UnauthorizedException('Invalid email or password')
        }

        const user = result.rows[0];

        if (!this.verifyPassword(password, user.password)) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const token = this.jwtService.sign({
            sub: user.id,
            name: user.name,
            email: user.email,
        });

        return {
            message: 'Login successful',
            token,
            expiresIn: '24h',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        };
    }

    async googleLogin(profile: GoogleProfile) {
        if (!profile.googleId || !profile.email || !profile.name) {
            throw new UnauthorizedException('Google profile is incomplete');
        }

        const existingGoogleUser = await this.databaseService.query<GoogleUserRow>(
            `SELECT id, name, email FROM users WHERE google_id = $1`,
            [profile.googleId],
        );

        let user = existingGoogleUser.rows[0];

        if (!user) {
            const existingEmail = await this.databaseService.query<{ id: number }>(
                `SELECT id FROM users WHERE LOWER(email) = LOWER($1)`,
                [profile.email],
            );

            if (existingEmail.rows.length > 0) {
                throw new ConflictException(
                    'An account with this email already exists. Sign in with your password first.',
                );
            }

            try {
                const createdUser = await this.databaseService.query<GoogleUserRow>(
                    `INSERT INTO users (name, email, google_id)
                    VALUES ($1, $2, $3)
                    RETURNING id, name, email`,
                    [profile.name, profile.email.toLowerCase(), profile.googleId],
                );

                user = createdUser.rows[0];
            } catch (error: any) {
                if (error?.code === '23505') {
                    throw new ConflictException('This Google account or email is already registered');
                }
                throw error;
            }
        }

        const token = this.jwtService.sign({
            sub: user.id,
            name: user.name,
            email: user.email,
        });

        return {
            message: 'Google sign-in successful',
            token,
            expiresIn: '24h',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        };
    }
}
