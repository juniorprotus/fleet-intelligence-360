import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CoreEntitlementResolver } from '../entitlement/core-entitlement.resolver';
import { EntitlementService } from '../entitlement/entitlement.service';
import { UsageService } from '../usage/usage.service';

/**
 * SubscriptionController — UX-facing commercial context API.
 *
 * Orchestrates existing services to answer:
 *  - What plan am I on?
 *  - What is my subscription status?
 *  - What is my current period?
 *  - When does it end/renew?
 *  - What features are available?
 *  - What limits apply?
 *  - What usage is currently consumed?
 *  - Why is access unavailable?
 *  - What action should the user take?
 *
 * This controller does NOT duplicate commercial logic. It delegates to:
 *   SubscriptionResolverService — authoritative subscription resolution
 *   EntitlementService          — feature entitlement data
 *   UsageService                — current usage against limits
 *
 * It does NOT independently calculate vehicle counts or validate subscriptions.
 */
@ApiTags('Commercial Subscription')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/subscription')
export class SubscriptionController {
  constructor(
    private readonly entitlementResolver: CoreEntitlementResolver,
    private readonly entitlementService: EntitlementService,
    private readonly usageService: UsageService,
  ) {}

  /**
   * GET /api/v1/subscription/me
   *
   * Returns the full commercial context for the authenticated user's tenant,
   * including plan, features, limits, usage, and UX-friendly status.
   */
  @Get('me')
  @ApiOperation({ summary: 'Get full commercial subscription context for the authenticated tenant' })
  async getMySubscription(@Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.buildCommercialResponse(tenantId);
  }

  /**
   * GET /api/v1/subscription/status
   *
   * Returns the commercial subscription status for the authenticated tenant.
   * Same payload as /me — optimized for status polling by frontend.
   */
  @Get('status')
  @ApiOperation({ summary: 'Get commercial subscription status for the authenticated tenant' })
  async getSubscriptionStatus(@Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.buildCommercialResponse(tenantId);
  }

  /**
   * Orchestrates SubscriptionResolverService, EntitlementService, and UsageService
   * to build the unified commercial context response.
   *
   * Does NOT duplicate any service logic.
   */
  private async buildCommercialResponse(tenantId: string) {
    // 1. Resolve commercial context (authoritative subscription decision)
    const decision = await this.entitlementResolver.resolveCommercialContext(tenantId);

    // 2. If denied: return structured denial response with UX guidance
    if (decision.status !== 'VALID' || !decision.planVersionId) {
      return {
        tenantId,
        status: decision.status,
        code: decision.status,
        plan: null,
        currentPeriod: null,
        trialState: null,
        features: [],
        limits: {},
        usage: {},
        message: this.getStatusMessage(decision.status),
        nextAction: this.getNextAction(decision.status),
      };
    }

    const planVersionId = decision.planVersionId;

    // 3. Fetch features via EntitlementService (the authoritative source)
    const enabledFeatures = await this.entitlementService.listEnabledFeatures(planVersionId);
    const featureCodes = enabledFeatures.map((f) => f.featureCode);

    // 4. Fetch limits via EntitlementService (reads PlanVersionLimits directly)
    const planEntitlements = await this.entitlementService.listFeaturesForPlanVersion(planVersionId);

    // 5. Fetch usage via UsageService (the authoritative usage authority)
    const usageSummary = await this.usageService.getUsageSummary(tenantId);
    const usageMap: Record<string, any> = {};
    const limitsMap: Record<string, any> = {};
    for (const snapshot of usageSummary) {
      usageMap[snapshot.limitCode] = {
        current: snapshot.currentUsage,
        limit: snapshot.isUnlimited ? 'UNLIMITED' : snapshot.configuredLimit,
        remaining: snapshot.isUnlimited ? null : snapshot.remaining,
        status: snapshot.status,
      };
      if (snapshot.status !== 'NOT_CONFIGURED') {
        limitsMap[snapshot.limitCode] = snapshot.isUnlimited ? 'UNLIMITED' : snapshot.configuredLimit;
      }
    }

    // 6. Build plan metadata from resolver decision (no DB re-fetch needed)
    const plan = {
      planVersionId,
      planId: decision.planId ?? null,
      planKey: decision.planKey ?? null,
    };

    // 7. Build current period from resolver decision
    const currentPeriod = {
      start: decision.currentPeriodStart ?? null,
      end: decision.currentPeriodEnd ?? null,
    };

    return {
      tenantId,
      subscriptionId: decision.subscriptionId ?? null,
      status: decision.subscriptionStatus ?? decision.status,
      code: 'VALID',
      plan,
      currentPeriod,
      trialState: {
        isTrial: decision.subscriptionStatus === 'TRIAL',
      },
      features: featureCodes,
      limits: limitsMap,
      usage: usageMap,
      message: this.getStatusMessage(decision.subscriptionStatus ?? 'ACTIVE'),
      nextAction: 'No action required.',
    };
  }

  private getStatusMessage(status: string): string {
    switch (status) {
      case 'VALID':
      case 'ACTIVE':
        return 'Your subscription is active.';
      case 'TRIAL':
        return 'Your trial is active.';
      case 'PAST_DUE':
        return 'Your subscription payment is past due.';
      case 'CANCELLED':
        return 'Your subscription has been cancelled but remains active until the period ends.';
      case 'SUSPENDED':
        return 'Your subscription is currently suspended.';
      case 'EXPIRED':
        return 'Your subscription has expired.';
      case 'NO_SUBSCRIPTION':
        return 'Your commercial account is not yet configured.';
      case 'NOT_CONFIGURED':
        return 'No valid commercial entitlement context. Please contact support.';
      default:
        return `Subscription status: ${status}.`;
    }
  }

  private getNextAction(status: string): string {
    switch (status) {
      case 'SUSPENDED':
        return 'Please update your billing details to resolve the suspension.';
      case 'EXPIRED':
        return 'Please renew your subscription to restore access.';
      case 'NO_SUBSCRIPTION':
        return 'Please contact support or configure a subscription.';
      case 'PAST_DUE':
        return 'Please update your payment method to avoid service interruption.';
      case 'NOT_CONFIGURED':
        return 'Please contact support to configure your commercial account.';
      default:
        return 'No action required.';
    }
  }
}
