import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAlertDto, AcknowledgeAlertDto, ResolveAlertDto } from './dto/alert.dto';
import { AlertStatus, AlertSeverity } from '@prisma/client';
import { DataScopeService } from '../auth/data-scope.service';

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dataScopeService: DataScopeService,
  ) {}

  async create(dto: CreateAlertDto) {
    // 0-100 Risk Score Classification: 90-100 CRITICAL, 70-89 HIGH, 40-69 MEDIUM, 0-39 LOW
    let severity = dto.severity || AlertSeverity.MEDIUM;
    if (dto.riskScore != null) {
      if (dto.riskScore >= 90) severity = AlertSeverity.CRITICAL;
      else if (dto.riskScore >= 70) severity = AlertSeverity.HIGH;
      else if (dto.riskScore >= 40) severity = AlertSeverity.MEDIUM;
      else severity = AlertSeverity.LOW;
    }

    const alert = await this.prisma.tyreAlert.create({
      data: {
        ...dto,
        severity,
        status: dto.status || AlertStatus.OPEN,
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
      this.prisma.tyreAlert.count({ where: { status: AlertStatus.OPEN, severity: AlertSeverity.CRITICAL } }),
    ]);
    return { open, acknowledged, resolved, critical };
  }

  /**
   * Fleet Manager Current Unresolved Critical Risk Alerts KPI
   * Strict Specification:
   * - Counts ONLY severity = CRITICAL
   * - Counts ONLY active unresolved statuses: OPEN, ACKNOWLEDGED, ESCALATED, OVERDUE (excluding RESOLVED, CANCELLED, DISMISSED)
   * - Enforces user data scope (Organisation -> Region -> Depot -> Workshop)
   * - Returns breakdown: Open, Escalated, Overdue
   * - Calculates trend comparison vs 7 days ago
   */
  async getCriticalKpi(user?: any) {
    const ctx = this.dataScopeService.buildContext(user || { role: 'FLEET_MANAGER' });
    const scopeWhere = this.dataScopeService.alertWhere(ctx);

    const unresolvedStatuses = [
      AlertStatus.OPEN,
      AlertStatus.ACKNOWLEDGED,
      AlertStatus.ESCALATED,
      AlertStatus.OVERDUE,
    ];

    // Fetch qualifying active CRITICAL alerts within scope
    const criticalAlerts = await this.prisma.tyreAlert.findMany({
      where: {
        ...scopeWhere,
        severity: AlertSeverity.CRITICAL,
        status: { in: unresolvedStatuses },
      },
      include: { tyre: true },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    let openCount = 0;
    let escalatedCount = 0;
    let overdueCount = 0;

    criticalAlerts.forEach((alert) => {
      const isOverdue =
        alert.status === AlertStatus.OVERDUE ||
        (alert.dueDate && alert.dueDate < now) ||
        (now.getTime() - alert.createdAt.getTime() > 3 * 24 * 3600 * 1000);

      const isEscalated =
        alert.status === AlertStatus.ESCALATED ||
        (alert.riskScore != null && alert.riskScore >= 95);

      if (isOverdue) {
        overdueCount++;
      } else if (isEscalated) {
        escalatedCount++;
      } else {
        openCount++;
      }
    });

    const totalCount = criticalAlerts.length;

    // Calculate trend vs previous 7-day period
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    const prevCount = await this.prisma.tyreAlert.count({
      where: {
        ...scopeWhere,
        severity: AlertSeverity.CRITICAL,
        createdAt: { lte: sevenDaysAgo },
        status: { in: unresolvedStatuses },
      },
    });

    const diff = totalCount - prevCount;
    let trendText = 'No change';
    let trendDirection: 'UP' | 'DOWN' | 'NEUTRAL' = 'NEUTRAL';
    if (diff > 0) {
      trendText = `↑ ${diff} vs last week`;
      trendDirection = 'UP';
    } else if (diff < 0) {
      trendText = `↓ ${Math.abs(diff)} vs last week`;
      trendDirection = 'DOWN';
    }

    return {
      count: totalCount,
      open: openCount,
      escalated: escalatedCount,
      overdue: overdueCount,
      trendText,
      trendDirection,
      isZeroReal: totalCount === 0,
      zeroExplanation: totalCount === 0 ? 'NO UNRESOLVED CRITICAL RISKS' : null,
      scope: {
        scopeLevel: ctx.scopeLevel,
        region: ctx.region || 'ALL',
        depot: ctx.depot || 'ALL',
        workshopId: ctx.workshopId || 'ALL',
      },
      criticalAlerts: criticalAlerts.map(a => ({
        id: a.id,
        alertType: a.alertType,
        severity: a.severity,
        riskScore: a.riskScore || 95,
        tyreId: a.tyreId,
        vehicleId: a.vehicleId,
        workshopId: a.workshopId,
        region: a.region,
        depot: a.depot,
        message: a.message,
        recommendedAction: a.recommendedAction,
        status: a.status,
        createdAt: a.createdAt,
        dueDate: a.dueDate,
      })),
    };
  }
}
