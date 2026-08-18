import { Test, TestingModule } from '@nestjs/testing';
import { TyreService } from './tyre.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { TyreStatus, TyreType, TyreMovementType, TyreCondition } from '@prisma/client';

const mockPrismaService = {
  tyre: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  vehicle: {
    findFirst: jest.fn().mockResolvedValue({ id: 'V1', registrationNumber: 'KDA123A', expectedTyres: 10 }),
    findUnique: jest.fn().mockResolvedValue({ id: 'V1', registrationNumber: 'KDA123A', expectedTyres: 10 }),
  },
  tyreMovement: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  tyreFitment: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn().mockResolvedValue(null),
    update: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
  },
  tyreInspection: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

import { KpiGovernanceService } from '../kpi/kpi-governance.service';
import { EventPublisherService } from '../events/event-publisher.service';
import { ApprovalWorkflowService } from '../workflow/approval-workflow.service';

const mockKpiGovernance = {
  calculateKPI: jest.fn(),
  evaluateKPIStatus: jest.fn(),
};
const mockEventPublisher = {
  publish: jest.fn(),
};
const mockWorkflowService = {
  validateSegregationOfDuties: jest.fn(),
};

describe('TyreService', () => {
  let service: TyreService;
  let prisma: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TyreService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: KpiGovernanceService, useValue: mockKpiGovernance },
        { provide: EventPublisherService, useValue: mockEventPublisher },
        { provide: ApprovalWorkflowService, useValue: mockWorkflowService },
      ],
    }).compile();

    service = module.get<TyreService>(TyreService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw ConflictException if tyreIdentifier exists', async () => {
      prisma.tyre.findUnique.mockResolvedValue({ id: 1 });
      const dto = { tyreIdentifier: 'TYR-01', brand: 'Test', model: 'Model A', size: '205/55R16' };
      
      await expect(service.create(dto as any)).rejects.toThrow(ConflictException);
    });

    it('should create tyre and movement record', async () => {
      prisma.tyre.findUnique.mockResolvedValue(null);
      prisma.tyre.create.mockResolvedValue({ id: 1, tyreIdentifier: 'TYR-01' });
      prisma.tyreMovement.create.mockResolvedValue({});
      
      const dto = { tyreIdentifier: 'TYR-01', brand: 'Test', model: 'Model A', size: '205/55R16' };
      const result = await service.create(dto as any, 'user-1');
      
      expect(result).toBeDefined();
      expect(prisma.tyre.create).toHaveBeenCalled();
      expect(prisma.tyreMovement.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ movementType: TyreMovementType.REGISTRATION })
      }));
    });
  });

  describe('fitTyre', () => {
    it('should throw BadRequestException if already fitted', async () => {
      // Mock findOne implementation
      jest.spyOn(service, 'findOne').mockResolvedValue({ id: 1, currentStatus: TyreStatus.FITTED } as any);
      
      await expect(service.fitTyre({ tyreId: 1, vehicleId: 'V1', positionId: 1, fitmentDate: new Date().toISOString() })).rejects.toThrow(BadRequestException);
    });

    it('should fit tyre successfully', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ id: 1, currentStatus: TyreStatus.IN_STOCK } as any);
      prisma.tyreFitment.create.mockResolvedValue({ id: 10 });
      prisma.tyre.update.mockResolvedValue({});
      prisma.tyreMovement.create.mockResolvedValue({});

      await service.fitTyre({ tyreId: 1, vehicleId: 'V1', positionId: 1, fitmentDate: new Date().toISOString() });
      
      expect(prisma.tyreFitment.create).toHaveBeenCalled();
      expect(prisma.tyre.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ currentStatus: TyreStatus.FITTED })
      }));
      expect(prisma.tyreMovement.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ movementType: TyreMovementType.FITMENT })
      }));
    });
  });
});
