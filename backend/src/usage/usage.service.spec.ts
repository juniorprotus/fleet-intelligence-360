import { Test, TestingModule } from '@nestjs/testing';
import { UsageService } from './usage.service';
import { PrismaService } from '../prisma/prisma.service';
import { CoreEntitlementResolver } from '../entitlement/core-entitlement.resolver';

describe('UsageService', () => {
  let service: UsageService;
  let prisma: PrismaService;
  let resolver: CoreEntitlementResolver;

  const mockPrismaService = {
    vehicle: {
      count: jest.fn(),
    },
    integrationConnection: {
      count: jest.fn(),
    },
    planVersionLimit: {
      findFirst: jest.fn(),
    },
  };

  const mockResolver = {
    resolveCommercialContext: jest.fn(),
    resolvePlanVersion: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsageService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CoreEntitlementResolver, useValue: mockResolver },
      ],
    }).compile();

    service = module.get<UsageService>(UsageService);
    prisma = module.get<PrismaService>(PrismaService);
    resolver = module.get<CoreEntitlementResolver>(CoreEntitlementResolver);

    jest.clearAllMocks();
  });

  it('should return NOT_CONFIGURED when tenant context/plan version cannot be resolved', async () => {
    mockResolver.resolveCommercialContext.mockResolvedValue({ status: 'NOT_CONFIGURED', code: 'NO_ENTITLEMENT_CONTEXT', reason: 'NO_ENTITLEMENT_CONTEXT' });

    const vehicleUsage = await service.getVehicleUsage('UNKNOWN_TENANT');
    expect(vehicleUsage.status).toBe('NOT_CONFIGURED');
    expect(vehicleUsage.reason).toBe('NO_ENTITLEMENT_CONTEXT');
    expect(vehicleUsage.currentUsage).toBe(0);
    expect(vehicleUsage.remaining).toBeNull();
  });

  it('should return NOT_CONFIGURED for workshop count and user count due to lack of tenant linkage', async () => {
    const workshopUsage = await service.getWorkshopUsage('TEST_TENANT_STARTER');
    expect(workshopUsage.status).toBe('NOT_CONFIGURED');
    expect(workshopUsage.dataQuality).toBe('INSUFFICIENT_DATA');
    expect(workshopUsage.reason).toContain('preventing tenant-scoped measurement');

    const userUsage = await service.getUserUsage('TEST_TENANT_STARTER');
    expect(userUsage.status).toBe('NOT_CONFIGURED');
    expect(userUsage.dataQuality).toBe('INSUFFICIENT_DATA');
    expect(userUsage.reason).toContain('preventing tenant-scoped measurement');
  });

  it('should calculate finite limit correctly (OK status)', async () => {
    mockResolver.resolveCommercialContext.mockResolvedValue({ status: 'VALID', planVersionId: 'starter-version-id' });
    mockPrismaService.vehicle.count.mockResolvedValue(4);
    mockPrismaService.planVersionLimit.findFirst.mockResolvedValue({
      isUnlimited: false,
      limitValue: 10,
    });

    const res = await service.getVehicleUsage('TEST_TENANT_STARTER');
    expect(res.currentUsage).toBe(4);
    expect(res.configuredLimit).toBe(10);
    expect(res.isUnlimited).toBe(false);
    expect(res.remaining).toBe(6);
    expect(res.status).toBe('OK');
  });

  it('should handle AT_LIMIT status correctly', async () => {
    mockResolver.resolveCommercialContext.mockResolvedValue({ status: 'VALID', planVersionId: 'starter-version-id' });
    mockPrismaService.vehicle.count.mockResolvedValue(10);
    mockPrismaService.planVersionLimit.findFirst.mockResolvedValue({
      isUnlimited: false,
      limitValue: 10,
    });

    const res = await service.getVehicleUsage('TEST_TENANT_STARTER');
    expect(res.currentUsage).toBe(10);
    expect(res.remaining).toBe(0);
    expect(res.status).toBe('AT_LIMIT');
  });

  it('should handle OVER_LIMIT status correctly', async () => {
    mockResolver.resolveCommercialContext.mockResolvedValue({ status: 'VALID', planVersionId: 'starter-version-id' });
    mockPrismaService.vehicle.count.mockResolvedValue(12);
    mockPrismaService.planVersionLimit.findFirst.mockResolvedValue({
      isUnlimited: false,
      limitValue: 10,
    });

    const res = await service.getVehicleUsage('TEST_TENANT_STARTER');
    expect(res.currentUsage).toBe(12);
    expect(res.remaining).toBe(0);
    expect(res.status).toBe('OVER_LIMIT');
  });

  it('should handle UNLIMITED status correctly', async () => {
    mockResolver.resolveCommercialContext.mockResolvedValue({ status: 'VALID', planVersionId: 'enterprise-version-id' });
    mockPrismaService.vehicle.count.mockResolvedValue(45);
    mockPrismaService.planVersionLimit.findFirst.mockResolvedValue({
      isUnlimited: true,
      limitValue: null,
    });

    const res = await service.getVehicleUsage('TEST_TENANT_ENTERPRISE');
    expect(res.currentUsage).toBe(45);
    expect(res.isUnlimited).toBe(true);
    expect(res.configuredLimit).toBeNull();
    expect(res.remaining).toBeNull();
    expect(res.status).toBe('UNLIMITED');
  });

  it('should handle integration count filter status predicate correctly', async () => {
    mockResolver.resolveCommercialContext.mockResolvedValue({ status: 'VALID', planVersionId: 'pro-version-id' });
    mockPrismaService.integrationConnection.count.mockResolvedValue(2);
    mockPrismaService.planVersionLimit.findFirst.mockResolvedValue({
      isUnlimited: false,
      limitValue: 5,
    });

    const res = await service.getIntegrationUsage('TEST_TENANT_PROFESSIONAL');
    expect(res.currentUsage).toBe(2);
    expect(res.configuredLimit).toBe(5);
    expect(res.status).toBe('OK');
    expect(prisma.integrationConnection.count).toHaveBeenCalledWith({
      where: {
        tenantId: 'TEST_TENANT_PROFESSIONAL',
        status: {
          notIn: ['DISCONNECTED', 'NOT_CONNECTED'],
        },
      },
    });
  });
});
