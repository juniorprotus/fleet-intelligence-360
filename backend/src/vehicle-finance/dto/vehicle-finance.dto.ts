import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsPositive,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  VehicleOwnershipType,
  VehicleDepreciationMethod,
  BookValueAuthority,
  FinancialDataStatus,
  VehicleFinanceAgreementType,
  VehicleFinanceAgreementStatus,
  VehicleDisposalMethod,
  VehicleDisposalStatus,
  FinanceBalanceSource,
} from '@prisma/client';

// ─── Vehicle Financial Profile ──────────────────────────────────────────────

export class CreateVehicleFinancialProfileDto {
  @ApiProperty() @IsString() vehicleId: string;
  @ApiProperty() @IsNumber() @IsPositive() acquisitionCost: number;
  @ApiProperty() @IsNumber() @IsPositive() capitalizedCost: number;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiProperty() @IsDateString() acquisitionDate: string;
  @ApiProperty() @IsDateString() inServiceDate: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(VehicleOwnershipType) ownershipType?: VehicleOwnershipType;
  @ApiPropertyOptional() @IsOptional() @IsString() vendorId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() purchaseOrderReference?: string;
  @ApiProperty() @IsEnum(VehicleDepreciationMethod) depreciationMethod: VehicleDepreciationMethod;
  @ApiProperty() @IsNumber() @IsPositive() depreciationRatePercent: number;
  @ApiProperty() @IsNumber() @IsPositive() usefulLifeYears: number;
  @ApiProperty() @IsNumber() @IsPositive() usefulLifeKm: number;
  @ApiProperty() @IsNumber() @Min(0) residualValue: number;
  @ApiPropertyOptional() @IsOptional() @IsEnum(BookValueAuthority) bookValueAuthority?: BookValueAuthority;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) externalBookValue?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() externalBookValueDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() lastValuationDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(FinancialDataStatus) financialDataStatus?: FinancialDataStatus;
}

export class UpdateVehicleFinancialProfileDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() @IsPositive() acquisitionCost?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @IsPositive() capitalizedCost?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() acquisitionDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() inServiceDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(VehicleOwnershipType) ownershipType?: VehicleOwnershipType;
  @ApiPropertyOptional() @IsOptional() @IsString() vendorId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() purchaseOrderReference?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(VehicleDepreciationMethod) depreciationMethod?: VehicleDepreciationMethod;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @IsPositive() depreciationRatePercent?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @IsPositive() usefulLifeYears?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @IsPositive() usefulLifeKm?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) residualValue?: number;
  @ApiPropertyOptional() @IsOptional() @IsEnum(BookValueAuthority) bookValueAuthority?: BookValueAuthority;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) externalBookValue?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() externalBookValueDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() lastValuationDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(FinancialDataStatus) financialDataStatus?: FinancialDataStatus;
}

// ─── Vehicle Finance Agreement ───────────────────────────────────────────────

export class CreateVehicleFinanceAgreementDto {
  @ApiProperty() @IsString() vehicleId: string;
  @ApiProperty() @IsString() agreementNumber: string;
  @ApiProperty() @IsEnum(VehicleFinanceAgreementType) agreementType: VehicleFinanceAgreementType;
  @ApiProperty() @IsString() lenderOrLessor: string;
  @ApiPropertyOptional() @IsOptional() @IsString() facilityReference?: string;
  @ApiProperty() @IsNumber() @IsPositive() principalAmount: number;
  @ApiProperty() @IsNumber() @Min(0) downPayment: number;
  @ApiProperty() @IsNumber() @IsPositive() financedAmount: number;
  @ApiProperty() @IsNumber() @Min(0) interestRatePercent: number;
  @ApiProperty() @IsNumber() @IsPositive() termMonths: number;
  @ApiProperty() @IsNumber() @IsPositive() monthlyRepayment: number;
  @ApiProperty() @IsNumber() @Min(0) outstandingBalance: number;
  @ApiPropertyOptional() @IsOptional() @IsEnum(FinanceBalanceSource) balanceSource?: FinanceBalanceSource;
  @ApiPropertyOptional() @IsOptional() @IsDateString() balanceAsOf?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiProperty() @IsDateString() startDate: string;
  @ApiProperty() @IsDateString() maturityDate: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @IsPositive() annualMileageLimitKm?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) residualBalloonAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() documentRef?: string;
}

export class SettleAgreementDto {
  @ApiProperty() @IsDateString() settledAt: string;
  @ApiProperty() @IsNumber() @Min(0) settlementAmount: number;
}

// ─── Vehicle Disposal Record ─────────────────────────────────────────────────

export class CreateVehicleDisposalRecordDto {
  @ApiProperty() @IsString() vehicleId: string;
  @ApiProperty() @IsDateString() disposalDate: string;
  @ApiProperty() @IsEnum(VehicleDisposalMethod) disposalMethod: VehicleDisposalMethod;
  @ApiPropertyOptional() @IsOptional() @IsString() buyerName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() buyerContact?: string;
  @ApiProperty() @IsNumber() @Min(0) saleProceeds: number;
  @ApiProperty() @IsNumber() @Min(0) disposalCosts: number;
  @ApiPropertyOptional() @IsOptional() @IsString() saleInvoiceNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() documentRef?: string;
}

export class FinalizeDisposalDto {
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
