import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthServiceService } from './auth-service.service';

describe('AuthServiceService', () => {
  let service: AuthServiceService;
  let prisma: { user: { findUnique: jest.Mock } };
  let jwt: { signAsync: jest.Mock };

  beforeEach(() => {
    prisma = { user: { findUnique: jest.fn() } };
    jwt = { signAsync: jest.fn().mockResolvedValue('signed.jwt.token') };
    service = new AuthServiceService(prisma as never, jwt as never);
  });

  it('returns an access token and user on valid credentials', async () => {
    const hashed = await bcrypt.hash('password', 10);
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      username: 'admin',
      password: hashed,
      role: 'HRD',
    });

    const result = await service.login('admin', 'password');

    expect(result.accessToken).toBe('signed.jwt.token');
    expect(result.user).toEqual({ id: 1, username: 'admin', role: 'HRD' });
    expect(jwt.signAsync).toHaveBeenCalledWith({
      sub: 1,
      username: 'admin',
      role: 'HRD',
    });
  });

  it('throws Unauthorized when the user is not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.login('ghost', 'password')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('throws Unauthorized when the password is invalid', async () => {
    const hashed = await bcrypt.hash('correct-password', 10);
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      username: 'admin',
      password: hashed,
      role: 'HRD',
    });

    await expect(service.login('admin', 'wrong')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });

  it('never returns the password hash in the response', async () => {
    const hashed = await bcrypt.hash('password', 10);
    prisma.user.findUnique.mockResolvedValue({
      id: 2,
      username: 'employee',
      password: hashed,
      role: 'EMPLOYEE',
    });

    const result = await service.login('employee', 'password');
    expect(JSON.stringify(result)).not.toContain(hashed);
  });
});
