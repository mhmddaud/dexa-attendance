import { SetMetadata } from '@nestjs/common';
import { Role } from '@app/common';

export const ROLES_KEY = 'roles';

/**
 * Attach allowed roles metadata to a route handler or controller.
 *
 * @example
 * @Roles(Role.HRD)
 * @Roles(Role.EMPLOYEE, Role.HRD)
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
