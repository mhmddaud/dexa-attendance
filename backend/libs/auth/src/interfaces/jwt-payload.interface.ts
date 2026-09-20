import { Role } from '@app/common';

/**
 * Shape of the decoded JWT access token payload.
 * `sub` is the Auth Service user id (logical reference used across services).
 */
export interface JwtPayload {
  sub: number;
  username: string;
  role: Role;
  /** issued-at (added automatically by jsonwebtoken) */
  iat?: number;
  /** expiration (added automatically by jsonwebtoken) */
  exp?: number;
}

/**
 * The authenticated user object attached to `request.user` by the JWT guard.
 */
export interface AuthenticatedUser {
  sub: number;
  username: string;
  role: Role;
}
