import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ProductStatus,
  PlanStatus,
  PlanVersionStatus,
  PricingModel,
  BillingInterval,
} from '@prisma/client';

// ─── PRODUCT DTOs ────────────────────────────────────────────────────────────

export class CreateProductDto {
  @ApiProperty() @IsString() productKey: string;
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(ProductStatus) status?: ProductStatus;
  @ApiPropertyOptional() @IsOptional() @IsNumber() displayOrder?: number;
}

export class UpdateProductDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(ProductStatus) status?: ProductStatus;
  @ApiPropertyOptional() @IsOptional() @IsNumber() displayOrder?: number;
}

// ─── PLAN DTOs ───────────────────────────────────────────────────────────────

export class CreatePlanDto {
  @ApiProperty() @IsString() productId: string;
  @ApiProperty() @IsString() planKey: string;
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(PlanStatus) status?: PlanStatus;
  @ApiPropertyOptional() @IsOptional() @IsNumber() displayOrder?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublic?: boolean;
}

export class UpdatePlanDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(PlanStatus) status?: PlanStatus;
  @ApiPropertyOptional() @IsOptional() @IsNumber() displayOrder?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublic?: boolean;
}

// ─── PLAN VERSION DTOs ────────────────────────────────────────────────────────

export class CreatePlanVersionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() planId?: string;
  @ApiProperty() @IsNumber() @Min(1) versionNumber: number;
  @ApiProperty() @IsDateString() effectiveFrom: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() effectiveTo?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(PlanVersionStatus) status?: PlanVersionStatus;
  @ApiPropertyOptional() @IsOptional() @IsEnum(PricingModel) pricingModel?: PricingModel;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(BillingInterval) billingInterval?: BillingInterval;
}

// ─── PLAN PRICE DTOs ─────────────────────────────────────────────────────────

export class CreatePlanPriceDto {
  @ApiProperty() @IsString() currency: string;
  @ApiProperty() @IsEnum(BillingInterval) billingInterval: BillingInterval;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) amount?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isDefault?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsDateString() effectiveFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() effectiveTo?: string;
}

export class UpdatePlanPriceDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) amount?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isDefault?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsDateString() effectiveFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() effectiveTo?: string;
}

// ─── VEHICLE PRICING BAND DTOs ──────────────────────────────────────────────

export class CreatePricingBandDto {
  @ApiProperty() @IsNumber() @Min(0) minVehicles: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) maxVehicles?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) pricePerVehicle?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) flatPrice?: number;
  @ApiProperty() @IsString() currency: string;
  @ApiProperty() @IsEnum(BillingInterval) billingInterval: BillingInterval;
  @ApiPropertyOptional() @IsOptional() @IsDateString() effectiveFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() effectiveTo?: string;
}

export class UpdatePricingBandDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) minVehicles?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) maxVehicles?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) pricePerVehicle?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) flatPrice?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() effectiveFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() effectiveTo?: string;
}
