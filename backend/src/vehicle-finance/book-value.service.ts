import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DepreciationService } from './depreciation.service';
import { ProfileService } from './profile.service';

export interface BookValueResult {
  vehicleId: string;
  authority: string;
  bookValue: number | null;
  grossAcquisitionCost: number;
  accumulatedDepreciation: number | null;
  residualValue: number;
  depreciationMethod: string;
  depreciationStartDate: Date;
  currency: string;
  dataQuality: string;
  valuationDate: Date;
  notes?: string;
}

@Injectable()
export class BookValueService {
  private readonly logger = new Logger(BookValueService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly depreciation: DepreciationService,
    private readonly profileService: ProfileService,
  ) {}

  async getBookValue(
    vehicleId: string,
    tenantId: string,
    organizationId: string,
  ): Promise<BookValueResult> {
    const profile = await this.prisma.vehicleFinancialProfile.findFirst({
      where: { vehicleId, tenantId, organizationId },
    });
    if (!profile) {
      throw new NotFoundException(
        `No financial profile found for vehicle ${vehicleId}. Book value cannot be calculated.`,
      );
    }

    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, tenantId, organizationId },
      select: { currentOdometer: true },
    });

    const authority = profile.bookValueAuthority;
    const valuationDate = new Date();

    // EXTERNAL_ERP authority: return externally provided book value
    if (authority === 'EXTERNAL_ERP') {
      if (profile.externalBookValue === null || profile.externalBookValue === undefined) {
        return {
          vehicleId,
          authority,
          bookValue: null,
          grossAcquisitionCost: Number(profile.capitalizedCost),
          accumulatedDepreciation: null,
          residualValue: Number(profile.residualValue),
          depreciationMethod: profile.depreciationMethod,
          depreciationStartDate: profile.inServiceDate,
          currency: profile.currency,
          dataQuality: 'INSUFFICIENT_DATA',
          valuationDate,
          notes: 'External book value configured as authority but no externalBookValue provided.',
        };
      }
      return {
        vehicleId,
        authority,
        bookValue: Number(profile.externalBookValue),
        grossAcquisitionCost: Number(profile.capitalizedCost),
        accumulatedDepreciation: null,
        residualValue: Number(profile.residualValue),
        depreciationMethod: profile.depreciationMethod,
        depreciationStartDate: profile.inServiceDate,
        currency: profile.currency,
        dataQuality: 'EXTERNAL_VERIFIED',
        valuationDate: profile.externalBookValueDate ?? valuationDate,
      };
    }

    // MANUAL_VERIFIED authority: similar to EXTERNAL_ERP
    if (authority === 'MANUAL_VERIFIED') {
      if (profile.externalBookValue === null || profile.externalBookValue === undefined) {
        return {
          vehicleId,
          authority,
          bookValue: null,
          grossAcquisitionCost: Number(profile.capitalizedCost),
          accumulatedDepreciation: null,
          residualValue: Number(profile.residualValue),
          depreciationMethod: profile.depreciationMethod,
          depreciationStartDate: profile.inServiceDate,
          currency: profile.currency,
          dataQuality: 'INSUFFICIENT_DATA',
          valuationDate,
          notes: 'Manual verified authority set but no externalBookValue provided.',
        };
      }
      return {
        vehicleId,
        authority,
        bookValue: Number(profile.externalBookValue),
        grossAcquisitionCost: Number(profile.capitalizedCost),
        accumulatedDepreciation: null,
        residualValue: Number(profile.residualValue),
        depreciationMethod: profile.depreciationMethod,
        depreciationStartDate: profile.inServiceDate,
        currency: profile.currency,
        dataQuality: 'MANUAL_VERIFIED',
        valuationDate: profile.lastValuationDate ?? valuationDate,
      };
    }

    // FI360 authority: calculate from depreciation engine
    const depProfile = {
      acquisitionCost: Number(profile.acquisitionCost),
      capitalizedCost: Number(profile.capitalizedCost),
      residualValue: Number(profile.residualValue),
      depreciationRatePercent: Number(profile.depreciationRatePercent),
      usefulLifeYears: profile.usefulLifeYears,
      usefulLifeKm: profile.usefulLifeKm,
      depreciationMethod: profile.depreciationMethod,
      inServiceDate: profile.inServiceDate,
    };

    const result = this.depreciation.calculate(
      depProfile,
      vehicle?.currentOdometer ?? undefined,
      valuationDate,
    );

    return {
      vehicleId,
      authority: 'FI360',
      bookValue: result.dataQuality === 'INSUFFICIENT_DATA' ? null : result.bookValue,
      grossAcquisitionCost: Number(profile.capitalizedCost),
      accumulatedDepreciation:
        result.dataQuality === 'INSUFFICIENT_DATA' ? null : result.accumulatedDepreciation,
      residualValue: Number(profile.residualValue),
      depreciationMethod: result.method,
      depreciationStartDate: result.depreciationStartDate,
      currency: profile.currency,
      dataQuality: result.dataQuality,
      valuationDate,
      notes: result.notes,
    };
  }
}
