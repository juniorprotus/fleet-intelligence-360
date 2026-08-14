import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventPublisherService } from '../events/event-publisher.service';
import { VehicleService } from '../vehicle/vehicle.service';

@Injectable()
export class DriverService {
  private readonly logger = new Logger(DriverService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: EventPublisherService,
    private readonly vehicleService: VehicleService,
  ) {}

  /**
   * Assign a driver to a vehicle shift (ACTIVE)
   */
  async assignDriver(dto: {
    driverId: number;
    vehicleId: string;
    startOdometer: number;
    notes?: string;
  }) {
    const driver = await this.prisma.user.findUnique({ where: { id: dto.driverId } });
    if (!driver) throw new NotFoundException(`Driver User #${dto.driverId} not found`);

    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
    if (!vehicle) throw new NotFoundException(`Vehicle #${dto.vehicleId} not found`);

    // Check for active existing shift assignment
    const active = await this.prisma.driverAssignment.findFirst({
      where: { driverId: dto.driverId, status: 'ACTIVE' },
    });
    if (active) {
      this.logger.warn(`Driver #${dto.driverId} already has an active shift assignment #${active.id}. Completing previous shift.`);
      await this.prisma.driverAssignment.update({
        where: { id: active.id },
        data: { status: 'COMPLETED', shiftEnd: new Date() },
      });
    }

    const assignment = await this.prisma.driverAssignment.create({
      data: {
        tenantId: 'TNT-DEFAULT',
        organizationId: 'ORG-DEFAULT',
        driverId: dto.driverId,
        vehicleId: dto.vehicleId,
        status: 'ACTIVE',
        startOdometer: dto.startOdometer,
        notes: dto.notes,
      },
      include: { driver: true, vehicle: true },
    });

    await this.eventPublisher.publish({
      eventType: 'driver.assigned',
      entityId: assignment.id,
      entityType: 'DriverAssignment',
      actorId: String(dto.driverId),
      payload: {
        assignmentId: assignment.id,
        driverId: dto.driverId,
        vehicleId: dto.vehicleId,
        shiftStart: assignment.shiftStart,
        startOdometer: dto.startOdometer,
      },
    });

    this.logger.log(`Driver #${dto.driverId} assigned to Vehicle ${vehicle.registrationNumber} (Assignment #${assignment.id}).`);
    return assignment;
  }

  /**
   * Complete shift assignment
   */
  async completeAssignment(id: string, endOdometer?: number) {
    const assignment = await this.prisma.driverAssignment.findUnique({ where: { id } });
    if (!assignment) throw new NotFoundException(`Assignment #${id} not found`);

    return this.prisma.driverAssignment.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        shiftEnd: new Date(),
        endOdometer: endOdometer || assignment.startOdometer,
      },
    });
  }

  /**
   * Submit digital Pre-Trip or Post-Trip Inspection
   * Policy Grounding Integration: Failed critical items invoke VehicleService.groundVehicle()
   */
  async submitTripInspection(dto: {
    vehicleId: string;
    driverId: number;
    type?: any;
    odometer: number;
    items: { category: string; itemName: string; isPassed: boolean; severity?: any; notes?: string }[];
  }) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
    if (!vehicle) throw new NotFoundException(`Vehicle #${dto.vehicleId} not found`);

    const driver = await this.prisma.user.findUnique({ where: { id: dto.driverId } });
    if (!driver) throw new NotFoundException(`Driver User #${dto.driverId} not found`);

    const inspectionNo = `INSP-${Date.now().toString().slice(-6)}`;
    const hasDefects = dto.items.some((i) => !i.isPassed);
    const criticalFailure = dto.items.find((i) => !i.isPassed && i.severity === 'CRITICAL');

    let isGrounded = false;
    let groundingReason: string | undefined = undefined;

    // 1. Create TripInspection
    const inspection = await this.prisma.tripInspection.create({
      data: {
        inspectionNo,
        tenantId: 'TNT-DEFAULT',
        organizationId: 'ORG-DEFAULT',
        vehicleId: dto.vehicleId,
        driverId: dto.driverId,
        type: dto.type || 'PRE_TRIP',
        status: criticalFailure ? 'FAILED_CRITICAL' : hasDefects ? 'FAILED_MINOR' : 'PASSED',
        odometer: dto.odometer,
        hasDefects,
        isGrounded: false,
        itemResults: {
          create: dto.items.map((i) => ({
            category: i.category,
            itemName: i.itemName,
            isPassed: i.isPassed,
            severity: i.severity || 'LOW',
            notes: i.notes,
          })),
        },
      },
      include: { itemResults: true },
    });

    // 2. Policy-driven grounding if critical defect detected
    if (criticalFailure) {
      isGrounded = true;
      groundingReason = `Pre-Trip Inspection Failed: ${criticalFailure.itemName} (${criticalFailure.notes || 'Critical Defect'})`;

      await this.vehicleService.groundVehicle(dto.vehicleId, {
        reason: groundingReason,
        sourceDomain: 'DRIVER_SAFETY_INTELLIGENCE',
        requestedBy: driver.email,
      });

      await this.prisma.tripInspection.update({
        where: { id: inspection.id },
        data: { isGrounded: true, groundingReason },
      });
    }

    // 3. Emit inspection.completed event
    await this.eventPublisher.publish({
      eventType: 'inspection.completed',
      entityId: inspection.id,
      entityType: 'TripInspection',
      actorId: String(dto.driverId),
      payload: {
        inspectionId: inspection.id,
        inspectionNo: inspection.inspectionNo,
        vehicleId: dto.vehicleId,
        driverId: dto.driverId,
        type: inspection.type,
        status: inspection.status,
        hasDefects,
        isGrounded,
      },
    });

    this.logger.log(`Trip Inspection ${inspection.inspectionNo} submitted for Vehicle ${vehicle.registrationNumber} (Grounded: ${isGrounded}).`);
    return { ...inspection, isGrounded, groundingReason };
  }

  async getAssignments(driverId?: number) {
    const where: any = {};
    if (driverId) where.driverId = driverId;
    return this.prisma.driverAssignment.findMany({
      where,
      include: { driver: true, vehicle: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getInspections(vehicleId?: string) {
    const where: any = {};
    if (vehicleId) where.vehicleId = vehicleId;
    return this.prisma.tripInspection.findMany({
      where,
      include: { driver: true, vehicle: true, itemResults: true },
      orderBy: { submittedAt: 'desc' },
    });
  }
}
