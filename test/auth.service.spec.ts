import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../src/database/database.service.js';
import { AuthService } from '../src/auth/auth.service.js';
import { GoogleProfile } from '../src/auth/interfaces/google-profile.interface.js';

describe('AuthService Google sign-in', () => {
  const profile: GoogleProfile = {
    googleId: 'google-user-123',
    email: 'person@example.com',
    name: 'Example Person',
  };

  let databaseService: { query: ReturnType<typeof vi.fn> };
  let jwtService: { sign: ReturnType<typeof vi.fn> };
  let authService: AuthService;

  beforeEach(() => {
    databaseService = { query: vi.fn() };
    jwtService = { sign: vi.fn(() => 'app-jwt-token') };
    authService = new AuthService(
      databaseService as unknown as DatabaseService,
      jwtService as unknown as JwtService,
    );
  });

  it('reuses an account already linked to the Google ID', async () => {
    databaseService.query
      .mockResolvedValueOnce({
        rows: [{ id: 12, name: 'Old Name', email: profile.email }],
      })
      .mockResolvedValueOnce({
        rows: [{ id: 12, name: profile.name, email: profile.email }],
      });

    const result = await authService.googleLogin(profile);

    expect(databaseService.query).toHaveBeenCalledTimes(2);
    expect(databaseService.query.mock.calls[1][1]).toEqual([
      profile.name,
      'app-jwt-token',
      12,
    ]);
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: 12,
      name: profile.name,
      email: profile.email,
    });
    expect(result).toMatchObject({
      message: 'Google sign-in successful',
      token: 'app-jwt-token',
      user: { id: 12, name: profile.name, email: profile.email },
    });
  });

  it('creates a Google account when the Google ID and email are new', async () => {
    databaseService.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ id: 13, name: profile.name, email: profile.email }],
      })
      .mockResolvedValueOnce({
        rows: [{ id: 13, name: profile.name, email: profile.email }],
      });

    const result = await authService.googleLogin(profile);

    expect(databaseService.query).toHaveBeenCalledTimes(4);
    expect(databaseService.query.mock.calls[2][1]).toEqual([
      profile.name,
      profile.email,
      profile.googleId,
    ]);
    expect(databaseService.query.mock.calls[3][1]).toEqual([
      profile.name,
      'app-jwt-token',
      13,
    ]);
    expect(result).toMatchObject({
      token: 'app-jwt-token',
      user: { id: 13, name: profile.name, email: profile.email },
    });
  });

  it('does not automatically link an existing local account by email', async () => {
    databaseService.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 14 }] });

    await expect(authService.googleLogin(profile)).rejects.toBeInstanceOf(ConflictException);
    expect(databaseService.query).toHaveBeenCalledTimes(2);
  });
});