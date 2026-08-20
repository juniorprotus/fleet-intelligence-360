import { Test, TestingModule } from '@nestjs/testing';
import { LimitEnforcementService } from './limit-enforcement.service';
import { PrismaService } from '../prisma/prisma.service';
import { CoreEntitlementResolver } from '../entitlement/core-entitlement.resolver';
import { UsageService } from './usage.service';
import { AuditService } from '../audit/audit.service';
import { ForbiddenException } from '@nestjs/common';

describe('LimitEnforcementService', () => {
  let service: LimitEnforcementService;
  let usageService: UsageService;
  let prisma: PrismaService;
  let resolver: CoreEntitlementResolver;
  let audit: AuditService;

  const mockPrismaService = {
    planVersionLimit: {
      findFirst: jest.fn(),
    },
  };

  const mockResolver = {
    resolvePlanVersion: jest.fn(),
  };

  const mockUsageService = {
    getVehicleUsage: jest.fn(),
  };

  const mockAuditService = {
    logAction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LimitEnforcementService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CoreEntitlementResolver, useValue: mockResolver },
        { provide: UsageService, useValue: mockUsageService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<LimitEnforcementService>(LimitEnforcementService);
    prisma = module.get<PrismaService>(PrismaService);
    resolver = module.get<CoreEntitlementResolver>(CoreEntitlementResolver);
    usageService = module.get<UsageService>(UsageService);
    audit = module.get<AuditService>(AuditService);

    jest.clearAllMocks();
  });

  it('should throw LIMIT_NOT_CONFIGURED if no entitlement context', async () => {
    mockResolver.resolvePlanVersion.mockResolvedValue(null);
    await expect(service.assertWithinLimit('tenant1', 'MAX_VEHICLES'))
      .rejects.toThrow(new ForbiddenException({ code: 'LIMIT_NOT_CONFIGURED', message: 'No entitlement context' }));
    expect(audit.logAction).toHaveBeenCalled();
  });

  it('should throw LIMIT_NOT_CONFIGURED if no limit config', async () => {
    mockResolver.resolvePlanVersion.mockResolvedValue('plan1');
    mockPrismaService.planVersionLimit.findFirst.mockResolvedValue(null);
    await expect(service.assertWithinLimit('tenant1', 'MAX_VEHICLES'))
      .rejects.toThrow(new ForbiddenException({ code: 'LIMIT_NOT_CONFIGURED', message: 'Limit not configured' }));
  });

  it('should allow if limit is unlimited', async () => {
    mockResolver.resolvePlanVersion.mockResolvedValue('plan1');
    mockPrismaService.planVersionLimit.findFirst.mockResolvedValue({ isUnlimited: true });
    await expect(service.assertWithinLimit('tenant1', 'MAX_VEHICLES')).resolves.toBeUndefined();
    expect(audit.logAction).not.toHaveBeenCalled();
  });

  it('should throw LIMIT_REACHED if current usage >= configured limit', async () => {
    mockResolver.resolvePlanVersion.mockResolvedValue('plan1');
    mockPrismaService.planVersionLimit.findFirst.mockResolvedValue({ isUnlimited: false, limitValue: 10 });
    mockUsageService.getVehicleUsage.mockResolvedValue({ currentUsage: 10 });
    
    await expect(service.assertWithinLimit('tenant1', 'MAX_VEHICLES'))
      .rejects.toThrow(new ForbiddenException({ code: 'LIMIT_REACHED', message: 'Limit MAX_VEHICLES reached' }));
    expect(audit.logAction).toHaveBeenCalledWith(expect.objectContaining({
      module: 'limit-enforcement',
      action: 'denied',
      entityType: 'MAX_VEHICLES',
      entityId: 'tenant1'
    }));
  });

  it('should allow if current usage < configured limit', async () => {
    mockResolver.resolvePlanVersion.mockResolvedValue('plan1');
    mockPrismaService.planVersionLimit.findFirst.mockResolvedValue({ isUnlimited: false, limitValue: 10 });
    mockUsageService.getVehicleUsage.mockResolvedValue({ currentUsage: 9 });
    
    await expect(service.assertWithinLimit('tenant1', 'MAX_VEHICLES')).resolves.toBeUndefined();
    expect(audit.logAction).not.toHaveBeenCalled();
  });
});
