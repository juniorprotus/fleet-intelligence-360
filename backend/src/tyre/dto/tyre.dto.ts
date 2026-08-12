import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsNumber,
  IsDateString,
  IsBoolean,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TyreType, TyreStatus } from '@prisma/client';

export class CreateTyreDto {
  @ApiPropertyOptional({ description: 'Unique FI360 Tyre ID (auto-generated if omitted e.g. TYR-000001)', example: 'TYR-000001' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  tyreIdentifier?: string;

  @ApiPropertyOptional({ description: 'Alias for tyreIdentifier' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  identifier?: string;

  @ApiPropertyOptional({ description: 'Manufacturer serial number' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  serialNumber?: string;

  @ApiPropertyOptional({ description: 'Internal company brand number (Fleet Owner Stamped Code)', example: 'BN-9021' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  companyBrandNumber?: string;

  @ApiProperty({ description: 'Tyre brand', example: 'Bridgestone' })
  @IsString()
  @MaxLength(100)
  brand: string;

  @ApiProperty({ description: 'Tyre model name', example: 'R168' })
  @IsString()
  @MaxLength(100)
  model: string;

  @ApiProperty({ description: 'Tyre size designation', example: '315/80R22.5' })
  @IsString()
  @MaxLength(50)
  size: string;

  @ApiPropertyOptional({ description: 'Tyre type', enum: TyreType, default: TyreType.NEW })
  @IsOptional()
  @IsEnum(TyreType)
  tyreType?: TyreType;

  @ApiPropertyOptional({ description: 'Construction (Radial/Bias)', example: 'Radial' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  construction?: string;

  @ApiPropertyOptional({ description: 'Manufacturer Name', example: 'Bridgestone Corporation' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  manufacturer?: string;

  @ApiPropertyOptional({ description: 'Load index', example: 156 })
  @IsOptional()
  @IsInt()
  @Min(0)
  loadIndex?: number;

  @ApiPropertyOptional({ description: 'Speed rating code', example: 'L' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  speedRating?: string;

  @ApiPropertyOptional({ description: 'Tread pattern name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  pattern?: string;

  @ApiPropertyOptional({ description: 'Ply rating' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  plyRating?: string;

  @ApiPropertyOptional({ description: 'DOT manufacturing code' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  dotCode?: string;

  @ApiPropertyOptional({ description: 'Purchase date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @ApiPropertyOptional({ description: 'Purchase cost', example: 45000.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  purchaseCost?: number;

  @ApiPropertyOptional({ description: 'Purchase order reference number' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  purchaseOrderNumber?: string;

  @ApiPropertyOptional({ description: 'Currency code', example: 'KES' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({ description: 'Warranty in months', example: 24 })
  @IsOptional()
  @IsInt()
  @Min(0)
  warrantyMonths?: number;

  @ApiPropertyOptional({ description: 'Expected service life in KM', example: 120000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  expectedServiceLife?: number;

  @ApiPropertyOptional({ description: 'Supplier ID (FK)' })
  @IsOptional()
  @IsInt()
  supplierId?: number;

  @ApiPropertyOptional({ description: 'Original tread depth in mm', example: 18.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  originalTreadDepth?: number;

  @ApiPropertyOptional({ description: 'Minimum tread depth before replacement in mm', example: 3.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumTreadDepth?: number;

  @ApiPropertyOptional({ description: 'Initial inflation pressure in PSI', example: 120 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  initialPressure?: number;

  @ApiPropertyOptional({ description: 'Casing condition assessment', example: 'Good' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  casingCondition?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateTyreDto {
  @ApiPropertyOptional({ description: 'Manufacturer serial number' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  serialNumber?: string;

  @ApiPropertyOptional({ description: 'Tyre brand' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @ApiPropertyOptional({ description: 'Tyre model name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @ApiPropertyOptional({ description: 'Tyre size designation' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  size?: string;

  @ApiPropertyOptional({ description: 'Tyre type', enum: TyreType })
  @IsOptional()
  @IsEnum(TyreType)
  tyreType?: TyreType;

  @ApiPropertyOptional({ description: 'Construction' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  construction?: string;

  @ApiPropertyOptional({ description: 'Manufacturer' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  manufacturer?: string;

  @ApiPropertyOptional({ description: 'Load index' })
  @IsOptional()
  @IsInt()
  @Min(0)
  loadIndex?: number;

  @ApiPropertyOptional({ description: 'Speed rating code' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  speedRating?: string;

  @ApiPropertyOptional({ description: 'Tread pattern name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  pattern?: string;

  @ApiPropertyOptional({ description: 'Ply rating' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  plyRating?: string;

  @ApiPropertyOptional({ description: 'DOT manufacturing code' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  dotCode?: string;

  @ApiPropertyOptional({ description: 'Purchase date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @ApiPropertyOptional({ description: 'Purchase cost' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  purchaseCost?: number;

  @ApiPropertyOptional({ description: 'Purchase order reference number' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  purchaseOrderNumber?: string;

  @ApiPropertyOptional({ description: 'Supplier ID (FK)' })
  @IsOptional()
  @IsInt()
  supplierId?: number;

  @ApiPropertyOptional({ description: 'Current status', enum: TyreStatus })
  @IsOptional()
  @IsEnum(TyreStatus)
  currentStatus?: TyreStatus;

  @ApiPropertyOptional({ description: 'Original tread depth in mm' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  originalTreadDepth?: number;

  @ApiPropertyOptional({ description: 'Current tread depth in mm' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentTreadDepth?: number;

  @ApiPropertyOptional({ description: 'Minimum tread depth before replacement in mm' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumTreadDepth?: number;

  @ApiPropertyOptional({ description: 'Active flag' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
