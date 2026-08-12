import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from './permissions.enum';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { getPermissionsForRole } from './permissions.matrix';

/**
 * FI360 Permissions Guard
 *
 * Replaces simple role-string checks with granular permission-token
 * verification.  When a route is decorated with
 *   @RequirePermissions(Permission.TYRE_INSPECT)
 * this guard resolves the user's role → permissions from the matrix,
 * and checks that every required permission is present.
 *
 * If no @RequirePermissions() decorator is applied, the guard passes
 * (open to any authenticated user).
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No permission requirement → pass through
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.role) {
      throw new ForbiddenException('No authenticated user context');
    }

    const grantedPermissions = getPermissionsForRole(user.role);

    const hasAll = requiredPermissions.every((perm) =>
      grantedPermissions.includes(perm),
    );

    if (!hasAll) {
      throw new ForbiddenException(
        `Insufficient permissions. Required: [${requiredPermissions.join(', ')}]`,
      );
    }

    return true;
  }
}
