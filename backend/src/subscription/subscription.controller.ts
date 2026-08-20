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
    const sub = await this.subscriptionService.getCurrentSubscription(tenantId);
    
    if (!sub) {
      return {
        status: 'NO_SUBSCRIPTION',
        message: 'You do not have an active subscription.',
      };
    }

    // In a full implementation, this would enrich with features, limits, and usage
    return {
      status: sub.status,
      planVersionId: sub.planVersionId, // Keeping internal ID minimal, might replace with plan code later
      trialEndsAt: sub.trialEndsAt,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelledAt: sub.cancelledAt,
      message: `Your subscription is currently ${sub.status}.`,
    };
  }
}
