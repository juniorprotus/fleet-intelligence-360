import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateVehicleFinanceAgreementDto,
  SettleAgreementDto,
} from './dto/vehicle-finance.dto';

@Injectable()
export class AgreementService {
  private readonly logger = new Logger(AgreementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(
    dto: CreateVehicleFinanceAgreementDto,
    tenantId: string,
    organizationId: string,
    userEmail?: string,
  ) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: dto.vehicleId, tenantId, organizationId },
    });
    if (!vehicle) throw new NotFoundException(`Vehicle ${dto.vehicleId} not found`);

    const agreement = await this.prisma.vehicleFinanceAgreement.create({
      data: {
        vehicleId: dto.vehicleId,
        agreementNumber: dto.agreementNumber,
        agreementType: dto.agreementType,
        lenderOrLessor: dto.lenderOrLessor,
        facilityReference: dto.facilityReference ?? null,
        principalAmount: dto.principalAmount,
        downPayment: dto.downPayment,
        financedAmount: dto.financedAmount,
        interestRatePercent: dto.interestRatePercent,
        termMonths: dto.termMonths,
        monthlyRepayment: dto.monthlyRepayment,
        outstandingBalance: dto.outstandingBalance,
        balanceSource: dto.balanceSource ?? 'MANUAL',
        balanceAsOf: dto.balanceAsOf ? new Date(dto.balanceAsOf) : null,
        currency: dto.currency ?? 'KES',
        startDate: new Date(dto.startDate),
        maturityDate: new Date(dto.maturityDate),
        annualMileageLimitKm: dto.annualMileageLimitKm ?? null,
        residualBalloonAmount: dto.residualBalloonAmount ?? 0,
        status: 'ACTIVE',
        documentRef: dto.documentRef ?? null,
        tenantId,
        organizationId,
        createdBy: userEmail,
        updatedBy: userEmail,
      },
    });

    await this.audit.logAction({
      module: 'VEHICLE_FINANCE',
      action: 'FINANCE_AGREEMENT_CREATE',
      entityType: 'VehicleFinanceAgreement',
      entityId: agreement.id,
      userEmail,
      afterValue: agreement,
    });

    return agreement;
  }

  async findByVehicle(vehicleId: string, tenantId: string, organizationId: string) {
    return this.prisma.vehicleFinanceAgreement.findMany({
      where: { vehicleId, tenantId, organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(agreementId: string, tenantId: string, organizationId: string) {
    const agreement = await this.prisma.vehicleFinanceAgreement.findFirst({
      where: { id: agreementId, tenantId, organizationId },
    });
    if (!agreement) throw new NotFoundException(`Agreement ${agreementId} not found`);
    return agreement;
  }

  async settle(
    agreementId: string,
    dto: SettleAgreementDto,
    tenantId: string,
    organizationId: string,
    userEmail?: string,
  ) {
    const agreement = await this.prisma.vehicleFinanceAgreement.findFirst({
      where: { id: agreementId, tenantId, organizationId },
    });
    if (!agreement) throw new NotFoundException(`Agreement ${agreementId} not found`);
    const before = { ...agreement };

    const updated = await this.prisma.vehicleFinanceAgreement.update({
      where: { id: agreementId },
      data: {
        status: 'SETTLED',
        settledAt: new Date(dto.settledAt),
        settlementAmount: dto.settlementAmount,
        outstandingBalance: 0,
        updatedBy: userEmail,
      },
    });

    await this.audit.logAction({
      module: 'VEHICLE_FINANCE',
      action: 'FINANCE_AGREEMENT_SETTLE',
      entityType: 'VehicleFinanceAgreement',
      entityId: agreementId,
      userEmail,
      beforeValue: before,
      afterValue: updated,
    });

    return updated;
  }
}
