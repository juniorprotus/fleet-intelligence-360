import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionService } from './subscription.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EventPublisherService } from '../events/event-publisher.service';
import { SubscriptionStatus } from '@prisma/client';

describe('SubscriptionEvents', () => {
  let service: SubscriptionService;
  let prismaService: any;
  let auditService: any;
  let eventPublisher: any;

  beforeEach(async () => {
    prismaService = {
      $transaction: jest.fn().mockImplementation(async (cb) => {
        return cb(prismaService);
      }),
      subscription: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      subscriptionStatusHistory: {
        create: jest.fn(),
      },
      planVersion: {
        findUnique: jest.fn(),
      },
    };

    auditService = {
      logAction: jest.fn(),
    };

    eventPublisher = {
      publish: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        { provide: PrismaService, useValue: prismaService },
        { provide: AuditService, useValue: auditService },
        { provide: EventPublisherService, useValue: eventPublisher },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
  });

  it('should publish SubscriptionCreated event on creation', async () => {
    const dto = {
      tenantId: 't1',
      planVersionId: 'pv1',
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date().toISOString(),
    };

    prismaService.subscription.create.mockResolvedValue({ id: 'sub1', ...dto });
    prismaService.planVersion.findUnique.mockResolvedValue({
      id: 'pv1',
      plan: { id: 'p1', planKey: 'enterprise' },
    });

    const subscription = await service.createSubscription('u1', dto);

    expect(eventPublisher.publish).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'SubscriptionCreated',
      entityId: 'sub1',
      entityType: 'Subscription',
      tenantId: 't1',
      actorId: 'u1',
      payload: expect.objectContaining({
        subscriptionId: 'sub1',
        tenantId: 't1',
        planId: 'p1',
        planVersionId: 'pv1',
        currentStatus: SubscriptionStatus.ACTIVE,
      }),
    }));
  });

  it('should publish SubscriptionActivated event on activation', async () => {
    const existing = { id: 'sub1', tenantId: 't1', planVersionId: 'pv1', status: SubscriptionStatus.TRIAL };
    prismaService.subscription.findUnique.mockResolvedValue(existing);
    prismaService.subscription.update.mockResolvedValue({ ...existing, status: SubscriptionStatus.ACTIVE });
    prismaService.planVersion.findUnique.mockResolvedValue({
      id: 'pv1',
      plan: { id: 'p1', planKey: 'enterprise' },
    });

    await service.activateSubscription('u1', 'sub1', 'Activating');

    expect(eventPublisher.publish).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'SubscriptionActivated',
      entityId: 'sub1',
      tenantId: 't1',
      payload: expect.objectContaining({
        subscriptionId: 'sub1',
        previousStatus: SubscriptionStatus.TRIAL,
        currentStatus: SubscriptionStatus.ACTIVE,
      }),
    }));
  });

  it('should publish SubscriptionSuspended event on suspension', async () => {
    const existing = { id: 'sub1', tenantId: 't1', planVersionId: 'pv1', status: SubscriptionStatus.ACTIVE };
    prismaService.subscription.findUnique.mockResolvedValue(existing);
    prismaService.subscription.update.mockResolvedValue({ ...existing, status: SubscriptionStatus.SUSPENDED });
    prismaService.planVersion.findUnique.mockResolvedValue({
      id: 'pv1',
      plan: { id: 'p1', planKey: 'enterprise' },
    });

    await service.suspendSubscription('u1', 'sub1', 'Suspended for non-payment');

    expect(eventPublisher.publish).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'SubscriptionSuspended',
      entityId: 'sub1',
      tenantId: 't1',
      payload: expect.objectContaining({
        subscriptionId: 'sub1',
        previousStatus: SubscriptionStatus.ACTIVE,
        currentStatus: SubscriptionStatus.SUSPENDED,
      }),
    }));
  });

  it('should publish SubscriptionCancelled event on cancellation', async () => {
    const existing = { id: 'sub1', tenantId: 't1', planVersionId: 'pv1', status: SubscriptionStatus.ACTIVE };
    prismaService.subscription.findUnique.mockResolvedValue(existing);
    prismaService.subscription.update.mockResolvedValue({ ...existing, status: SubscriptionStatus.CANCELLED });
    prismaService.planVersion.findUnique.mockResolvedValue({
      id: 'pv1',
      plan: { id: 'p1', planKey: 'enterprise' },
    });

    await service.cancelSubscription('u1', 'sub1', 'User cancelled');

    expect(eventPublisher.publish).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'SubscriptionCancelled',
      entityId: 'sub1',
      tenantId: 't1',
      payload: expect.objectContaining({
        subscriptionId: 'sub1',
        previousStatus: SubscriptionStatus.ACTIVE,
        currentStatus: SubscriptionStatus.CANCELLED,
      }),
    }));
  });

  it('should publish SubscriptionExpired event on expiration', async () => {
    const existing = { id: 'sub1', tenantId: 't1', planVersionId: 'pv1', status: SubscriptionStatus.ACTIVE };
    prismaService.subscription.findUnique.mockResolvedValue(existing);
    prismaService.subscription.update.mockResolvedValue({ ...existing, status: SubscriptionStatus.EXPIRED });
    prismaService.planVersion.findUnique.mockResolvedValue({
      id: 'pv1',
      plan: { id: 'p1', planKey: 'enterprise' },
    });

    await service.expireSubscription('u1', 'sub1', 'Trial expired');

    expect(eventPublisher.publish).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'SubscriptionExpired',
      entityId: 'sub1',
      tenantId: 't1',
      payload: expect.objectContaining({
        subscriptionId: 'sub1',
        previousStatus: SubscriptionStatus.ACTIVE,
        currentStatus: SubscriptionStatus.EXPIRED,
      }),
    }));
  });

  it('should publish SubscriptionPlanChanged event on plan change', async () => {
    const existing = { id: 'sub1', tenantId: 't1', planVersionId: 'pv1', status: SubscriptionStatus.ACTIVE };
    prismaService.subscription.findUnique.mockResolvedValue(existing);
    prismaService.subscription.update.mockResolvedValue({ ...existing, planVersionId: 'pv2' });
    prismaService.planVersion.findUnique.mockImplementation(async (args) => {
      if (args.where.id === 'pv1') return { id: 'pv1', plan: { id: 'p1', planKey: 'starter' } };
      if (args.where.id === 'pv2') return { id: 'pv2', plan: { id: 'p2', planKey: 'enterprise' } };
      return null;
    });

    await service.changeSubscriptionPlan('u1', 'sub1', 'pv2', 'Upgrade');

    expect(eventPublisher.publish).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'SubscriptionPlanChanged',
      entityId: 'sub1',
      tenantId: 't1',
      payload: expect.objectContaining({
        subscriptionId: 'sub1',
        planVersionId: 'pv2',
        previousPlanVersionId: 'pv1',
      }),
    }));
  });

  it('should publish SubscriptionRenewed event on renewal', async () => {
    const existing = { id: 'sub1', tenantId: 't1', planVersionId: 'pv1', status: SubscriptionStatus.ACTIVE, currentPeriodStart: new Date(), currentPeriodEnd: new Date() };
    prismaService.subscription.findUnique.mockResolvedValue(existing);
    prismaService.subscription.update.mockResolvedValue({ ...existing, currentPeriodStart: new Date(), currentPeriodEnd: new Date() });
    prismaService.planVersion.findUnique.mockResolvedValue({
      id: 'pv1',
      plan: { id: 'p1', planKey: 'enterprise' },
    });

    await service.renewSubscription('u1', 'sub1', new Date(), new Date(), 'Period extended');

    expect(eventPublisher.publish).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'SubscriptionRenewed',
      entityId: 'sub1',
      tenantId: 't1',
      payload: expect.objectContaining({
        subscriptionId: 'sub1',
        currentStatus: SubscriptionStatus.ACTIVE,
      }),
    }));
  });
});
