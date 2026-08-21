import { Injectable, Logger } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionStatus } from '@prisma/client';

/**
 * The structured commercial decision from the subscription resolver.
 *
 * This is a pure domain type — no HTTP semantics.
 */
export interface ResolverDecision {
  status: 'VALID' | 'NO_SUBSCRIPTION' | 'EXPIRED' | 'SUSPENDED' | 'NO_ENTITLEMENT_CONTEXT';

  // Present when status === 'VALID'
  planVersionId?: string;

  // Enrichment fields — present when a subscription was found
  subscriptionId?: string;
  subscriptionStatus?: string;
  planId?: string;
  planKey?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;

  reason?: string;
}

@Injectable()
export class SubscriptionResolverService {
  private readonly logger = new Logger(SubscriptionResolverService.name);

  constructor(private readonly subscriptionService: SubscriptionService) {}

  /**
   * Resolves the effective PlanVersion for a given tenant based on production commercial state.
   *
   * Returns a ResolverDecision. Does NOT throw HTTP exceptions.
   */
  async resolvePlanVersion(tenantId: string): Promise<ResolverDecision> {
    if (!tenantId) {
      return { status: 'NO_ENTITLEMENT_CONTEXT', reason: 'Missing tenant identifier' };
    }

    const subscription = await this.subscriptionService.getCurrentSubscription(tenantId);

    if (!subscription) {
      return { status: 'NO_SUBSCRIPTION', reason: 'Tenant has no commercial subscription' };
    }

    const now = new Date();
    const isWithinPeriod =
      now >= subscription.currentPeriodStart && now <= subscription.currentPeriodEnd;

    // Fetch enrichment data (planKey, planId) for the CommercialContext
    const planInfo = typeof this.subscriptionService.getPlanInfoForVersion === 'function' ? await this.subscriptionService.getPlanInfoForVersion(subscription.planVersionId) : undefined;

    const enrichment: Partial<ResolverDecision> = {
      subscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      planId: planInfo?.planId ?? undefined,
      planKey: planInfo?.planKey ?? undefined,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
    };

    switch (subscription.status) {
      case SubscriptionStatus.TRIAL:
      case SubscriptionStatus.ACTIVE:
      case SubscriptionStatus.PAST_DUE:
        if (!isWithinPeriod) {
          return {
            status: 'EXPIRED',
            reason: 'Subscription period has ended',
            ...enrichment,
          };
        }
        return {
          status: 'VALID',
          planVersionId: subscription.planVersionId,
          ...enrichment,
        };

      case SubscriptionStatus.CANCELLED:
        if (isWithinPeriod) {
          return {
            status: 'VALID',
            planVersionId: subscription.planVersionId,
            ...enrichment,
          };
        }
        return {
          status: 'EXPIRED',
          reason: 'Cancelled subscription period has ended',
          ...enrichment,
        };

      case SubscriptionStatus.SUSPENDED:
        return {
          status: 'SUSPENDED',
          reason: 'Subscription is suspended',
          ...enrichment,
        };

      case SubscriptionStatus.EXPIRED:
        return {
          status: 'EXPIRED',
          reason: 'Subscription has expired',
          ...enrichment,
        };

      default:
        return {
          status: 'NO_SUBSCRIPTION',
          reason: 'Unknown subscription status',
          ...enrichment,
        };
    }
  }
}
