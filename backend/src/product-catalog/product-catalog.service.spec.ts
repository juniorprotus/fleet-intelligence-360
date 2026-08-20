import { Test, TestingModule } from '@nestjs/testing';
import { ProductCatalogService } from './product-catalog.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductStatus, PlanStatus, PlanVersionStatus } from '@prisma/client';

describe('ProductCatalogService', () => {
  let service: ProductCatalogService;
  let prisma: PrismaService;
  let audit: AuditService;

  const mockPrismaService = {
    product: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    plan: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    planVersion: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    planPrice: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    planVehiclePricingBand: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockAuditService = {
    logAction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductCatalogService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<ProductCatalogService>(ProductCatalogService);
    prisma = module.get<PrismaService>(PrismaService);
    audit = module.get<AuditService>(AuditService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('product creation', () => {
    it('should create product and trigger audit', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);
      mockPrismaService.product.create.mockResolvedValue({
        id: 'prod-123',
        productKey: 'PROD_1',
        name: 'Test Product',
        status: ProductStatus.DRAFT,
      });

      const res = await service.createProduct({
        productKey: 'PROD_1',
        name: 'Test Product',
      }, 'test@test.com');

      expect(res.id).toBe('prod-123');
      expect(mockPrismaService.product.create).toHaveBeenCalled();
      expect(mockAuditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PRODUCT_CREATE',
          userEmail: 'test@test.com',
        })
      );
    });

    it('should throw conflict if duplicate productKey', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.createProduct({
          productKey: 'PROD_1',
          name: 'Test Product',
        })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('plan creation', () => {
    it('should create plan and trigger audit', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({ id: 'prod-123' });
      mockPrismaService.plan.findUnique.mockResolvedValue(null);
      mockPrismaService.plan.create.mockResolvedValue({
        id: 'plan-123',
        productId: 'prod-123',
        planKey: 'PLAN_STARTER',
        name: 'Starter Plan',
        status: PlanStatus.DRAFT,
      });

      const res = await service.createPlan({
        productId: 'prod-123',
        planKey: 'PLAN_STARTER',
        name: 'Starter Plan',
      }, 'test@test.com');

      expect(res.id).toBe('plan-123');
      expect(mockPrismaService.plan.create).toHaveBeenCalled();
      expect(mockAuditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PLAN_CREATE',
          userEmail: 'test@test.com',
        })
      );
    });

    it('should throw conflict if duplicate planKey for same product', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({ id: 'prod-123' });
      mockPrismaService.plan.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.createPlan({
          productId: 'prod-123',
          planKey: 'PLAN_STARTER',
          name: 'Starter Plan',
        })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('plan version creation and activation', () => {
    it('should create version', async () => {
      mockPrismaService.plan.findUnique.mockResolvedValue({ id: 'plan-123' });
      mockPrismaService.planVersion.findUnique.mockResolvedValue(null);
      mockPrismaService.planVersion.create.mockResolvedValue({
        id: 'ver-1',
        planId: 'plan-123',
        versionNumber: 1,
        effectiveFrom: new Date('2026-01-01'),
        effectiveTo: null,
        status: PlanVersionStatus.DRAFT,
      });

      const res = await service.createPlanVersion({
        planId: 'plan-123',
        versionNumber: 1,
        effectiveFrom: '2026-01-01',
      }, 'test@test.com');

      expect(res.versionNumber).toBe(1);
      expect(mockPrismaService.planVersion.create).toHaveBeenCalled();
    });

    it('should enforce date order effectiveFrom < effectiveTo', async () => {
      mockPrismaService.plan.findUnique.mockResolvedValue({ id: 'plan-123' });
      mockPrismaService.planVersion.findUnique.mockResolvedValue(null);

      await expect(
        service.createPlanVersion({
          planId: 'plan-123',
          versionNumber: 2,
          effectiveFrom: '2026-01-02',
          effectiveTo: '2026-01-01',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should activate plan version when parent is active and no overlap', async () => {
      mockPrismaService.planVersion.findUnique.mockResolvedValue({
        id: 'ver-1',
        planId: 'plan-123',
        effectiveFrom: new Date('2026-01-01'),
        effectiveTo: null,
        plan: {
          status: PlanStatus.ACTIVE,
          product: {
            status: ProductStatus.ACTIVE,
          },
        },
      });
      mockPrismaService.planVersion.findMany.mockResolvedValue([]); // No other active versions
      mockPrismaService.planVersion.update.mockResolvedValue({
        id: 'ver-1',
        status: PlanVersionStatus.ACTIVE,
      });

      const res = await service.activatePlanVersion('ver-1', 'admin@test.com');

      expect(res.status).toBe(PlanVersionStatus.ACTIVE);
      expect(mockAuditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PLAN_VERSION_ACTIVATE',
        })
      );
    });

    it('should reject activation if overlaps with existing active version', async () => {
      mockPrismaService.planVersion.findUnique.mockResolvedValue({
        id: 'ver-1',
        planId: 'plan-123',
        effectiveFrom: new Date('2026-01-01'),
        effectiveTo: new Date('2026-12-31'),
        plan: {
          status: PlanStatus.ACTIVE,
          product: {
            status: ProductStatus.ACTIVE,
          },
        },
      });
      mockPrismaService.planVersion.findMany.mockResolvedValue([
        {
          id: 'ver-old',
          versionNumber: 1,
          effectiveFrom: new Date('2026-06-01'),
          effectiveTo: null,
          status: PlanVersionStatus.ACTIVE,
        },
      ]);

      await expect(service.activatePlanVersion('ver-1')).rejects.toThrow(BadRequestException);
    });

    it('should supersede plan version', async () => {
      mockPrismaService.planVersion.findUnique.mockResolvedValue({ id: 'ver-1' });
      mockPrismaService.planVersion.update.mockResolvedValue({
        id: 'ver-1',
        status: PlanVersionStatus.SUPERSEDED,
      });

      const res = await service.supersedePlanVersion('ver-1', 'admin@test.com');
      expect(res.status).toBe(PlanVersionStatus.SUPERSEDED);
      expect(mockAuditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PLAN_VERSION_SUPERSEDE',
        })
      );
    });
  });

  describe('price validation', () => {
    it('should reject negative amounts', async () => {
      mockPrismaService.planVersion.findUnique.mockResolvedValue({ id: 'ver-1' });

      await expect(
        service.createPlanPrice('ver-1', {
          currency: 'KES',
          billingInterval: 'MONTHLY',
          amount: -50,
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('band validation', () => {
    it('should reject negative minVehicles or maxVehicles < minVehicles', async () => {
      mockPrismaService.planVersion.findUnique.mockResolvedValue({ id: 'ver-1' });

      await expect(
        service.createPricingBand('ver-1', {
          minVehicles: -1,
          currency: 'KES',
          billingInterval: 'MONTHLY',
        })
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.createPricingBand('ver-1', {
          minVehicles: 10,
          maxVehicles: 5,
          currency: 'KES',
          billingInterval: 'MONTHLY',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject overlapping pricing bands', async () => {
      mockPrismaService.planVersion.findUnique.mockResolvedValue({ id: 'ver-1' });
      mockPrismaService.planVehiclePricingBand.findMany.mockResolvedValue([
        {
          minVehicles: 1,
          maxVehicles: 100,
          currency: 'KES',
          billingInterval: 'MONTHLY',
        },
      ]);

      await expect(
        service.createPricingBand('ver-1', {
          minVehicles: 50,
          maxVehicles: 200,
          currency: 'KES',
          billingInterval: 'MONTHLY',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });
});
