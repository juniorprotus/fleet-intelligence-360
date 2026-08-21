import { Controller, Get, Post, Body, Param, Req, UseGuards, ForbiddenException, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission, ScopeLevel } from '../auth/permissions.enum';
import { getScopeLevelForRole } from '../auth/permissions.matrix';
import { CoreEntitlementResolver } from '../entitlement/core-entitlement.resolver';
import { EntitlementService } from '../entitlement/entitlement.service';
import { UsageService } from '../usage/usage.service';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './subscription.dto';

@ApiTags('Commercial Subscription')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/subscription')
export class SubscriptionController {
  constructor(
    private readonly entitlementResolver: CoreEntitlementResolver,
    private readonly entitlementService: EntitlementService,
    private readonly usageService: UsageService,
    private readonly subscriptionService: SubscriptionService,
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

  @Post()
  @RequirePermissions(Permission.SUBSCRIPTION_MANAGE)
  @UseGuards(PermissionsGuard)
  @ApiOperation({ summary: 'Create subscription' })
  async createSubscription(@Req() req: any, @Body() dto: CreateSubscriptionDto) {
    const scopeLevel = req.user.scopeLevel || getScopeLevelForRole(req.user.role);
    if (scopeLevel !== ScopeLevel.SYSTEM && dto.tenantId !== req.user.tenantId) {
      throw new ForbiddenException('Access denied: cannot create subscription for another tenant');
    }
    return this.subscriptionService.createSubscription(req.user.userId || 'system', dto);
  }

  @Get(':id')
  @RequirePermissions(Permission.SUBSCRIPTION_READ)
  @UseGuards(PermissionsGuard)
  @ApiOperation({ summary: 'Get subscription by ID' })
  async getSubscription(@Req() req: any, @Param('id') id: string) {
    await this.checkTenantAccess(req, id);
    return this.subscriptionService.getSubscription(id);
  }

  @Post(':id/activate')
  @RequirePermissions(Permission.SUBSCRIPTION_MANAGE)
  @UseGuards(PermissionsGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Activate subscription' })
  async activateSubscription(@Req() req: any, @Param('id') id: string, @Body() body?: { reason?: string }) {
    await this.checkTenantAccess(req, id);
    return this.subscriptionService.activateSubscription(req.user.userId || 'system', id, body?.reason);
  }

  @Post(':id/change-plan')
  @RequirePermissions(Permission.SUBSCRIPTION_CHANGE_PLAN)
  @UseGuards(PermissionsGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Change subscription plan version' })
  async changePlan(@Req() req: any, @Param('id') id: string, @Body() body: { planVersionId: string; reason?: string }) {
    await this.checkTenantAccess(req, id);
    return this.subscriptionService.changeSubscriptionPlan(req.user.userId || 'system', id, body.planVersionId, body.reason);
  }

  @Post(':id/suspend')
  @RequirePermissions(Permission.SUBSCRIPTION_MANAGE)
  @UseGuards(PermissionsGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Suspend subscription' })
  async suspendSubscription(@Req() req: any, @Param('id') id: string, @Body() body?: { reason?: string }) {
    await this.checkTenantAccess(req, id);
    return this.subscriptionService.suspendSubscription(req.user.userId || 'system', id, body?.reason);
  }

  @Post(':id/cancel')
  @RequirePermissions(Permission.SUBSCRIPTION_CANCEL)
  @UseGuards(PermissionsGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancel subscription' })
  async cancelSubscription(@Req() req: any, @Param('id') id: string, @Body() body?: { reason?: string }) {
    await this.checkTenantAccess(req, id);
    return this.subscriptionService.cancelSubscription(req.user.userId || 'system', id, body?.reason);
  }

  @Post(':id/expire')
  @RequirePermissions(Permission.SUBSCRIPTION_MANAGE)
  @UseGuards(PermissionsGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Expire subscription' })
  async expireSubscription(@Req() req: any, @Param('id') id: string, @Body() body?: { reason?: string }) {
    await this.checkTenantAccess(req, id);
    return this.subscriptionService.expireSubscription(req.user.userId || 'system', id, body?.reason);
  }

  @Post(':id/renew')
  @RequirePermissions(Permission.SUBSCRIPTION_MANAGE)
  @UseGuards(PermissionsGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Renew subscription' })
  async renewSubscription(@Req() req: any, @Param('id') id: string, @Body() body: { currentPeriodStart: string; currentPeriodEnd: string; reason?: string }) {
    await this.checkTenantAccess(req, id);
    return this.subscriptionService.renewSubscription(
      req.user.userId || 'system',
      id,
      new Date(body.currentPeriodStart),
      new Date(body.currentPeriodEnd),
      body.reason,
    );
  }

  private async checkTenantAccess(req: any, subscriptionId: string) {
    const sub = await this.subscriptionService.getSubscription(subscriptionId);
    const scopeLevel = req.user.scopeLevel || getScopeLevelForRole(req.user.role);
    if (scopeLevel !== ScopeLevel.SYSTEM && sub.tenantId !== req.user.tenantId) {
      throw new ForbiddenException('Access denied: subscription belongs to another tenant');
    }
    return sub;
  }
}
