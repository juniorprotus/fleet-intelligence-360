import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DataScopeService, DataScopeContext } from '../auth/data-scope.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';
import { EventPublisherService } from '../events/event-publisher.service';
import { ApprovalWorkflowService } from '../workflow/approval-workflow.service';

@Injectable()
export class VehicleService {
  private readonly logger = new Logger(VehicleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dataScopeService: DataScopeService,
    private readonly eventPublisher: EventPublisherService,
    private readonly workflowService: ApprovalWorkflowService,
  ) {}

  async create(dto: CreateVehicleDto, userId?: string, tenantContext?: { tenantId: string; organizationId: string }) {
    // Resolve tenant — server-derived context is authoritative
    const tenantId = tenantContext?.tenantId || 'TNT-DEFAULT';
    const organizationId = tenantContext?.organizationId || 'ORG-DEFAULT';

    // Check for duplicate registration within the same tenant
    const existing = await this.prisma.vehicle.findFirst({
      where: { tenantId, registrationNumber: dto.registrationNumber },
    });
    if (existing) {
      throw new ConflictException(`Vehicle ${dto.registrationNumber} already exists in this tenant`);
    }
    const vehicle = await this.prisma.vehicle.create({
      data: {
        ...dto,
        tenantId,
        organizationId,
        acquisitionDate: dto.acquisitionDate ? new Date(dto.acquisitionDate) : undefined,
        createdBy: userId,
        updatedBy: userId,
      },
    });
    await this.eventPublisher.publish({
      eventType: 'vehicle.created',
      entityId: vehicle.id,
      entityType: 'Vehicle',
      actorId: userId,
      payload: {
        vehicleId: vehicle.id,
        registrationNumber: vehicle.registrationNumber,
        fleetNumber: vehicle.fleetNumber,
        vehicleClass: vehicle.vehicleClass,
        workshopId: vehicle.workshopId,
        tenantId: vehicle.tenantId,
        organizationId: vehicle.organizationId,
      },
    });

    this.logger.log(`Vehicle created: ${vehicle.registrationNumber} (${vehicle.id}) tenant=${tenantId}`);
    return vehicle;
  }

