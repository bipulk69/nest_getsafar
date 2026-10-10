import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard.js';

function createContext(authorization?: string) {
  const request: { headers: { authorization?: string }; user?: { userId: number } } = {
    headers: {},
  };
  if (authorization) {
    request.headers.authorization = authorization;
  }

  return {
    request,
    context: {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    },
  };
}

describe('JwtAuthGuard', () => {
  it('sets the user ID from a verified bearer token', async () => {
    const jwtService = {
      verifyAsync: vi.fn().mockResolvedValue({ sub: 21 }),
    };
    const guard = new JwtAuthGuard(jwtService as unknown as JwtService);
    const { context, request } = createContext('Bearer valid-token');

    await expect(guard.canActivate(context as never)).resolves.toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token');
    expect(request.user).toEqual({ userId: 21 });
  });

  it('rejects requests without a bearer token', async () => {
    const guard = new JwtAuthGuard({
      verifyAsync: vi.fn(),
    } as unknown as JwtService);
    const { context } = createContext();

    await expect(guard.canActivate(context as never)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects tokens without a valid user subject', async () => {
    const guard = new JwtAuthGuard({
      verifyAsync: vi.fn().mockResolvedValue({ sub: 'not-a-user-id' }),
    } as unknown as JwtService);
    const { context } = createContext('Bearer invalid-subject-token');

    await expect(guard.canActivate(context as never)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
