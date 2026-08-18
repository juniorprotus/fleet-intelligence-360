import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BookValueService } from './book-value.service';
import {
  CreateVehicleDisposalRecordDto,
  FinalizeDisposalDto,
} from './dto/vehicle-finance.dto';

@Injectable()
export class DisposalService {
  private readonly logger = new Logger(DisposalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly bookValueService: BookValueService,
  ) {}

  async create(
    dto: CreateVehicleDisposalRecordDto,
    tenantId: string,
    organizationId: string,
    userEmail?: string,
  ) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: dto.vehicleId, tenantId, organizationId },
    });
    if (!vehicle) throw new NotFoundException(`Vehicle ${dto.vehicleId} not found`);

    // Calculate book value at disposal time
    let bookValueAtDisposal = 0;
    try {
      const bv = await this.bookValueService.getBookValue(dto.vehicleId, tenantId, organizationId);
      if (bv.bookValue !== null) {
        bookValueAtDisposal = bv.bookValue;
      }
    } catch {
      // Profile may not exist yet — allow 0 as placeholder for DRAFT
      bookValueAtDisposal = 0;
    }

    // gain/loss = saleProceeds - disposalCosts - bookValueAtDisposal
    const gainOrLoss = dto.saleProceeds - dto.disposalCosts - bookValueAtDisposal;

    const record = await this.prisma.vehicleDisposalRecord.create({
      data: {
        vehicleId: dto.vehicleId,
        disposalDate: new Date(dto.disposalDate),
        disposalMethod: dto.disposalMethod,
        buyerName: dto.buyerName ?? null,
        buyerContact: dto.buyerContact ?? null,
        saleProceeds: dto.saleProceeds,
        disposalCosts: dto.disposalCosts,
        bookValueAtDisposal,
        gainOrLossAmount: gainOrLoss,
        saleInvoiceNumber: dto.saleInvoiceNumber ?? null,
        reason: dto.reason ?? null,
        documentRef: dto.documentRef ?? null,
        status: 'DRAFT',
        tenantId,
        organizationId,
        createdBy: userEmail,
        updatedBy: userEmail,
      },
    });

    await this.audit.logAction({
      module: 'VEHICLE_FINANCE',
      action: 'DISPOSAL_CREATE',
      entityType: 'VehicleDisposalRecord',
      entityId: record.id,
      userEmail,
      afterValue: record,
    });

    return record;
  }

  async findByVehicle(vehicleId: string, tenantId: string, organizationId: string) {
    return this.prisma.vehicleDisposalRecord.findMany({
      where: { vehicleId, tenantId, organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(disposalId: string, tenantId: string, organizationId: string) {
    const record = await this.prisma.vehicleDisposalRecord.findFirst({
      where: { id: disposalId, tenantId, organizationId },
    });
    if (!record) throw new NotFoundException(`Disposal record ${disposalId} not found`);
    return record;
  }

  async finalize(
    disposalId: string,
    dto: FinalizeDisposalDto,
    tenantId: string,
    organizationId: string,
    userEmail?: string,
  ) {
    const record = await this.prisma.vehicleDisposalRecord.findFirst({
      where: { id: disposalId, tenantId, organizationId },
    });
    if (!record) throw new NotFoundException(`Disposal record ${disposalId} not found`);
    if (record.status === 'FINALIZED') {
      throw new BadRequestException('Disposal record is already finalized and cannot be modified.');
    }

    const before = { ...record };
    const now = new Date();

    // Transactional finalization: recalculate book value, compute final gain/loss, mark vehicle disposed
    const [updated] = await this.prisma.$transaction(async (tx) => {
      // Re-fetch fresh book value
      let bookValueAtDisposal = Number(record.bookValueAtDisposal);
      try {
        const bv = await this.bookValueService.getBookValue(record.vehicleId, tenantId, organizationId);
        if (bv.bookValue !== null) bookValueAtDisposal = bv.bookValue;
      } catch {
        // Keep existing book value
      }

      const gainOrLoss = Number(record.saleProceeds) - Number(record.disposalCosts) - bookValueAtDisposal;

      const finalRecord = await tx.vehicleDisposalRecord.update({
        where: { id: disposalId },
        data: {
          status: 'FINALIZED',
          bookValueAtDisposal,
          gainOrLossAmount: gainOrLoss,
          finalizedAt: now,
          finalizedBy: userEmail,
          updatedBy: userEmail,
        },
      });

      // Mark vehicle as DISPOSED
      await tx.vehicle.update({
        where: { id: record.vehicleId },
        data: {
          vehicleStatus: 'DISPOSED',
          disposalDate: record.disposalDate,
          isActive: false,
          updatedBy: userEmail,
        },
      });

      return [finalRecord];
    });

    await this.audit.logAction({
      module: 'VEHICLE_FINANCE',
      action: 'DISPOSAL_FINALIZE',
      entityType: 'VehicleDisposalRecord',
      entityId: disposalId,
      userEmail,
      beforeValue: before,
      afterValue: updated,
    });

    return updated;
  }
}
