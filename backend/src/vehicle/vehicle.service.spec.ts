// backend/src/vehicle/vehicle.service.spec.ts
/**
 * Comprehensive tests for VehicleService.create() focusing on the MAX_VEHICLES
 * limit enforcement, transaction handling, duplicate registration, and event
 * publishing. The tests use the real method signatures and error contracts as
 * defined in the production code. No production logic is altered.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { VehicleService } from './vehicle.service';
import { PrismaService } from '../prisma/prisma.service';
import { LimitEnforcementService } from '../usage/limit-enforcement.service';
import { EventPublisherService } from '../events/event-publisher.service';
import { ApprovalWorkflowService } from '../workflow/approval-workflow.service';
import { DataScopeService } from '../auth/data-scope.service';

// Minimal DTO shape required for creation
const createDto = {
  registrationNumber: 'TEST-REG-001',
  fleetNumber: 'FLEET-001',
  vehicleClass: 'CLASS-A',
};

describe('VehicleService.create', () => {
  let service: VehicleService;
  let prisma: PrismaService;
  let limitEnforcement: LimitEnforcementService;
  let eventPublisher: EventPublisherService;

  // Helper to create a minimal transaction client
  const defaultTx = {
    vehicle: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'veh-123', ...createDto, tenantId: 'tenant-1', organizationId: 'org-1' }),
    },
  } as any;

  // Reset mocks before each test and provide a default $transaction implementation
  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehicleService,
        { provide: PrismaService, useValue: { $transaction: jest.fn() } },
        { provide: LimitEnforcementService, useValue: { assertWithinLimit: jest.fn() } },
        { provide: EventPublisherService, useValue: { publish: jest.fn() } },
        { provide: ApprovalWorkflowService, useValue: {} },
        { provide: DataScopeService, useValue: {} },
      ],
    }).compile();

    service = module.get<VehicleService>(VehicleService);
    prisma = module.get<PrismaService>(PrismaService);
    limitEnforcement = module.get<LimitEnforcementService>(LimitEnforcementService);
    eventPublisher = module.get<EventPublisherService>(EventPublisherService);

    // Default transaction behavior: invoke the callback with defaultTx
    (prisma.$transaction as jest.Mock).mockImplementation(async (cb: any, _opts: any) => {
      return await cb(defaultTx);
    });
  });

  it('creates vehicle when under limit', async () => {
    (limitEnforcement.assertWithinLimit as jest.Mock).mockResolvedValue(undefined);
    const result = await service.create(createDto, 'user-1', { tenantId: 'tenant-1', organizationId: 'org-1' });
    expect(result).toBeDefined();
    expect(limitEnforcement.assertWithinLimit).toHaveBeenCalledWith('tenant-1', 'MAX_VEHICLES', expect.any(Object));
    expect(eventPublisher.publish).toHaveBeenCalledWith({
      eventType: 'vehicle.created',
      entityId: result.id,
      entityType: 'Vehicle',
      actorId: 'user-1',
      payload: expect.objectContaining({ registrationNumber: createDto.registrationNumber }),
    });
  });

  it('rejects creation when limit is reached (at limit)', async () => {
    const limitError = new ForbiddenException({ code: 'LIMIT_REACHED', message: 'Limit MAX_VEHICLES reached' });
    (limitEnforcement.assertWithinLimit as jest.Mock).mockRejectedValue(limitError);
    await expect(service.create(createDto, 'user-1', { tenantId: 'tenant-1' })).rejects.toThrow(limitError);
    expect(eventPublisher.publish).not.toHaveBeenCalled();
  });

  it('rejects creation when limit is reached (over limit)', async () => {
    const limitError = new ForbiddenException({ code: 'LIMIT_REACHED', message: 'Limit MAX_VEHICLES reached' });
    (limitEnforcement.assertWithinLimit as jest.Mock).mockRejectedValue(limitError);
    await expect(service.create(createDto, 'user-1', { tenantId: 'tenant-1' })).rejects.toThrow(limitError);
    expect(eventPublisher.publish).not.toHaveBeenCalled();
  });

  it('creates vehicle for unlimited (enterprise) tenant', async () => {
    (limitEnforcement.assertWithinLimit as jest.Mock).mockResolvedValue(undefined);
    const result = await service.create(createDto, 'user-1', { tenantId: 'tenant-ent', organizationId: 'org-ent' });
    expect(result).toBeDefined();
    expect(eventPublisher.publish).toHaveBeenCalled();
  });

  it('fails closed when tenant context missing', async () => {
    await expect(service.create(createDto, 'user-1')).rejects.toThrow(ForbiddenException);
    await expect(service.create(createDto, 'user-1')).rejects.toMatchObject({
      response: { code: 'NO_TENANT_CONTEXT' },
    });
    expect(eventPublisher.publish).not.toHaveBeenCalled();
  });

  it('passes correct tenantId and limitCode to LimitEnforcementService', async () => {
    (limitEnforcement.assertWithinLimit as jest.Mock).mockResolvedValue(undefined);
    await service.create(createDto, 'user-1', { tenantId: 'tenant-42', organizationId: 'org-42' });
    expect(limitEnforcement.assertWithinLimit).toHaveBeenCalledWith('tenant-42', 'MAX_VEHICLES', expect.any(Object));
  });

  it('uses the same transaction client for limit check and vehicle creation', async () => {
    let capturedTx: any;
    (limitEnforcement.assertWithinLimit as jest.Mock).mockImplementation(async (_tid, _code, tx) => {
      capturedTx = tx;
    });
    await service.create(createDto, 'user-1', { tenantId: 'tenant-1' });
    expect(capturedTx).toBeDefined();
    expect(capturedTx).toBe(defaultTx);
  });

  it('does not emit event when limit denial occurs', async () => {
    const limitError = new ForbiddenException({ code: 'LIMIT_REACHED', message: 'Limit reached' });
    (limitEnforcement.assertWithinLimit as jest.Mock).mockRejectedValue(limitError);
    await expect(service.create(createDto, 'user-1', { tenantId: 'tenant-1' })).rejects.toThrow(limitError);
    expect(eventPublisher.publish).not.toHaveBeenCalled();
  });

  it('preserves duplicate registration behaviour (throws ConflictException)', async () => {
    (limitEnforcement.assertWithinLimit as jest.Mock).mockResolvedValue(undefined);
    // Override transaction to return an existing vehicle
    (prisma.$transaction as jest.Mock).mockImplementation(async (cb: any, _opts: any) => {
      const tx = {
        vehicle: {
          findFirst: jest.fn().mockResolvedValue({ id: 'veh-existing', registrationNumber: createDto.registrationNumber }),
          create: jest.fn(),
        },
      } as any;
      return await cb(tx);
    });
    await expect(service.create(createDto, 'user-1', { tenantId: 'tenant-1' })).rejects.toThrow(ConflictException);
    expect(eventPublisher.publish).not.toHaveBeenCalled();
  });

  it('retries on P2034 serialization error and succeeds', async () => {
    (limitEnforcement.assertWithinLimit as jest.Mock).mockResolvedValue(undefined);
    const p2034Error = new Prisma.PrismaClientKnownRequestError('serialization failure', { code: 'P2034', clientVersion: '0', meta: {} });
    // First attempt throws P2034, second succeeds
    (prisma.$transaction as jest.Mock)
      .mockImplementationOnce(async () => {
        throw p2034Error;
      })
      .mockImplementationOnce(async (cb: any, _opts: any) => {
        return await cb(defaultTx);
      });
    const result = await service.create(createDto, 'user-1', { tenantId: 'tenant-1' });
    expect(result).toBeDefined();
    expect(limitEnforcement.assertWithinLimit).toHaveBeenCalled();
    expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
  });

  it('fails after three P2034 retries', async () => {
    (limitEnforcement.assertWithinLimit as jest.Mock).mockResolvedValue(undefined);
    const p2034Error = new Prisma.PrismaClientKnownRequestError('serialization failure', { code: 'P2034', clientVersion: '0', meta: {} });
    (prisma.$transaction as jest.Mock)
      .mockImplementationOnce(async () => { throw p2034Error; })
      .mockImplementationOnce(async () => { throw p2034Error; })
      .mockImplementationOnce(async () => { throw p2034Error; });
    await expect(service.create(createDto, 'user-1', { tenantId: 'tenant-1' })).rejects.toThrow(Prisma.PrismaClientKnownRequestError);
    // The limit enforcement may not be called if transaction fails before callback.
    // Ensure that the transaction was attempted three times.
    expect(prisma.$transaction).toHaveBeenCalledTimes(3);
    expect(eventPublisher.publish).not.toHaveBeenCalled();
  });

  it('does not retry on non‑P2034 errors', async () => {
    (limitEnforcement.assertWithinLimit as jest.Mock).mockResolvedValue(undefined);
    const genericError = new Error('some other failure');
    (prisma.$transaction as jest.Mock).mockImplementationOnce(async () => { throw genericError; });
    await expect(service.create(createDto, 'user-1', { tenantId: 'tenant-1' })).rejects.toThrow(genericError);
    // Ensure only one transaction attempt.
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(eventPublisher.publish).not.toHaveBeenCalled();
  });
});
