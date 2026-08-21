import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { DevelopmentEntitlementContextResolver } from './development-entitlement-resolver';
import { SubscriptionResolverService } from '../subscription/subscription-resolver.service';
import { CommercialContext } from './commercial-context.interface';

/**
 * CoreEntitlementResolver — The authoritative commercial context resolver.
 *
 * Responsibilities:
 *  - Select the correct resolver: DevelopmentEntitlementContextResolver when
 *    TEST_MODE=true, SubscriptionResolverService in all other cases.
 *  - Return a structured CommercialContext to callers.
 *  - NOT throw HTTP exceptions — those are the responsibility of guards/controllers.
 *
 * This is a domain service. It must not contain HTTP transport semantics.
 */
@Injectable()
export class CoreEntitlementResolver {
  private readonly logger = new Logger(CoreEntitlementResolver.name);

  constructor(
    private readonly devResolver: DevelopmentEntitlementContextResolver,
    private readonly prodResolver: SubscriptionResolverService,
  ) {}

  /**
   * Resolve the effective commercial context for a tenant.
   *
   * Returns a CommercialContext with status VALID and a planVersionId when access
   * is permitted. Returns a denied status (NO_SUBSCRIPTION, SUSPENDED, EXPIRED,
   * NOT_CONFIGURED) when access is not permitted, with a machine-readable code.
   *
   * Never throws. Callers (guards, controllers) translate the result to HTTP responses.
   */
  async resolveCommercialContext(tenantId: string | undefined): Promise<CommercialContext> {
    // Explicit Test/Dev override: ONLY when TEST_MODE=true
    if (process.env.TEST_MODE === 'true') {
      this.logger.debug(`[TEST_MODE] Using DevelopmentEntitlementContextResolver for tenant ${tenantId}`);
      const testPlan = await this.devResolver.resolvePlanVersion(tenantId);
      if (testPlan) {
        return {
          status: 'VALID',
          code: 'VALID',
          planVersionId: testPlan.planVersionId,
          planId: testPlan.planId,
          planKey: testPlan.planKey,
        };
      }
      return {
        status: 'NOT_CONFIGURED',
        code: 'NO_ENTITLEMENT_CONTEXT',
        reason: `No test mapping found for tenant ${tenantId}`,
      };
    }

    // Production path: tenantId is required
    if (!tenantId) {
      return {
        status: 'NOT_CONFIGURED',
        code: 'NO_ENTITLEMENT_CONTEXT',
        reason: 'Missing tenant identifier',
      };
    }

    this.logger.debug(`[PRODUCTION] Using SubscriptionResolverService for tenant ${tenantId}`);
    const decision = await this.prodResolver.resolvePlanVersion(tenantId);

    switch (decision.status) {
      case 'VALID':
        return {
          status: 'VALID',
          code: 'VALID',
          planVersionId: decision.planVersionId,
          subscriptionId: decision.subscriptionId,
          subscriptionStatus: decision.subscriptionStatus,
          planId: decision.planId,
          planKey: decision.planKey,
          currentPeriodStart: decision.currentPeriodStart,
          currentPeriodEnd: decision.currentPeriodEnd,
        };

      case 'SUSPENDED':
        return {
          status: 'SUSPENDED',
          code: 'SUSPENDED',
          subscriptionId: decision.subscriptionId,
          reason: decision.reason || 'Subscription is suspended',
        };

      case 'EXPIRED':
        return {
          status: 'EXPIRED',
          code: 'EXPIRED',
          subscriptionId: decision.subscriptionId,
          reason: decision.reason || 'Subscription period has ended',
        };

      case 'NO_SUBSCRIPTION':
        return {
          status: 'NO_SUBSCRIPTION',
          code: 'NO_SUBSCRIPTION',
          reason: decision.reason || 'Tenant has no commercial subscription',
        };

      default:
        return {
          status: 'NOT_CONFIGURED',
          code: 'NO_ENTITLEMENT_CONTEXT',
          reason: decision.reason || 'No valid commercial entitlement context',
        };
    }
  }

  /**
   * Convenience method returning the planVersionId string for services that only
   * need the ID (e.g., EntitlementGuard, LimitEnforcementService).
   *
   * Returns null when commercial context is not VALID.
   * Callers must inspect the returned value and handle null appropriately.
   *
   * This method is kept for backward compatibility with the guard and limit service.
   * It returns null (not throws) when access is denied.
   */
  async resolvePlanVersion(tenantId: string | undefined): Promise<string> {
    const context = await this.resolveCommercialContext(tenantId);
    if (context.status === 'VALID' && context.planVersionId) {
      return context.planVersionId;
    }
    // Map non‑VALID contexts to appropriate ForbiddenException
    let message = 'Access denied';
    switch (context.code) {
      case 'NO_ENTITLEMENT_CONTEXT':
        message = 'Missing tenant identifier';
        break;
      case 'SUSPENDED':
        message = 'Your subscription is suspended.';
        break;
      case 'EXPIRED':
        message = 'Your subscription has expired.';
        break;
      case 'NO_SUBSCRIPTION':
        message = 'Your commercial account is not yet configured.';
        break;
      default:
        message = context.reason || 'Access denied';
    }
    throw new ForbiddenException({ code: context.code, message });
  }
}
