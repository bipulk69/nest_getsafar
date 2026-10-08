import { Body, Controller, Post, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { AuthGuard } from '@nestjs/passport';
import { GoogleProfile } from './interfaces/google-profile.interface.js';
import type { Request } from 'express';

type GoogleAuthRequest = Request & { user: GoogleProfile };

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('creatUser')
    async createUser(@Body() body: CreateUserDto) {
        return this.authService.createUser(body);
    }

    @Post('userLogin')
    async userLogin(@Body() body: CreateUserDto) {
        return this.authService.userLogin(body);
    }

    @Get('google')
    @UseGuards(AuthGuard('google'))
    startGoogleSignIn() {

    }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    googleSignInCallback(@Req() req: GoogleAuthRequest) {
        return this.authService.googleLogin(req.user);
    }
}