import { Injectable, Logger, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionStatus } from '@prisma/client';

export interface ResolverDecision {
  status: 'VALID' | 'NO_SUBSCRIPTION' | 'EXPIRED' | 'SUSPENDED' | 'NO_ENTITLEMENT_CONTEXT';
  planVersionId?: string;
  reason?: string;
}

@Injectable()
export class SubscriptionResolverService {
  private readonly logger = new Logger(SubscriptionResolverService.name);

  constructor(private readonly subscriptionService: SubscriptionService) {}

  /**
   * Resolves the effective PlanVersion for a given tenant based on production commercial state.
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
    const isWithinPeriod = now >= subscription.currentPeriodStart && now <= subscription.currentPeriodEnd;

    switch (subscription.status) {
      case SubscriptionStatus.TRIAL:
      case SubscriptionStatus.ACTIVE:
      case SubscriptionStatus.PAST_DUE: // Permitted for now, could have policy restrictions
        if (!isWithinPeriod) {
          // Depending on policy, we might auto-expire this or wait for a cron. 
          // But strict reading says period matters.
          // Wait, user said: "A CANCELLED subscription may remain effective until the period ends. After period end: -> no runtime commercial access."
          // For active/past_due, usually you give a grace period or wait for billing to update the period.
          // Let's enforce period strictly as requested: "now >= currentPeriodStart AND now <= currentPeriodEnd subject to lifecycle rules".
          return { status: 'EXPIRED', reason: 'Subscription period has ended' };
        }
        return { status: 'VALID', planVersionId: subscription.planVersionId };

      case SubscriptionStatus.CANCELLED:
        if (isWithinPeriod) {
          return { status: 'VALID', planVersionId: subscription.planVersionId };
        }
        return { status: 'EXPIRED', reason: 'Cancelled subscription period has ended' };

      case SubscriptionStatus.SUSPENDED:
        return { status: 'SUSPENDED', reason: 'Subscription is suspended' };

      case SubscriptionStatus.EXPIRED:
        return { status: 'EXPIRED', reason: 'Subscription has expired' };

      default:
        return { status: 'NO_SUBSCRIPTION', reason: 'Unknown subscription status' };
    }
  }

  /**
   * Convenience method to get the planVersionId and throw standard exceptions if invalid.
   */
  async getEffectivePlanVersionId(tenantId: string): Promise<string> {
    const decision = await this.resolvePlanVersion(tenantId);
    
    if (decision.status === 'VALID' && decision.planVersionId) {
      return decision.planVersionId;
    }

    if (decision.status === 'SUSPENDED') {
      throw new ForbiddenException(decision.reason);
    }
    
    throw new UnauthorizedException(decision.reason || 'No valid commercial entitlement context');
  }
}
