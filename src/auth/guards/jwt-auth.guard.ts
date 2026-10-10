import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export type AuthenticatedRequest = Request & {
  user: { userId: number };
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const tokenMatch = authorization?.match(/^Bearer\s+(.+)$/i);

    if (!tokenMatch) {
      throw new UnauthorizedException('Bearer token is required');
    }

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub?: number | string;
      }>(tokenMatch[1]);
      const userId = Number(payload.sub);

      if (!Number.isSafeInteger(userId) || userId <= 0) {
        throw new UnauthorizedException('Bearer token has no valid user ID');
      }

      request.user = { userId };
      return true;
    } catch {
      throw new UnauthorizedException('Bearer token is invalid or expired');
    }
  }
}