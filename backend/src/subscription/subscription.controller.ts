import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SubscriptionService } from './subscription.service';

@Controller('api/v1/subscription')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('me')
  async getMySubscription(@Req() req: any) {
    const tenantId = req.user.tenantId;
    const details = await this.subscriptionService.getSubscriptionDetails(tenantId);
    return this.formatDetails(details, tenantId);
  }

  @Get('status')
  async getSubscriptionStatus(@Req() req: any) {
    const tenantId = req.user.tenantId;
    const details = await this.subscriptionService.getSubscriptionDetails(tenantId);
    return this.formatDetails(details, tenantId);
  }

  private formatDetails(details: any, tenantId: string) {
    if (!details) {
      return {
        tenantId,
        subscriptionId: null,
        status: 'NO_SUBSCRIPTION',
        plan: null,
        trialState: null,
        currentPeriod: null,
        features: [],
        limits: {},
        usage: {
          MAX_VEHICLES: 0,
          MAX_INTEGRATIONS: 0,
        },
        message: 'Your commercial account is not yet configured.',
        nextAction: 'Please contact support or configure a subscription.',
      };
    }

    const { sub, vehicleCount, integrationCount } = details;
    const plan = {
      planId: sub.planVersion?.plan?.id || null,
      planKey: sub.planVersion?.plan?.planKey || null,
      name: sub.planVersion?.plan?.name || null,
      planVersionId: sub.planVersionId,
    };

    const trialState = {
      isTrial: sub.status === 'TRIAL',
      endsAt: sub.trialEndsAt,
    };

    const currentPeriod = {
      start: sub.currentPeriodStart,
      end: sub.currentPeriodEnd,
    };

    const features = sub.planVersion?.entitlements
      ?.filter((e: any) => e.enabled)
      ?.map((e: any) => e.feature?.featureCode) || [];

    const limits: Record<string, any> = {};
    sub.planVersion?.limitConfigurations?.forEach((l: any) => {
      const code = l.limitDefinition?.limitCode;
      if (code) {
        limits[code] = l.isUnlimited ? 'UNLIMITED' : l.limitValue;
      }
    });

    const usage = {
      MAX_VEHICLES: vehicleCount,
      MAX_INTEGRATIONS: integrationCount,
    };

    let message = `Your subscription is currently ${sub.status}.`;
    let nextAction = 'No action required.';
    if (sub.status === 'SUSPENDED') {
      message = 'Your subscription is suspended.';
      nextAction = 'Please update your billing details to resolve the suspension.';
    } else if (sub.status === 'EXPIRED') {
      message = 'Your subscription has expired.';
      nextAction = 'Please renew your subscription to restore access.';
    } else if (sub.status === 'ACTIVE') {
      message = 'Your subscription is active.';
    } else if (sub.status === 'TRIAL') {
      message = `Your trial is active.`;
    }

    return {
      tenantId,
      subscriptionId: sub.id,
      status: sub.status,
      plan,
      trialState,
      currentPeriod,
      endPeriodDate: sub.endedAt || sub.cancelledAt || sub.currentPeriodEnd,
      features,
      limits,
      usage,
      message,
      nextAction,
    };
  }
}
