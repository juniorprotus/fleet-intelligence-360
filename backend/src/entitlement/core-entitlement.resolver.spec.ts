import { Test, TestingModule } from '@nestjs/testing';
import { CoreEntitlementResolver } from './core-entitlement.resolver';
import { DevelopmentEntitlementContextResolver } from './development-entitlement-resolver';
import { SubscriptionResolverService } from '../subscription/subscription-resolver.service';
import { ForbiddenException } from '@nestjs/common';

describe('CoreEntitlementResolver', () => {
  let resolver: CoreEntitlementResolver;
  let devResolver: any;
  let prodResolver: any;

  beforeEach(async () => {
    devResolver = {
      resolvePlanVersion: jest.fn(),
    };

    prodResolver = {
      resolvePlanVersion: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoreEntitlementResolver,
        { provide: DevelopmentEntitlementContextResolver, useValue: devResolver },
        { provide: SubscriptionResolverService, useValue: prodResolver },
      ],
    }).compile();

    resolver = module.get<CoreEntitlementResolver>(CoreEntitlementResolver);
  });

  afterEach(() => {
    delete process.env.TEST_MODE;
    delete process.env.NODE_ENV;
  });

  it('should use DevelopmentEntitlementContextResolver when TEST_MODE=true', async () => {
    process.env.TEST_MODE = 'true';
    devResolver.resolvePlanVersion.mockResolvedValue('test-plan-version');
    const res = await resolver.resolvePlanVersion('t1');
    expect(res).toBe('test-plan-version');
    expect(devResolver.resolvePlanVersion).toHaveBeenCalledWith('t1');
  });

  it('should use SubscriptionResolverService in production mode when TEST_MODE is not true', async () => {
    prodResolver.resolvePlanVersion.mockResolvedValue({
      status: 'VALID',
      planVersionId: 'prod-plan-version',
    });
    const res = await resolver.resolvePlanVersion('t1');
    expect(res).toBe('prod-plan-version');
    expect(prodResolver.resolvePlanVersion).toHaveBeenCalledWith('t1');
  });

  it('should throw ForbiddenException NO_ENTITLEMENT_CONTEXT if tenantId is missing', async () => {
    await expect(resolver.resolvePlanVersion(undefined)).rejects.toThrow(ForbiddenException);
    try {
      await resolver.resolvePlanVersion(undefined);
    } catch (error) {
      expect(error.getResponse().code).toBe('NO_ENTITLEMENT_CONTEXT');
    }
  });

  it('should throw ForbiddenException SUSPENDED if subscription is suspended', async () => {
    prodResolver.resolvePlanVersion.mockResolvedValue({
      status: 'SUSPENDED',
      reason: 'Subscription is suspended',
    });
    await expect(resolver.resolvePlanVersion('t1')).rejects.toThrow(ForbiddenException);
    try {
      await resolver.resolvePlanVersion('t1');
    } catch (error) {
      expect(error.getResponse().code).toBe('SUSPENDED');
      expect(error.getResponse().message).toBe('Your subscription is suspended.');
    }
  });

  it('should throw ForbiddenException EXPIRED if subscription is expired', async () => {
    prodResolver.resolvePlanVersion.mockResolvedValue({
      status: 'EXPIRED',
      reason: 'Subscription period has ended',
    });
    await expect(resolver.resolvePlanVersion('t1')).rejects.toThrow(ForbiddenException);
    try {
      await resolver.resolvePlanVersion('t1');
    } catch (error) {
      expect(error.getResponse().code).toBe('EXPIRED');
      expect(error.getResponse().message).toBe('Your subscription has expired.');
    }
  });

  it('should throw ForbiddenException NO_SUBSCRIPTION if subscription does not exist', async () => {
    prodResolver.resolvePlanVersion.mockResolvedValue({
      status: 'NO_SUBSCRIPTION',
      reason: 'Tenant has no commercial subscription',
    });
    await expect(resolver.resolvePlanVersion('t1')).rejects.toThrow(ForbiddenException);
    try {
      await resolver.resolvePlanVersion('t1');
    } catch (error) {
      expect(error.getResponse().code).toBe('NO_SUBSCRIPTION');
      expect(error.getResponse().message).toBe('Your commercial account is not yet configured.');
    }
  });
});
