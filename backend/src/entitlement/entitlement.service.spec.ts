import { Test, TestingModule } from '@nestjs/testing';
import { EntitlementService } from './entitlement.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { FeatureStatus, UserRole } from '@prisma/client';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('EntitlementService', () => {
  let service: EntitlementService;
  let prisma: PrismaService;
  let audit: AuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntitlementService,
        {
          provide: PrismaService,
          useValue: {
            featureDefinition: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn(),
            },
            planVersion: {
              findUnique: jest.fn(),
            },
            planEntitlement: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: AuditService,
          useValue: {
            logAction: jest.fn().mockResolvedValue(null),
          },
        },
      ],
    }).compile();

    service = module.get<EntitlementService>(EntitlementService);
    prisma = module.get<PrismaService>(PrismaService);
    audit = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createFeature', () => {
    it('should successfully create a new feature definition', async () => {
      const dto = {
        featureCode: 'TEST_FEATURE',
        name: 'Test Feature',
        description: 'Test description',
        category: 'TEST',
        status: FeatureStatus.ACTIVE,
        displayOrder: 1,
      };

      jest.spyOn(prisma.featureDefinition, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.featureDefinition, 'create').mockResolvedValue({ id: 'feature-123', ...dto } as any);

      const result = await service.createFeature(dto, 'admin@fi360.com');

      expect(result.id).toBe('feature-123');
      expect(audit.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          module: 'ENTITLEMENT',
          action: 'FEATURE_CREATE',
          entityType: 'FeatureDefinition',
          entityId: 'feature-123',
          userEmail: 'admin@fi360.com',
        })
      );
    });

    it('should throw ConflictException on duplicate featureCode', async () => {
      const dto = {
        featureCode: 'DUPLICATE',
        name: 'Duplicate Feature',
      };

      jest.spyOn(prisma.featureDefinition, 'findUnique').mockResolvedValue({ id: '1' } as any);

      await expect(service.createFeature(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('createPlanEntitlement', () => {
    it('should successfully create a plan version entitlement mapping', async () => {
      const dto = {
        planVersionId: 'version-1',
        featureId: 'feature-1',
        enabled: true,
      };

      jest.spyOn(prisma.planVersion, 'findUnique').mockResolvedValue({ id: 'version-1' } as any);
      jest.spyOn(prisma.featureDefinition, 'findUnique').mockResolvedValue({ id: 'feature-1' } as any);
      jest.spyOn(prisma.planEntitlement, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.planEntitlement, 'create').mockResolvedValue({ id: 'ent-1', ...dto } as any);

      const result = await service.createPlanEntitlement(dto, 'admin@fi360.com');

      expect(result.id).toBe('ent-1');
      expect(audit.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          module: 'ENTITLEMENT',
          action: 'PLAN_ENTITLEMENT_CREATE',
          entityType: 'PlanEntitlement',
          entityId: 'ent-1',
          userEmail: 'admin@fi360.com',
        })
      );
    });

    it('should throw ConflictException on duplicate entitlement mapping', async () => {
      const dto = {
        planVersionId: 'version-1',
        featureId: 'feature-1',
      };

      jest.spyOn(prisma.planVersion, 'findUnique').mockResolvedValue({ id: 'version-1' } as any);
      jest.spyOn(prisma.featureDefinition, 'findUnique').mockResolvedValue({ id: 'feature-1' } as any);
      jest.spyOn(prisma.planEntitlement, 'findUnique').mockResolvedValue({ id: 'ent-1' } as any);

      await expect(service.createPlanEntitlement(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('isFeatureEnabled', () => {
    it('should return allowed: true if the feature exists, is active, plan exists, and entitlement is enabled', async () => {
      jest.spyOn(prisma.featureDefinition, 'findUnique').mockResolvedValue({ id: 'feat-1', featureCode: 'F1', status: FeatureStatus.ACTIVE } as any);
      jest.spyOn(prisma.planVersion, 'findUnique').mockResolvedValue({ id: 'ver-1' } as any);
      jest.spyOn(prisma.planEntitlement, 'findUnique').mockResolvedValue({ id: 'ent-1', enabled: true } as any);

      const decision = await service.isFeatureEnabled('ver-1', 'F1');
      expect(decision).toEqual({
        allowed: true,
        featureCode: 'F1',
        reason: 'ENABLED',
      });
    });

    it('should return allowed: false with FEATURE_NOT_FOUND when feature does not exist', async () => {
      jest.spyOn(prisma.featureDefinition, 'findUnique').mockResolvedValue(null);

      const decision = await service.isFeatureEnabled('ver-1', 'MISSING');
      expect(decision).toEqual({
        allowed: false,
        featureCode: 'MISSING',
        reason: 'FEATURE_NOT_FOUND',
      });
    });

    it('should return allowed: false with DISABLED when feature is inactive', async () => {
      jest.spyOn(prisma.featureDefinition, 'findUnique').mockResolvedValue({ id: 'feat-1', featureCode: 'F1', status: FeatureStatus.INACTIVE } as any);

      const decision = await service.isFeatureEnabled('ver-1', 'F1');
      expect(decision).toEqual({
        allowed: false,
        featureCode: 'F1',
        reason: 'DISABLED',
      });
    });
  });
});
