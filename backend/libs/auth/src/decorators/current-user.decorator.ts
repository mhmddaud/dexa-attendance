import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../interfaces/jwt-payload.interface';

/**
 * Extract the authenticated user (attached by JwtAuthGuard) from the request.
 * Optionally pass a key to pluck a single field, e.g. @CurrentUser('sub').
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;
    if (!user) {
      return undefined;
    }
    return data ? user[data] : user;
  },
);
