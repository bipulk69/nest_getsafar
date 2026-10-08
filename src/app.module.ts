import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { appConfig } from './config/app.config.js';
import { databaseConfig } from './config/database.config.js';
import { DatabaseModule } from './database/database.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [
    // 1. Loads .env and configuration objects
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
    }),

    // 2. Initializes PostgreSQL pool and runs schema.sql
    DatabaseModule,
    AuthModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'super-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
