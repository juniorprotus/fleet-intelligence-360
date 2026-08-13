import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DataScopeService, DataScopeContext } from '../auth/data-scope.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';

@Injectable()
export class VehicleService {
  private readonly logger = new Logger(VehicleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dataScopeService: DataScopeService,
  ) {}

  async create(dto: CreateVehicleDto, userId?: string) {
    const existing = await this.prisma.vehicle.findUnique({
      where: { registrationNumber: dto.registrationNumber },
    });
    if (existing) {
      throw new ConflictException(`Vehicle ${dto.registrationNumber} already exists`);
    }
    const vehicle = await this.prisma.vehicle.create({
      data: {
        ...dto,
        acquisitionDate: dto.acquisitionDate ? new Date(dto.acquisitionDate) : undefined,
        createdBy: userId,
        updatedBy: userId,
      },
    });
    this.logger.log(`Vehicle created: ${vehicle.registrationNumber} (${vehicle.id})`);
    return vehicle;
  }

  async findAll(filters?: {
    region?: string;
    depot?: string;
    vehicleClass?: string;
    status?: string;
  }) {
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        isActive: true,
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

  async getVehicleDistributionKPI(scopeCtx?: DataScopeContext) {
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
    // Return all DRIVER users with their assigned vehicle info
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
}
