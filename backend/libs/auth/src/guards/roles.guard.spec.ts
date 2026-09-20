import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@app/common';
import { RolesGuard } from './roles.guard';

function contextWith(user: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let reflector: Reflector;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(contextWith({ role: Role.EMPLOYEE }))).toBe(true);
  });

  it('allows an EMPLOYEE when EMPLOYEE is required', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Role.EMPLOYEE]);
    expect(guard.canActivate(contextWith({ role: Role.EMPLOYEE }))).toBe(true);
  });

  it('allows an HRD when HRD is required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.HRD]);
    expect(guard.canActivate(contextWith({ role: Role.HRD }))).toBe(true);
  });

  it('rejects an EMPLOYEE when only HRD is allowed', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.HRD]);
    expect(() =>
      guard.canActivate(contextWith({ role: Role.EMPLOYEE })),
    ).toThrow(ForbiddenException);
  });

  it('rejects when there is no authenticated user', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.HRD]);
    expect(() => guard.canActivate(contextWith(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
