import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { DevelopmentEntitlementContextResolver } from './development-entitlement-resolver';
import { SubscriptionResolverService } from '../subscription/subscription-resolver.service';

@Injectable()
export class CoreEntitlementResolver {
  private readonly logger = new Logger(CoreEntitlementResolver.name);

  constructor(
    private readonly devResolver: DevelopmentEntitlementContextResolver,
    private readonly prodResolver: SubscriptionResolverService,
  ) {}

  async resolvePlanVersion(tenantId: string | undefined): Promise<string | null> {
    // Explicit Test/Dev override based on environment
    if (process.env.TEST_MODE === 'true' || process.env.NODE_ENV === 'test') {
      this.logger.debug(`[TEST_MODE] Using DevelopmentEntitlementContextResolver for tenant ${tenantId}`);
      return this.devResolver.resolvePlanVersion(tenantId);
    }

    if (!tenantId) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'NO_ENTITLEMENT_CONTEXT',
        message: 'No entitlement context',
      });
    }

    this.logger.debug(`Using SubscriptionResolverService for tenant ${tenantId}`);
    
    const decision = await this.prodResolver.resolvePlanVersion(tenantId);
    if (decision.status === 'VALID' && decision.planVersionId) {
      return decision.planVersionId;
    }

    if (decision.status === 'SUSPENDED') {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'SUSPENDED',
        message: 'Your subscription is suspended.',
      });
    }

    if (decision.status === 'EXPIRED') {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'EXPIRED',
        message: 'Your subscription has expired.',
      });
    }

    if (decision.status === 'NO_SUBSCRIPTION') {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'NO_SUBSCRIPTION',
        message: 'Your commercial account is not yet configured.',
      });
    }

    throw new ForbiddenException({
      statusCode: 403,
      code: 'NO_ENTITLEMENT_CONTEXT',
      message: decision.reason || 'No valid commercial entitlement context',
    });
  }
}
