import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { GoogleStrategy} from './google.strategy.js'

@Module({
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy],
})
export class AuthModule {}