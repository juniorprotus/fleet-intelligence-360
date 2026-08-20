import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionResolverService } from './subscription-resolver.service';
import { SubscriptionService } from './subscription.service';
import { SubscriptionStatus } from '@prisma/client';

describe('SubscriptionResolverService', () => {
  let resolver: SubscriptionResolverService;
  let subscriptionService: any;

  beforeEach(async () => {
    subscriptionService = {
      getCurrentSubscription: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionResolverService,
        { provide: SubscriptionService, useValue: subscriptionService },
      ],
    }).compile();

    resolver = module.get<SubscriptionResolverService>(SubscriptionResolverService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  const generateSub = (status: SubscriptionStatus, withinPeriod: boolean) => ({
    status,
    planVersionId: 'plan-v-1',
    currentPeriodStart: new Date(Date.now() - (withinPeriod ? 10 : -10) * 24 * 60 * 60 * 1000),
    currentPeriodEnd: new Date(Date.now() + (withinPeriod ? 10 : -10) * 24 * 60 * 60 * 1000),
  });

  describe('resolvePlanVersion', () => {
    it('returns NO_SUBSCRIPTION if tenant has no sub', async () => {
      subscriptionService.getCurrentSubscription.mockResolvedValue(null);
      const res = await resolver.resolvePlanVersion('t1');
      expect(res.status).toBe('NO_SUBSCRIPTION');
    });

    it('returns VALID for ACTIVE subscription within period', async () => {
      subscriptionService.getCurrentSubscription.mockResolvedValue(generateSub(SubscriptionStatus.ACTIVE, true));
      const res = await resolver.resolvePlanVersion('t1');
      expect(res.status).toBe('VALID');
      expect(res.planVersionId).toBe('plan-v-1');
    });

    it('returns EXPIRED for ACTIVE subscription outside period', async () => {
      subscriptionService.getCurrentSubscription.mockResolvedValue(generateSub(SubscriptionStatus.ACTIVE, false));
      const res = await resolver.resolvePlanVersion('t1');
      expect(res.status).toBe('EXPIRED');
    });

    it('returns VALID for CANCELLED subscription within period', async () => {
      subscriptionService.getCurrentSubscription.mockResolvedValue(generateSub(SubscriptionStatus.CANCELLED, true));
      const res = await resolver.resolvePlanVersion('t1');
      expect(res.status).toBe('VALID');
    });

    it('returns EXPIRED for CANCELLED subscription outside period', async () => {
      subscriptionService.getCurrentSubscription.mockResolvedValue(generateSub(SubscriptionStatus.CANCELLED, false));
      const res = await resolver.resolvePlanVersion('t1');
      expect(res.status).toBe('EXPIRED');
    });

    it('returns SUSPENDED for SUSPENDED subscription', async () => {
      subscriptionService.getCurrentSubscription.mockResolvedValue(generateSub(SubscriptionStatus.SUSPENDED, true));
      const res = await resolver.resolvePlanVersion('t1');
      expect(res.status).toBe('SUSPENDED');
    });
  });
});
