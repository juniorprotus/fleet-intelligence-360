import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRES_FEATURE_KEY } from './requires-feature.decorator';
import { DevelopmentEntitlementContextResolver } from './development-entitlement-resolver';
import { EntitlementService } from './entitlement.service';

@Injectable()
export class EntitlementGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly resolver: DevelopmentEntitlementContextResolver,
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
      throw new ForbiddenException('User context is missing from request');
    }

    const tenantId = user.tenantId;

    // Resolve PlanVersion context using DevelopmentEntitlementContextResolver
    const planVersionId = await this.resolver.resolvePlanVersion(tenantId);
    if (!planVersionId) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'NO_ENTITLEMENT_CONTEXT',
        featureCode,
      });
    }

    const decision = await this.service.evaluateFeature(planVersionId, featureCode);
    if (!decision.allowed) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'FEATURE_NOT_ENTITLED',
        featureCode,
      });
    }

    return true;
  }
}
