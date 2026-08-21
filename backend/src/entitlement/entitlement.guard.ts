import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRES_FEATURE_KEY } from './requires-feature.decorator';
import { CoreEntitlementResolver } from './core-entitlement.resolver';
import { EntitlementService } from './entitlement.service';

/**
 * EntitlementGuard — HTTP transport layer for commercial access control.
 *
 * Translates CommercialContext decisions from CoreEntitlementResolver
 * into HTTP 403 responses with machine-readable codes.
 *
 * Execution order mandated by FI360 architecture:
 *   Authentication → RBAC → Subscription → Entitlement → Limit → DataScope → Operation
 *
 * This guard sits at the Entitlement layer.
 */
@Injectable()
export class EntitlementGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly resolver: CoreEntitlementResolver,
    private readonly service: EntitlementService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const featureCode = this.reflector.getAllAndOverride<string>(
      REQUIRES_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Backward compatibility: routes without RequiresFeature decorator default to allow
    if (!featureCode) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'USER_CONTEXT_MISSING',
        featureCode,
        message: 'User authentication context is missing.',
      });
    }

    const tenantId = user.tenantId;

    // Resolve commercial context via resolvePlanVersion (may throw ForbiddenException or return null)
    let planVersionId: string | null = null;
    try {
      const result = await this.resolver.resolvePlanVersion(tenantId);
      planVersionId = result;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        const response = (error as any).getResponse();
        const code = response.code || 'ACCESS_DENIED';
        throw new ForbiddenException({
          code,
          featureCode,
        });
      }
      throw error;
    }

    // If resolver returned null, treat as NO_ENTITLEMENT_CONTEXT
    if (!planVersionId) {
      throw new ForbiddenException({
        code: 'NO_ENTITLEMENT_CONTEXT',
        featureCode,
      });
    }

    // Evaluate feature entitlement against the resolved plan version
    const decision = await this.service.evaluateFeature(
      planVersionId,
      featureCode,
    );

    if (!decision.allowed) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'FEATURE_NOT_ENTITLED',
        featureCode,
      });
    }

    return true;
  }

  private getMessageForCode(code: string): string {
    switch (code) {
      case 'NO_SUBSCRIPTION':
        return 'Your commercial account is not yet configured.';
      case 'SUSPENDED':
        return 'Your subscription is currently suspended.';
      case 'EXPIRED':
        return 'Your subscription has expired.';
      case 'NO_ENTITLEMENT_CONTEXT':
      default:
        return 'No valid commercial entitlement context. Please contact support.';
    }
  }
}
