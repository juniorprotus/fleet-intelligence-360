import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionService } from './subscription.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EventPublisherService } from '../events/event-publisher.service';
import { SubscriptionStatus } from '@prisma/client';

describe('SubscriptionAudit', () => {
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
      logAction: jest.fn().mockResolvedValue({}),
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

  it('should write audit log on subscription creation', async () => {
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

    await service.createSubscription('u1', dto);

    expect(auditService.logAction).toHaveBeenCalledWith(expect.objectContaining({
      module: 'COMMERCIAL',
      action: 'SUBSCRIPTION_CREATED',
      entityType: 'Subscription',
      entityId: 'sub1',
      userId: 'u1',
    }), expect.anything());
  });

  it('should write audit log and use transaction client for status changes', async () => {
    const existing = { id: 'sub1', tenantId: 't1', planVersionId: 'pv1', status: SubscriptionStatus.ACTIVE };
    prismaService.subscription.findUnique.mockResolvedValue(existing);
    prismaService.subscription.update.mockResolvedValue({ ...existing, status: SubscriptionStatus.CANCELLED });
    prismaService.planVersion.findUnique.mockResolvedValue({
      id: 'pv1',
      plan: { id: 'p1', planKey: 'enterprise' },
    });

    await service.cancelSubscription('u1', 'sub1', 'User request');

    // Verify logAction was called with tx (the transaction client) as the second argument
    expect(auditService.logAction).toHaveBeenCalledWith(expect.objectContaining({
      module: 'COMMERCIAL',
      action: 'SUBSCRIPTION_CANCELLED',
      entityType: 'Subscription',
      entityId: 'sub1',
      userId: 'u1',
    }), prismaService); // prismaService is the transaction client returned by $transaction mock
  });

  it('should not contain secrets or JWTs in the audit log values', async () => {
    const existing = { id: 'sub1', tenantId: 't1', planVersionId: 'pv1', status: SubscriptionStatus.ACTIVE };
    prismaService.subscription.findUnique.mockResolvedValue(existing);
    prismaService.subscription.update.mockResolvedValue({ ...existing, status: SubscriptionStatus.SUSPENDED });
    prismaService.planVersion.findUnique.mockResolvedValue({
      id: 'pv1',
      plan: { id: 'p1', planKey: 'enterprise' },
    });

    await service.suspendSubscription('u1', 'sub1', 'secret-key-password-jwt-here');

    const lastCall = auditService.logAction.mock.calls[auditService.logAction.mock.calls.length - 1][0];
    const logStr = JSON.stringify(lastCall);
    expect(logStr).not.toContain('jwt');
    expect(logStr).not.toContain('password');
    expect(logStr).not.toContain('secret-key-password-jwt-here');
  });
});
