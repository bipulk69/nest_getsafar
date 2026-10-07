import { Body, Controller, Post } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Post('creatUser')
  createUser(@Body() body: any) {
    return {
      message: 'User created',
      data: body,
    };
  }
}