import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateVehicleFinancialProfileDto,
  UpdateVehicleFinancialProfileDto,
} from './dto/vehicle-finance.dto';
import { DepreciationService } from './depreciation.service';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly depreciation: DepreciationService,
  ) {}

  async create(
    dto: CreateVehicleFinancialProfileDto,
    tenantId: string,
    organizationId: string,
    userEmail?: string,
  ) {
    // Confirm vehicle exists and belongs to the same tenant/org
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: dto.vehicleId, tenantId, organizationId },
    });
    if (!vehicle) throw new NotFoundException(`Vehicle ${dto.vehicleId} not found`);

    const existing = await this.prisma.vehicleFinancialProfile.findUnique({
      where: { vehicleId: dto.vehicleId },
    });
    if (existing) throw new ConflictException(`Financial profile already exists for vehicle ${dto.vehicleId}`);

    const profile = await this.prisma.vehicleFinancialProfile.create({
      data: {
        vehicleId: dto.vehicleId,
        acquisitionCost: dto.acquisitionCost,
        capitalizedCost: dto.capitalizedCost,
        currency: dto.currency ?? 'KES',
        acquisitionDate: new Date(dto.acquisitionDate),
        inServiceDate: new Date(dto.inServiceDate),
        ownershipType: dto.ownershipType ?? 'OWNED',
        vendorId: dto.vendorId ?? null,
        purchaseOrderReference: dto.purchaseOrderReference ?? null,
        depreciationMethod: dto.depreciationMethod,
        depreciationRatePercent: dto.depreciationRatePercent,
        usefulLifeYears: dto.usefulLifeYears,
        usefulLifeKm: dto.usefulLifeKm,
        residualValue: dto.residualValue,
        bookValueAuthority: dto.bookValueAuthority ?? 'FI360',
        externalBookValue: dto.externalBookValue ?? null,
        externalBookValueDate: dto.externalBookValueDate ? new Date(dto.externalBookValueDate) : null,
        lastValuationDate: dto.lastValuationDate ? new Date(dto.lastValuationDate) : null,
        financialDataStatus: dto.financialDataStatus ?? 'ACTIVE',
        tenantId,
        organizationId,
        createdBy: userEmail,
        updatedBy: userEmail,
      },
    });

    await this.audit.logAction({
      module: 'VEHICLE_FINANCE',
      action: 'FINANCIAL_PROFILE_CREATE',
      entityType: 'VehicleFinancialProfile',
      entityId: profile.id,
      userEmail,
      afterValue: profile,
    });

    return profile;
  }

  async findByVehicle(vehicleId: string, tenantId: string, organizationId: string) {
    const profile = await this.prisma.vehicleFinancialProfile.findFirst({
      where: { vehicleId, tenantId, organizationId },
      include: { vendor: { select: { id: true, name: true, vendorCode: true } } },
    });
    if (!profile) throw new NotFoundException(`No financial profile for vehicle ${vehicleId}`);
    return profile;
  }

  async update(
    vehicleId: string,
    dto: UpdateVehicleFinancialProfileDto,
    tenantId: string,
    organizationId: string,
    userEmail?: string,
  ) {
    const profile = await this.prisma.vehicleFinancialProfile.findFirst({
      where: { vehicleId, tenantId, organizationId },
    });
    if (!profile) throw new NotFoundException(`No financial profile for vehicle ${vehicleId}`);

    const before = { ...profile };
    const updated = await this.prisma.vehicleFinancialProfile.update({
      where: { id: profile.id },
      data: {
        ...(dto.acquisitionCost !== undefined && { acquisitionCost: dto.acquisitionCost }),
        ...(dto.capitalizedCost !== undefined && { capitalizedCost: dto.capitalizedCost }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.acquisitionDate !== undefined && { acquisitionDate: new Date(dto.acquisitionDate) }),
        ...(dto.inServiceDate !== undefined && { inServiceDate: new Date(dto.inServiceDate) }),
        ...(dto.ownershipType !== undefined && { ownershipType: dto.ownershipType }),
        ...(dto.vendorId !== undefined && { vendorId: dto.vendorId }),
        ...(dto.purchaseOrderReference !== undefined && { purchaseOrderReference: dto.purchaseOrderReference }),
        ...(dto.depreciationMethod !== undefined && { depreciationMethod: dto.depreciationMethod }),
        ...(dto.depreciationRatePercent !== undefined && { depreciationRatePercent: dto.depreciationRatePercent }),
        ...(dto.usefulLifeYears !== undefined && { usefulLifeYears: dto.usefulLifeYears }),
        ...(dto.usefulLifeKm !== undefined && { usefulLifeKm: dto.usefulLifeKm }),
        ...(dto.residualValue !== undefined && { residualValue: dto.residualValue }),
        ...(dto.bookValueAuthority !== undefined && { bookValueAuthority: dto.bookValueAuthority }),
        ...(dto.externalBookValue !== undefined && { externalBookValue: dto.externalBookValue }),
        ...(dto.externalBookValueDate !== undefined && { externalBookValueDate: new Date(dto.externalBookValueDate) }),
        ...(dto.lastValuationDate !== undefined && { lastValuationDate: new Date(dto.lastValuationDate) }),
        ...(dto.financialDataStatus !== undefined && { financialDataStatus: dto.financialDataStatus }),
        updatedBy: userEmail,
      },
    });

    await this.audit.logAction({
      module: 'VEHICLE_FINANCE',
      action: 'FINANCIAL_PROFILE_UPDATE',
      entityType: 'VehicleFinancialProfile',
      entityId: profile.id,
      userEmail,
      beforeValue: before,
      afterValue: updated,
    });

    return updated;
  }
}
