import { Injectable, Logger } from '@nestjs/common';
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
      return null;
    }

    this.logger.debug(`Using SubscriptionResolverService for tenant ${tenantId}`);
    try {
      const decision = await this.prodResolver.resolvePlanVersion(tenantId);
      if (decision.status === 'VALID' && decision.planVersionId) {
        return decision.planVersionId;
      }
      return null;
    } catch (error) {
      this.logger.error(`Error resolving plan version: ${error.message}`);
      return null;
    }
  }
}
