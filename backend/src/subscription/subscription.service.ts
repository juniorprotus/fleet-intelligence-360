import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EventPublisherService } from '../events/event-publisher.service';
import { CreateSubscriptionDto, UpdateSubscriptionStatusDto } from './subscription.dto';
import { Subscription, SubscriptionStatus, Prisma } from '@prisma/client';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  async getPlanInfoForVersionTx(
    planVersionId: string,
    tx: Prisma.TransactionClient,
  ): Promise<{ planId: string; planKey: string } | null> {
    const version = await tx.planVersion.findUnique({
      where: { id: planVersionId },
      include: { plan: true },
    });
    if (!version || !version.plan) return null;
    return {
      planId: version.plan.id,
      planKey: version.plan.planKey,
    };
  }

  async createSubscription(userId: string, dto: CreateSubscriptionDto): Promise<Subscription> {
    const { subscription, planInfo } = await this.prisma.$transaction(async (tx) => {
      const planInfo = await this.getPlanInfoForVersionTx(dto.planVersionId, tx);
      if (!planInfo) {
        throw new NotFoundException(`Plan version ${dto.planVersionId} not found`);
      }

      // Create subscription
      const sub = await tx.subscription.create({
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
          subscriptionId: sub.id,
          oldStatus: dto.status, // Initial state
          newStatus: dto.status,
          reason: 'Initial creation',
          changedBy: userId ? String(userId) : null,
        },
      });



      // Audit Log
      await this.auditService.logAction({
        module: 'COMMERCIAL',
        action: 'SUBSCRIPTION_CREATED',
        entityType: 'Subscription',
        entityId: sub.id,
        userId: userId,
        afterValue: sub,
      }, tx);

      return { subscription: sub, planInfo };
    });

    // Publish Event post-commit
    await this.eventPublisher.publish({
      eventType: 'SubscriptionCreated',
      entityId: subscription.id,
      entityType: 'Subscription',
      tenantId: subscription.tenantId,
      actorId: userId,
      payload: {
        subscriptionId: subscription.id,
        tenantId: subscription.tenantId,
        planId: planInfo?.planId ?? null,
        planVersionId: subscription.planVersionId,
        previousStatus: null,
        currentStatus: subscription.status,
        effectiveAt: new Date(subscription.currentPeriodStart).toISOString(),
        actorId: userId,
        metadata: { reason: 'Initial creation' },
      },
    });

    return subscription;
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

  async activateSubscription(
    userId: string,
    subscriptionId: string,
    reason?: string,
  ): Promise<Subscription> {
    return this.transitionSubscriptionStatus(
      userId,
      subscriptionId,
      SubscriptionStatus.ACTIVE,
      'SUBSCRIPTION_ACTIVATED',
      'SubscriptionActivated',
      reason,
    );
  }

  async suspendSubscription(
    userId: string,
    subscriptionId: string,
    reason?: string,
  ): Promise<Subscription> {
    return this.transitionSubscriptionStatus(
      userId,
      subscriptionId,
      SubscriptionStatus.SUSPENDED,
      'SUBSCRIPTION_SUSPENDED',
      'SubscriptionSuspended',
      reason,
    );
  }

  async cancelSubscription(
    userId: string,
    subscriptionId: string,
    reason?: string,
  ): Promise<Subscription> {
    return this.transitionSubscriptionStatus(
      userId,
      subscriptionId,
      SubscriptionStatus.CANCELLED,
      'SUBSCRIPTION_CANCELLED',
      'SubscriptionCancelled',
      reason,
    );
  }

  async expireSubscription(
    userId: string,
    subscriptionId: string,
    reason?: string,
  ): Promise<Subscription> {
    return this.transitionSubscriptionStatus(
      userId,
      subscriptionId,
      SubscriptionStatus.EXPIRED,
      'SUBSCRIPTION_EXPIRED',
      'SubscriptionExpired',
      reason,
    );
  }

  async changeSubscriptionPlan(
    userId: string,
    subscriptionId: string,
    newPlanVersionId: string,
    reason?: string,
  ): Promise<Subscription> {
    const { updatedSub, previousVersionId, previousPlanInfo, newPlanInfo } = await this.prisma.$transaction(async (tx) => {
      const currentSub = await tx.subscription.findUnique({
        where: { id: subscriptionId },
      });

      if (!currentSub) {
        throw new NotFoundException(`Subscription ${subscriptionId} not found`);
      }

      if (currentSub.planVersionId === newPlanVersionId) {
        const planInfo = await this.getPlanInfoForVersionTx(newPlanVersionId, tx);
        return { updatedSub: currentSub, previousVersionId: newPlanVersionId, previousPlanInfo: planInfo, newPlanInfo: planInfo };
      }

      const previousVersionId = currentSub.planVersionId;
      const previousPlanInfo = await this.getPlanInfoForVersionTx(previousVersionId, tx);
      const newPlanInfo = await this.getPlanInfoForVersionTx(newPlanVersionId, tx);

      if (!newPlanInfo) {
        throw new NotFoundException(`Plan version ${newPlanVersionId} not found`);
      }

      const updatedSub = await tx.subscription.update({
        where: { id: subscriptionId },
        data: { planVersionId: newPlanVersionId },
      });

      // Audit Log
      await this.auditService.logAction({
        module: 'COMMERCIAL',
        action: 'SUBSCRIPTION_PLAN_CHANGED',
        entityType: 'Subscription',
        entityId: subscriptionId,
        userId: userId,
        beforeValue: { planVersionId: previousVersionId },
        afterValue: { planVersionId: newPlanVersionId },
      }, tx);

      return { updatedSub, previousVersionId, previousPlanInfo, newPlanInfo };
    });

    if (newPlanInfo && previousVersionId !== newPlanVersionId) {
      await this.eventPublisher.publish({
        eventType: 'SubscriptionPlanChanged',
        entityId: updatedSub.id,
        entityType: 'Subscription',
        tenantId: updatedSub.tenantId,
        actorId: userId,
        payload: {
          subscriptionId: updatedSub.id,
          tenantId: updatedSub.tenantId,
          planId: newPlanInfo.planId,
          planVersionId: updatedSub.planVersionId,
          previousPlanVersionId: previousVersionId,
          previousStatus: updatedSub.status,
          currentStatus: updatedSub.status,
          effectiveAt: new Date().toISOString(),
          actorId: userId,
          metadata: { reason },
        },
      });
    }

    return updatedSub;
  }

  async renewSubscription(
    userId: string,
    subscriptionId: string,
    newPeriodStart: Date,
    newPeriodEnd: Date,
    reason?: string,
  ): Promise<Subscription> {
    const { updatedSub, previousSub, planInfo } = await this.prisma.$transaction(async (tx) => {
      const currentSub = await tx.subscription.findUnique({
        where: { id: subscriptionId },
      });

      if (!currentSub) {
        throw new NotFoundException(`Subscription ${subscriptionId} not found`);
      }

      const updatedSub = await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          currentPeriodStart: new Date(newPeriodStart),
          currentPeriodEnd: new Date(newPeriodEnd),
        },
      });

      const planInfo = await this.getPlanInfoForVersionTx(updatedSub.planVersionId, tx);

      // Audit Log
      await this.auditService.logAction({
        module: 'COMMERCIAL',
        action: 'SUBSCRIPTION_RENEWED',
        entityType: 'Subscription',
        entityId: subscriptionId,
        userId: userId,
        beforeValue: {
          currentPeriodStart: currentSub.currentPeriodStart,
          currentPeriodEnd: currentSub.currentPeriodEnd,
        },
        afterValue: {
          currentPeriodStart: updatedSub.currentPeriodStart,
          currentPeriodEnd: updatedSub.currentPeriodEnd,
        },
      }, tx);

      return { updatedSub, previousSub: currentSub, planInfo };
    });

    await this.eventPublisher.publish({
      eventType: 'SubscriptionRenewed',
      entityId: updatedSub.id,
      entityType: 'Subscription',
      tenantId: updatedSub.tenantId,
      actorId: userId,
      payload: {
        subscriptionId: updatedSub.id,
        tenantId: updatedSub.tenantId,
        planId: planInfo?.planId ?? null,
        planVersionId: updatedSub.planVersionId,
        previousStatus: previousSub.status,
        currentStatus: updatedSub.status,
        effectiveAt: new Date().toISOString(),
        actorId: userId,
        metadata: {
          reason,
          newPeriodStart: updatedSub.currentPeriodStart.toISOString(),
          newPeriodEnd: updatedSub.currentPeriodEnd.toISOString(),
        },
      },
    });

    return updatedSub;
  }

  private async transitionSubscriptionStatus(
    userId: string,
    subscriptionId: string,
    targetStatus: SubscriptionStatus,
    auditAction: string,
    eventType: string,
    reason?: string,
  ): Promise<Subscription> {
    const { updatedSub, previousSub, planInfo } = await this.prisma.$transaction(async (tx) => {
      const currentSub = await tx.subscription.findUnique({
        where: { id: subscriptionId },
      });

      if (!currentSub) {
        throw new NotFoundException(`Subscription ${subscriptionId} not found`);
      }

      if (currentSub.status === targetStatus) {
        const planInfo = await this.getPlanInfoForVersionTx(currentSub.planVersionId, tx);
        return { updatedSub: currentSub, previousSub: currentSub, planInfo };
      }

      const updateData: Prisma.SubscriptionUpdateInput = { status: targetStatus };

      if (targetStatus === SubscriptionStatus.CANCELLED) {
        updateData.cancelledAt = new Date();
      } else if (targetStatus === SubscriptionStatus.EXPIRED) {
        updateData.endedAt = new Date();
      }

      const updatedSub = await tx.subscription.update({
        where: { id: subscriptionId },
        data: updateData,
      });

      // Status history record
      await tx.subscriptionStatusHistory.create({
        data: {
          subscriptionId: currentSub.id,
          oldStatus: currentSub.status,
          newStatus: targetStatus,
          reason: reason || `Status changed to ${targetStatus}`,
          changedBy: userId ? String(userId) : null,
        },
      });

      const planInfo = await this.getPlanInfoForVersionTx(updatedSub.planVersionId, tx);

      // Audit Log
      await this.auditService.logAction({
        module: 'COMMERCIAL',
        action: auditAction,
        entityType: 'Subscription',
        entityId: subscriptionId,
        userId: userId,
        beforeValue: { status: currentSub.status },
        afterValue: { status: targetStatus },
      }, tx);

      return { updatedSub, previousSub: currentSub, planInfo };
    });

    if (previousSub.status !== targetStatus) {
      await this.eventPublisher.publish({
        eventType: eventType,
        entityId: updatedSub.id,
        entityType: 'Subscription',
        tenantId: updatedSub.tenantId,
        actorId: userId,
        payload: {
          subscriptionId: updatedSub.id,
          tenantId: updatedSub.tenantId,
          planId: planInfo?.planId ?? null,
          planVersionId: updatedSub.planVersionId,
          previousStatus: previousSub.status,
          currentStatus: targetStatus,
          effectiveAt: new Date().toISOString(),
          actorId: userId,
          metadata: { reason },
        },
      });
    }

    return updatedSub;
  }

  async changeSubscriptionStatus(
    userId: string,
    subscriptionId: string,
    dto: UpdateSubscriptionStatusDto,
  ): Promise<Subscription> {
    let auditAction = 'SUBSCRIPTION_STATUS_CHANGED';
    let eventType = 'SubscriptionStatusChanged';

    if (dto.status === SubscriptionStatus.ACTIVE) {
      auditAction = 'SUBSCRIPTION_ACTIVATED';
      eventType = 'SubscriptionActivated';
    } else if (dto.status === SubscriptionStatus.SUSPENDED) {
      auditAction = 'SUBSCRIPTION_SUSPENDED';
      eventType = 'SubscriptionSuspended';
    } else if (dto.status === SubscriptionStatus.CANCELLED) {
      auditAction = 'SUBSCRIPTION_CANCELLED';
      eventType = 'SubscriptionCancelled';
    } else if (dto.status === SubscriptionStatus.EXPIRED) {
      auditAction = 'SUBSCRIPTION_EXPIRED';
      eventType = 'SubscriptionExpired';
    }

    return this.transitionSubscriptionStatus(
      userId,
      subscriptionId,
      dto.status,
      auditAction,
      eventType,
      dto.reason,
    );
  }

  async getPlanInfoForVersion(planVersionId: string): Promise<{ planId: string; planKey: string } | null> {
    const version = await this.prisma.planVersion.findUnique({
      where: { id: planVersionId },
      include: { plan: true },
    });
    if (!version || !version.plan) return null;
    return {
      planId: version.plan.id,
      planKey: version.plan.planKey,
    };
  }

  async getSubscriptionDetails(tenantId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        planVersion: {
          include: {
            plan: true,
            entitlements: {
              include: {
                feature: true,
              },
            },
            limitConfigurations: {
              include: {
                limitDefinition: true,
              },
            },
          },
        },
      },
    });

    if (!sub) {
      return null;
    }

    const vehicleCount = await this.prisma.vehicle.count({
      where: { tenantId, isActive: true },
    });

    let integrationCount = 0;
    try {
      // Direct dynamic query to avoid TypeScript errors if schema bindings are tricky, 
      // but prisma has integrationConnection model mapping at integrationConnection
      integrationCount = await (this.prisma as any).integrationConnection.count({
        where: {
          tenantId,
          status: {
            notIn: ['DISCONNECTED', 'NOT_CONNECTED'],
          },
        },
      });
    } catch {
      // fallback
    }

    return {
      sub,
      vehicleCount,
      integrationCount,
    };
  }
}
