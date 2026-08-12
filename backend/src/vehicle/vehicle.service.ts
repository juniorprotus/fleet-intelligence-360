import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';

@Injectable()
export class VehicleService {
  private readonly logger = new Logger(VehicleService.name);

  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.vehicle.findMany({
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
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
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
    if (!vehicle) throw new NotFoundException(`Vehicle ${id} not found`);
    return vehicle;
  }

  async findByRegistration(reg: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { registrationNumber: reg },
    });
    if (!vehicle) throw new NotFoundException(`Vehicle ${reg} not found`);
    return vehicle;
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
