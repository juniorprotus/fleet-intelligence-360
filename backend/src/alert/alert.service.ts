import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAlertDto, AcknowledgeAlertDto, ResolveAlertDto } from './dto/alert.dto';
import { AlertStatus } from '@prisma/client';

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAlertDto) {
    const alert = await this.prisma.tyreAlert.create({
      data: {
        ...dto,
        status: AlertStatus.OPEN,
      },
    });
    this.logger.log(`Alert created: [${alert.severity}] ${alert.message}`);
    return alert;
  }

  async findAll(filters?: {
    status?: string;
    severity?: string;
    vehicleId?: string;
    tyreId?: number;
  }) {
    return this.prisma.tyreAlert.findMany({
      where: {
        ...(filters?.status && { status: filters.status as any }),
        ...(filters?.severity && { severity: filters.severity as any }),
        ...(filters?.vehicleId && { vehicleId: filters.vehicleId }),
        ...(filters?.tyreId && { tyreId: filters.tyreId }),
      },
      include: {
        tyre: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const alert = await this.prisma.tyreAlert.findUnique({
      where: { id },
      include: { tyre: true },
    });
    if (!alert) throw new NotFoundException(`Alert ${id} not found`);
    return alert;
  }

  async acknowledge(id: number, dto: AcknowledgeAlertDto, userId?: string) {
    await this.findOne(id);
    return this.prisma.tyreAlert.update({
      where: { id },
      data: {
        status: AlertStatus.ACKNOWLEDGED,
        acknowledgedBy: userId || 'SYSTEM_USER',
        acknowledgedAt: new Date(),
        ...(dto.note && { resolutionNote: dto.note }),
      },
    });
  }

  async resolve(id: number, dto: ResolveAlertDto, userId?: string) {
    await this.findOne(id);
    return this.prisma.tyreAlert.update({
      where: { id },
      data: {
        status: AlertStatus.RESOLVED,
        resolvedBy: userId || 'SYSTEM_USER',
        resolvedAt: new Date(),
        resolutionNote: dto.resolutionNote,
      },
    });
  }

  async getSummary() {
    const [open, acknowledged, resolved, critical] = await Promise.all([
      this.prisma.tyreAlert.count({ where: { status: AlertStatus.OPEN } }),
      this.prisma.tyreAlert.count({ where: { status: AlertStatus.ACKNOWLEDGED } }),
      this.prisma.tyreAlert.count({ where: { status: AlertStatus.RESOLVED } }),
      this.prisma.tyreAlert.count({ where: { status: AlertStatus.OPEN, severity: 'CRITICAL' } }),
    ]);
    return { open, acknowledged, resolved, critical };
  }
}
