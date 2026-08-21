import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionService } from './subscription.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EventPublisherService } from '../events/event-publisher.service';
import { SubscriptionStatus } from '@prisma/client';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let prismaService: any;
  let auditService: any;

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

    const mockEventPublisher = {
      publish: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        { provide: PrismaService, useValue: prismaService },
        { provide: AuditService, useValue: auditService },
        { provide: EventPublisherService, useValue: mockEventPublisher },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
    (service as any).eventPublisher = mockEventPublisher;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSubscription', () => {
    it('should create subscription and history', async () => {
      const dto = {
        tenantId: 'tenant-1',
        planVersionId: 'plan-v-1',
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const createdSub = { id: 'sub-1', ...dto };
      prismaService.subscription.create.mockResolvedValue(createdSub);
      prismaService.subscriptionStatusHistory.create.mockResolvedValue({});
      prismaService.planVersion.findUnique.mockResolvedValue({
        id: 'plan-v-1',
        plan: { id: 'plan-1', planKey: 'plan-key' },
      });

      const result = await service.createSubscription('user-1', dto);

      expect(result.id).toBe('sub-1');
      expect(prismaService.subscription.create).toHaveBeenCalled();
      expect(prismaService.subscriptionStatusHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          subscriptionId: 'sub-1',
          oldStatus: SubscriptionStatus.ACTIVE,
          newStatus: SubscriptionStatus.ACTIVE,
        }),
      });
      expect(auditService.logAction).toHaveBeenCalledWith(expect.objectContaining({
        action: 'SUBSCRIPTION_CREATED',
      }), expect.anything());
    });
  });

  describe('changeSubscriptionStatus', () => {
    it('should update status and log history', async () => {
      const existingSub = { id: 'sub-1', status: SubscriptionStatus.ACTIVE, planVersionId: 'plan-v-1', tenantId: 'tenant-1' };
      prismaService.subscription.findUnique.mockResolvedValue(existingSub);
      prismaService.subscription.update.mockResolvedValue({ ...existingSub, status: SubscriptionStatus.SUSPENDED });
      prismaService.subscriptionStatusHistory.create.mockResolvedValue({});
      prismaService.planVersion.findUnique.mockResolvedValue({
        id: 'plan-v-1',
        plan: { id: 'plan-1', planKey: 'plan-key' },
      });

      const result = await service.changeSubscriptionStatus('user-1', 'sub-1', {
        status: SubscriptionStatus.SUSPENDED,
        reason: 'Payment failed',
      });

      expect(result.status).toBe(SubscriptionStatus.SUSPENDED);
      expect(prismaService.subscriptionStatusHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          subscriptionId: 'sub-1',
          oldStatus: SubscriptionStatus.ACTIVE,
          newStatus: SubscriptionStatus.SUSPENDED,
        }),
      });
      expect(auditService.logAction).toHaveBeenCalledWith(expect.objectContaining({
        action: 'SUBSCRIPTION_SUSPENDED',
      }), expect.anything());
    });
  });
});
