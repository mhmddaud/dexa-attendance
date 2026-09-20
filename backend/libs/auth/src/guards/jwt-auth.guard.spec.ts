import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Role } from '@app/common';
import { JwtAuthGuard } from './jwt-auth.guard';

function contextWith(headers: Record<string, string>): {
  ctx: ExecutionContext;
  request: { headers: Record<string, string>; user?: unknown };
} {
  const request: { headers: Record<string, string>; user?: unknown } = {
    headers,
  };
  const ctx = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { ctx, request };
}

describe('JwtAuthGuard', () => {
  let jwtService: { verifyAsync: jest.Mock };
  let configService: { get: jest.Mock };
  let guard: JwtAuthGuard;

  beforeEach(() => {
    jwtService = { verifyAsync: jest.fn() };
    configService = { get: jest.fn().mockReturnValue('test-secret') };
    guard = new JwtAuthGuard(jwtService as never, configService as never);
  });

  it('attaches the user for a valid token', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: 1,
      username: 'admin',
      role: Role.HRD,
    });
    const { ctx, request } = contextWith({
      authorization: 'Bearer valid.token',
    });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request.user).toEqual({
      sub: 1,
      username: 'admin',
      role: Role.HRD,
    });
  });

  it('rejects when the Authorization header is missing', async () => {
    const { ctx } = contextWith({});
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects when the scheme is not Bearer', async () => {
    const { ctx } = contextWith({ authorization: 'Basic abc' });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects an invalid or expired token', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));
    const { ctx } = contextWith({ authorization: 'Bearer expired.token' });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