  async findAll(filters?: {
    tenantId?: string;
    organizationId?: string;
    region?: string;
    depot?: string;
    vehicleClass?: string;
    status?: string;
  }) {
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        isActive: true,
        ...(filters?.tenantId && { tenantId: filters.tenantId }),
        ...(filters?.organizationId && { organizationId: filters.organizationId }),
        ...(filters?.region && { region: filters.region }),
        ...(filters?.depot && { depot: filters.depot }),
        ...(filters?.vehicleClass && { vehicleClass: filters.vehicleClass }),
        ...(filters?.status && { vehicleStatus: filters.status as any }),
      },
      include: {
        _count: {
          select: {
            tyreFitments: {
              where: { removalDate: null },
            },
          },
        },
      },
      orderBy: { registrationNumber: 'asc' },
    });

    // Populate assignedDriver info by querying active DRIVER users
    const driverUsers = await this.prisma.user.findMany({
      where: {
        role: 'DRIVER',
        assignedVehicleId: { not: null },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        assignedVehicleId: true,
      },
    });

    const driverMap = new Map<string, string>();
    driverUsers.forEach((d) => {
      const name = [d.firstName, d.lastName].filter(Boolean).join(' ') || d.email;
      if (d.assignedVehicleId) {
        driverMap.set(d.assignedVehicleId, name);
      }
    });

    return vehicles.map((v) => ({
      ...v,
      assignedDriver: driverMap.get(v.id) || driverMap.get(v.registrationNumber) || null,
    }));
  }

  async findOne(identifier: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        OR: [
          { id: identifier },
          { registrationNumber: { equals: identifier, mode: 'insensitive' } },
        ],
      },
      include: {
        tyreFitments: {
          include: { tyre: true },
          orderBy: { fitmentDate: 'desc' },
          take: 10,
        },
        tyreInspections: {
          include: { tyre: true },
          orderBy: { inspectionDate: 'desc' },
          take: 10,
        },
        tyreDefects: {
          where: { status: { not: 'CLOSED' } },
          orderBy: { reportedAt: 'desc' },
        },
      },
    });
    if (!vehicle) throw new NotFoundException(`Vehicle "${identifier}" not found by ID or Registration Number`);
    return vehicle;
  }

  async findByRegistration(reg: string) {
    return this.findOne(reg);
  }

  async update(id: string, dto: UpdateVehicleDto, userId?: string) {
    await this.findOne(id);
    return this.prisma.vehicle.update({
      where: { id },
      data: {
        ...dto,
        disposalDate: dto.disposalDate ? new Date(dto.disposalDate) : undefined,
        updatedBy: userId,
      },
    });
  }

  async getVehicleDistributionKPI(scopeCtx: DataScopeContext) {
    const scopeFilter = this.dataScopeService.vehicleWhere(scopeCtx);
    const baseWhere = {
      isActive: true,
      ...scopeFilter,
    };

    const vehicles = await this.prisma.vehicle.findMany({
      where: baseWhere,
      select: {
        id: true,
        registrationNumber: true,
        fleetNumber: true,
        vehicleClass: true,
        make: true,
        model: true,
        region: true,
        depot: true,
        workshopId: true,
        workshop: { select: { id: true, name: true, code: true } },
        vehicleStatus: true,
        isActive: true,
      },
      orderBy: { registrationNumber: 'asc' },
    });

    const driverUsers = await this.prisma.user.findMany({
      where: { role: 'DRIVER', assignedVehicleId: { not: null } },
      select: { id: true, email: true, firstName: true, lastName: true, assignedVehicleId: true },
    });

    const driverMap = new Map<string, string>();
    driverUsers.forEach((d) => {
      const name = [d.firstName, d.lastName].filter(Boolean).join(' ') || d.email;
      if (d.assignedVehicleId) {
        driverMap.set(d.assignedVehicleId, name);
      }
    });

    const totalVehicles = vehicles.length;

    const statusCounts: Record<string, number> = {
      ACTIVE: 0,
      OPERATIONAL: 0,
      MAINTENANCE: 0,
      GROUNDED: 0,
      INACTIVE: 0,
    };

    vehicles.forEach((v) => {
      const st = (v.vehicleStatus || 'ACTIVE').toUpperCase();
      statusCounts[st] = (statusCounts[st] || 0) + 1;
    });

    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: totalVehicles > 0 ? Number(((count / totalVehicles) * 100).toFixed(1)) : 0,
    }));

    const regionCounts: Record<string, { count: number; depots: Record<string, number>; workshops: Record<string, number> }> = {};

    vehicles.forEach((v) => {
      const reg = v.region || 'Unassigned Region';
      const dep = v.depot || 'Unassigned Depot';
      const wsName = v.workshop?.name || (v.workshopId ? `Workshop ${v.workshopId}` : 'Unassigned Workshop');

      if (!regionCounts[reg]) {
        regionCounts[reg] = { count: 0, depots: {}, workshops: {} };
      }
      regionCounts[reg].count += 1;
      regionCounts[reg].depots[dep] = (regionCounts[reg].depots[dep] || 0) + 1;
      regionCounts[reg].workshops[wsName] = (regionCounts[reg].workshops[wsName] || 0) + 1;
    });

    const regionDistribution = Object.entries(regionCounts).map(([region, data]) => ({
      region,
      count: data.count,
      percentage: totalVehicles > 0 ? Number(((data.count / totalVehicles) * 100).toFixed(1)) : 0,
      depots: Object.entries(data.depots).map(([depot, c]) => ({ depot, count: c })),
      workshops: Object.entries(data.workshops).map(([workshop, c]) => ({ workshop, count: c })),
    }));

    const depotCounts: Record<string, number> = {};
    vehicles.forEach((v) => {
      const dep = v.depot || 'Unassigned Depot';
      depotCounts[dep] = (depotCounts[dep] || 0) + 1;
    });

    const depotDistribution = Object.entries(depotCounts).map(([depot, count]) => ({
      depot,
      count,
      percentage: totalVehicles > 0 ? Number(((count / totalVehicles) * 100).toFixed(1)) : 0,
    }));

    const workshopCounts: Record<string, { name: string; count: number }> = {};
    vehicles.forEach((v) => {
      const wsKey = v.workshopId || 'unassigned';
      const wsName = v.workshop?.name || (v.workshopId ? `Workshop ${v.workshopId}` : 'Unassigned Workshop');

      if (!workshopCounts[wsKey]) {
        workshopCounts[wsKey] = { name: wsName, count: 0 };
      }
      workshopCounts[wsKey].count += 1;
    });

    const workshopDistribution = Object.entries(workshopCounts).map(([wsKey, data]) => ({
      workshopId: wsKey === 'unassigned' ? null : wsKey,
      workshopName: data.name,
      count: data.count,
      percentage: totalVehicles > 0 ? Number(((data.count / totalVehicles) * 100).toFixed(1)) : 0,
    }));

    const classCounts: Record<string, number> = {};
    vehicles.forEach((v) => {
      const cls = v.vehicleClass || 'Unclassified';
      classCounts[cls] = (classCounts[cls] || 0) + 1;
    });

    const vehicleClassDistribution = Object.entries(classCounts).map(([vehicleClass, count]) => ({
      vehicleClass,
      count,
      percentage: totalVehicles > 0 ? Number(((count / totalVehicles) * 100).toFixed(1)) : 0,
    }));

    const operationalCount = (statusCounts['ACTIVE'] || 0) + (statusCounts['OPERATIONAL'] || 0);
    const availabilityPercentage = totalVehicles > 0 ? Number(((operationalCount / totalVehicles) * 100).toFixed(1)) : 0;

    const sumStatusCounts = Object.values(statusCounts).reduce((a, b) => a + b, 0);
    const sumRegionCounts = Object.values(regionCounts).reduce((a, b) => a + b.count, 0);
    const isReconciled = sumStatusCounts === totalVehicles && sumRegionCounts === totalVehicles;

    return {
      totalVehicles,
      availabilityPercentage,
      operationalCount,
      maintenanceCount: statusCounts['MAINTENANCE'] || 0,
      groundedCount: statusCounts['GROUNDED'] || 0,
      inactiveCount: statusCounts['INACTIVE'] || 0,
      isReconciled,
      scope: {
        level: scopeCtx?.scopeLevel || 'ORGANISATION',
        region: scopeCtx?.region || 'All',
        depot: scopeCtx?.depot || 'All',
      },
      statusDistribution,
      regionDistribution,
      depotDistribution,
      workshopDistribution,
      vehicleClassDistribution,
      vehiclesList: vehicles.map((v) => ({
        ...v,
        assignedDriver: driverMap.get(v.id) || driverMap.get(v.registrationNumber) || null,
      })),
    };
  }

  async getFleetBreakdown() {
    const [byClass, byRegion, byDepot, byStatus] = await Promise.all([
      this.prisma.vehicle.groupBy({
        by: ['vehicleClass'],
        where: { isActive: true },
        _count: { id: true },
      }),
      this.prisma.vehicle.groupBy({
        by: ['region'],
        where: { isActive: true },
        _count: { id: true },
      }),
      this.prisma.vehicle.groupBy({
        by: ['depot'],
        where: { isActive: true },
        _count: { id: true },
      }),
      this.prisma.vehicle.groupBy({
        by: ['vehicleStatus'],
        where: { isActive: true },
        _count: { id: true },
      }),
    ]);
    return { byClass, byRegion, byDepot, byStatus };
  }

  async getCurrentTyres(vehicleId: string) {
    await this.findOne(vehicleId);
    return this.prisma.tyreFitment.findMany({
      where: { vehicleId, removalDate: null },
      include: { tyre: true },
      orderBy: { positionId: 'asc' },
    });
  }

  async assignDriver(vehicleId: string, driverEmail: string) {
    // Verify the vehicle exists
    const vehicle = await this.findByRegistration(vehicleId).catch(() => null)
      || await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle "${vehicleId}" not found by registration or ID`);
    }

    // Find the driver user
    const driver = await this.prisma.user.findUnique({ where: { email: driverEmail } });
    if (!driver) {
      throw new NotFoundException(`User with email "${driverEmail}" not found`);
    }
    if (driver.role !== 'DRIVER') {
      throw new ConflictException(`User "${driverEmail}" is not a DRIVER (role: ${driver.role})`);
    }

    // Update the driver's assignedVehicleId
    const updated = await this.prisma.user.update({
      where: { id: driver.id },
      data: { assignedVehicleId: vehicle.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        assignedVehicleId: true,
      },
    });

    this.logger.log(`Assigned vehicle ${vehicle.registrationNumber} (${vehicle.id}) to driver ${driver.email}`);
    return {
      message: `Vehicle ${vehicle.registrationNumber} assigned to ${driver.firstName || ''} ${driver.lastName || ''} (${driver.email})`,
      driver: updated,
      vehicle: { id: vehicle.id, registrationNumber: vehicle.registrationNumber },
    };
  }

  async getDriversForVehicles() {
    return this.prisma.user.findMany({
      where: { role: 'DRIVER', isActive: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        assignedVehicleId: true,
      },
      orderBy: { firstName: 'asc' },
    });
  }

  // ──────────────────────────────────────────────
  // PHASE 2 — WORKSHOP TRANSFER & ASSIGNMENT LEDGER
  // ──────────────────────────────────────────────

  async transferWorkshop(vehicleId: string, dto: { workshopId: string; reason?: string }, userId?: string) {
    const vehicle = await this.findOne(vehicleId);
    const workshop = await this.prisma.workshop.findUnique({ where: { id: dto.workshopId } });
    if (!workshop) {
      throw new NotFoundException(`Workshop #${dto.workshopId} not found`);
    }

    const previousWorkshopId = vehicle.workshopId;

    // Update current vehicle workshop assignment
    const updatedVehicle = await this.prisma.vehicle.update({
      where: { id: vehicle.id },
      data: {
        workshopId: dto.workshopId,
        updatedBy: userId,
      },
    });

    // Close any previous open assignment
    if (previousWorkshopId) {
      await this.prisma.vehicleWorkshopAssignment.updateMany({
        where: { vehicleId: vehicle.id, unassignedAt: null },
        data: { unassignedAt: new Date() },
      });
    }

    // Insert append-only assignment ledger record
    const assignment = await this.prisma.vehicleWorkshopAssignment.create({
      data: {
        vehicleId: vehicle.id,
        workshopId: dto.workshopId,
        assignedAt: new Date(),
        assignedBy: userId,
        reason: dto.reason || 'Workshop Transfer',
      },
    });

    // Emit domain event
    await this.eventPublisher.publish({
      eventType: 'vehicle.workshop.transferred',
      entityId: vehicle.id,
      entityType: 'Vehicle',
      actorId: userId,
      payload: {
        vehicleId: vehicle.id,
        fromWorkshopId: previousWorkshopId,
        toWorkshopId: dto.workshopId,
        reason: dto.reason,
      },
    });

    this.logger.log(`Vehicle ${vehicle.registrationNumber} transferred to workshop ${workshop.name} (${workshop.id})`);
    return { vehicle: updatedVehicle, assignment };
  }

  async getWorkshopHistory(vehicleId: string) {
    const vehicle = await this.findOne(vehicleId);
    return this.prisma.vehicleWorkshopAssignment.findMany({
      where: { vehicleId: vehicle.id },
      include: { workshop: true },
      orderBy: { assignedAt: 'desc' },
    });
  }

  // ──────────────────────────────────────────────
  // PHASE 2 — POLICY-DRIVEN GROUNDING & DOWNTIME
  // ──────────────────────────────────────────────

  async evaluateGroundingPolicy(vehicleClass?: string, defectCategory?: string, severityThreshold?: string) {
    const policy = await this.prisma.vehicleGroundingPolicy.findFirst({
      where: {
        ...(vehicleClass && { OR: [{ vehicleClass }, { vehicleClass: 'ALL' }, { vehicleClass: null }] }),
        ...(defectCategory && { defectCategory }),
      },
      orderBy: { createdAt: 'desc' },
    });

    if (policy) {
      return policy;
    }

    // Default policy fallback
    return {
      id: 'POLICY-DEFAULT',
      tenantId: 'TNT-DEFAULT',
      organizationId: 'ORG-DEFAULT',
      name: 'Default Safety Grounding Policy',
      vehicleClass: vehicleClass || 'ALL',
      defectCategory: defectCategory || 'TYRE_CRITICAL',
      severityThreshold: severityThreshold || 'CRITICAL',
      isAutomaticGrounding: true,
      requiresApproval: false,
    };
  }

  async groundVehicle(
    vehicleId: string,
    dto: {
      reason: string;
      defectId?: number;
      sourceDomain?: string;
      requestedBy?: string;
      approverId?: string;
      notes?: string;
    },
    userId?: string,
  ) {
    const vehicle = await this.findOne(vehicleId);

    // Idempotency check: If an active open downtime record exists (recoveredAt IS NULL), return it
    const existingDowntime = await this.prisma.vehicleDowntime.findFirst({
      where: { vehicleId: vehicle.id, recoveredAt: null },
    });

    if (existingDowntime) {
      this.logger.log(`Idempotency check: Vehicle ${vehicle.registrationNumber} is already grounded (Downtime ID: ${existingDowntime.id})`);
      return { vehicle, downtime: existingDowntime, idempotency: true };
    }

    // Evaluate Grounding Policy
    const policy = await this.evaluateGroundingPolicy(vehicle.vehicleClass || undefined, 'TYRE_CRITICAL', 'CRITICAL');

    // Segregation of Duties & Approval check if required by policy
    if (policy.requiresApproval && dto.approverId) {
      this.workflowService.validateSegregationOfDuties(dto.requestedBy || userId || 'system', dto.approverId);
    }

    // Update Vehicle Status to GROUNDED
    const groundedVehicle = await this.prisma.vehicle.update({
      where: { id: vehicle.id },
      data: {
        vehicleStatus: 'GROUNDED',
        updatedBy: userId,
      },
    });

    try {
      // Create VehicleDowntime domain ledger entry — use vehicle's own tenant context
      const downtime = await this.prisma.vehicleDowntime.create({
        data: {
          vehicleId: vehicle.id,
          tenantId: vehicle.tenantId,
          organizationId: vehicle.organizationId,
          workshopId: vehicle.workshopId,
          downtimeType: 'UNPLANNED',
          reason: dto.reason,
          sourceDomain: dto.sourceDomain || 'TYRE_INTELLIGENCE',
          sourceEntityId: dto.defectId ? String(dto.defectId) : undefined,
          startedAt: new Date(),
          defectId: dto.defectId,
          startedBy: dto.requestedBy || userId,
        },
      });

      // Emit domain event
      await this.eventPublisher.publish({
        eventType: 'vehicle.grounded',
        entityId: vehicle.id,
        entityType: 'Vehicle',
        actorId: userId,
        payload: {
          vehicleId: vehicle.id,
          downtimeId: downtime.id,
          sourceDomain: downtime.sourceDomain,
          reason: downtime.reason,
          workshopId: downtime.workshopId,
        },
      });

      this.logger.log(`Vehicle ${vehicle.registrationNumber} grounded (Downtime #${downtime.id})`);
      return { vehicle: groundedVehicle, downtime, idempotency: false };
    } catch (err: any) {
      this.logger.error(`groundVehicle failed: ${err?.message || err}`, err?.stack);
      throw err;
    }
  }

  async recoverVehicle(vehicleId: string, userId?: string, notes?: string) {
    const vehicle = await this.findOne(vehicleId);

    // Find active open downtime record
    const activeDowntime = await this.prisma.vehicleDowntime.findFirst({
      where: { vehicleId: vehicle.id, recoveredAt: null },
    });

    let closedDowntime: any = null;
    if (activeDowntime) {
      const now = new Date();
      const durationMinutes = Math.round((now.getTime() - activeDowntime.startedAt.getTime()) / 60000);

      closedDowntime = await this.prisma.vehicleDowntime.update({
        where: { id: activeDowntime.id },
        data: {
          recoveredAt: now,
          durationMinutes,
          recoveredBy: userId,
        },
      });
    }

    // Restore vehicle status to ACTIVE
    const recoveredVehicle = await this.prisma.vehicle.update({
      where: { id: vehicle.id },
      data: {
        vehicleStatus: 'ACTIVE' as any,
        updatedBy: userId,
      },
    });

    // Emit domain event
    await this.eventPublisher.publish({
      eventType: 'vehicle.recovered',
      entityId: vehicle.id,
      entityType: 'Vehicle',
      actorId: userId,
      payload: {
        vehicleId: vehicle.id,
        downtimeId: closedDowntime?.id,
        durationMinutes: closedDowntime?.durationMinutes || 0,
        recoveredBy: userId,
      },
    });

    this.logger.log(`Vehicle ${vehicle.registrationNumber} recovered from downtime to ACTIVE status`);
    return { vehicle: recoveredVehicle, downtime: closedDowntime };
  }

  async getDowntimeSummary() {
    const [active, recent] = await Promise.all([
      this.prisma.vehicleDowntime.findMany({
        where: { recoveredAt: null },
        include: { vehicle: true, workshop: true, defect: true },
        orderBy: { startedAt: 'desc' },
      }),
      this.prisma.vehicleDowntime.findMany({
        where: { recoveredAt: { not: null } },
        include: { vehicle: true, workshop: true },
        orderBy: { recoveredAt: 'desc' },
        take: 20,
      }),
    ]);
    return { activeDowntimes: active, recentRecoveries: recent };
  }
}

