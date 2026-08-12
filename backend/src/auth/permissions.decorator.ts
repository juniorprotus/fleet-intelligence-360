import { SetMetadata } from '@nestjs/common';
import { Permission } from './permissions.enum';

export const PERMISSIONS_KEY = 'fi360_permissions';

/**
 * Require one or more granular permissions on a controller method.
 *
 * Usage:
 *   @RequirePermissions(Permission.TYRE_INSPECT)
 *   @RequirePermissions(Permission.VEHICLE_CREATE, Permission.VEHICLE_UPDATE)
 *
 * The PermissionsGuard will check that the authenticated user's
 * role grants ALL listed permissions.
 */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
