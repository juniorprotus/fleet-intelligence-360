import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateSubscriptionDto, UpdateSubscriptionStatusDto } from './subscription.dto';
import { Subscription, SubscriptionStatus, Prisma } from '@prisma/client';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createSubscription(userId: string, dto: CreateSubscriptionDto): Promise<Subscription> {
    return this.prisma.$transaction(async (tx) => {
      // Create subscription
      const subscription = await tx.subscription.create({
        data: {
          tenantId: dto.tenantId,
          planVersionId: dto.planVersionId,
          status: dto.status,
          currentPeriodStart: new Date(dto.currentPeriodStart),
          currentPeriodEnd: new Date(dto.currentPeriodEnd),
          trialEndsAt: dto.trialEndsAt ? new Date(dto.trialEndsAt) : null,
        },
      });

      // Status history
      await tx.subscriptionStatusHistory.create({
        data: {
          subscriptionId: subscription.id,
          oldStatus: dto.status, // Initial state
          newStatus: dto.status,
          reason: 'Initial creation',
          changedBy: userId,
        },
      });

      return subscription;
    });
  }

  async getSubscription(subscriptionId: string): Promise<Subscription> {
    const sub = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });
    if (!sub) {
      throw new NotFoundException(`Subscription ${subscriptionId} not found`);
    }
    return sub;
  }

  async getCurrentSubscription(tenantId: string): Promise<Subscription | null> {
    // Return the latest effective subscription for a tenant.
    // Order by creation date descending to get the most recent one.
    return this.prisma.subscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async changeSubscriptionStatus(
    userId: string,
    subscriptionId: string,
    dto: UpdateSubscriptionStatusDto,
  ): Promise<Subscription> {
    return this.prisma.$transaction(async (tx) => {
      const currentSub = await tx.subscription.findUnique({
        where: { id: subscriptionId },
      });

      if (!currentSub) {
        throw new NotFoundException(`Subscription ${subscriptionId} not found`);
      }

      if (currentSub.status === dto.status) {
        return currentSub; // No change
      }

      const updateData: Prisma.SubscriptionUpdateInput = { status: dto.status };

      // Handle specific status lifecycle metadata
      if (dto.status === SubscriptionStatus.CANCELLED) {
        updateData.cancelledAt = new Date();
      } else if (dto.status === SubscriptionStatus.EXPIRED) {
        updateData.endedAt = new Date();
      }

      const updatedSub = await tx.subscription.update({
        where: { id: subscriptionId },
        data: updateData,
      });

      await tx.subscriptionStatusHistory.create({
        data: {
          subscriptionId: currentSub.id,
          oldStatus: currentSub.status,
          newStatus: dto.status,
          reason: dto.reason || `Status changed to ${dto.status}`,
          changedBy: userId,
        },
      });

      return updatedSub;
    });
  }

  async cancelSubscription(userId: string, subscriptionId: string, reason?: string): Promise<Subscription> {
    return this.changeSubscriptionStatus(userId, subscriptionId, {
      status: SubscriptionStatus.CANCELLED,
      reason: reason || 'User requested cancellation',
    });
  }
}
