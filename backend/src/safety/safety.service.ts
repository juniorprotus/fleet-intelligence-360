import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventPublisherService } from '../events/event-publisher.service';

@Injectable()
export class SafetyService {
  private readonly logger = new Logger(SafetyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  async logIncident(dto: {
    driverId: number;
    vehicleId: string;
    incidentType: string;
    severity?: any;
    description: string;
    occurredAt?: Date;
    pointsDeducted?: number;
  }) {
    const driver = await this.prisma.user.findUnique({ where: { id: dto.driverId } });
    if (!driver) throw new NotFoundException(`Driver User #${dto.driverId} not found`);

    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
    if (!vehicle) throw new NotFoundException(`Vehicle #${dto.vehicleId} not found`);

    const incidentNo = `INC-${Date.now().toString().slice(-6)}`;
    const points = dto.pointsDeducted || (dto.severity === 'CRITICAL' ? 15 : dto.severity === 'HIGH' ? 10 : 5);

    const incident = await this.prisma.safetyIncident.create({
      data: {
        incidentNo,
        tenantId: 'TNT-DEFAULT',
        organizationId: 'ORG-DEFAULT',
        driverId: dto.driverId,
        vehicleId: dto.vehicleId,
        incidentType: dto.incidentType,
        severity: dto.severity || 'MEDIUM',
        description: dto.description,
        occurredAt: dto.occurredAt || new Date(),
        pointsDeducted: points,
      },
      include: { driver: true, vehicle: true },
    });

    // Update monthly DriverSafetyScore
    const monthStr = new Date().toISOString().slice(0, 7);
    await this.updateDriverScore(dto.driverId, monthStr, points);

    await this.eventPublisher.publish({
      eventType: 'safety.incident_logged',
      entityId: incident.id,
      entityType: 'SafetyIncident',
      actorId: String(dto.driverId),
      payload: {
        incidentId: incident.id,
        incidentNo: incident.incidentNo,
        driverId: dto.driverId,
        vehicleId: dto.vehicleId,
        incidentType: dto.incidentType,
        severity: incident.severity,
        pointsDeducted: points,
      },
    });

    this.logger.log(`Logged Safety Incident ${incident.incidentNo} for Driver #${dto.driverId} (-${points} pts).`);
    return incident;
  }

  private async updateDriverScore(driverId: number, periodMonth: string, pointsToDeduct: number) {
    const existing = await this.prisma.driverSafetyScore.findUnique({
      where: { driverId_periodMonth: { driverId, periodMonth } },
    });

    if (existing) {
      const newScore = Math.max(0, existing.score - pointsToDeduct);
      return this.prisma.driverSafetyScore.update({
        where: { id: existing.id },
        data: {
          score: newScore,
          incidentsCount: existing.incidentsCount + 1,
        },
      });
    }

    return this.prisma.driverSafetyScore.create({
      data: {
        tenantId: 'TNT-DEFAULT',
        organizationId: 'ORG-DEFAULT',
        driverId,
        periodMonth,
        score: Math.max(0, 100.0 - pointsToDeduct),
        totalTrips: 1,
        inspectionsPassed: 1,
        incidentsCount: 1,
      },
    });
  }

  async getDriverSafetyScore(driverId: number, periodMonth?: string) {
    const monthStr = periodMonth || new Date().toISOString().slice(0, 7);
    const scoreRec = await this.prisma.driverSafetyScore.findUnique({
      where: { driverId_periodMonth: { driverId, periodMonth: monthStr } },
      include: { driver: true },
    });

    if (!scoreRec) {
      return {
        driverId,
        periodMonth: monthStr,
        score: 100.0,
        totalTrips: 0,
        inspectionsPassed: 0,
        incidentsCount: 0,
        status: 'PASSED',
      };
    }

    return scoreRec;
  }
}
