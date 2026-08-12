import {
  IsInt,
  IsOptional,
  IsDateString,
  IsNumber,
  IsEnum,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TyreCondition } from '@prisma/client';

export class CreateTyreInspectionDto {
  @ApiPropertyOptional({ description: 'Numeric Tyre ID' })
  @IsOptional()
  @IsInt()
  tyreId?: number;

  @ApiPropertyOptional({ description: 'Tyre barcode / serial string' })
  @IsOptional()
  @IsString()
  tyreIdentifier?: string;

  @ApiProperty({ description: 'Inspection date (ISO 8601)' })
  @IsDateString()
  inspectionDate: string;

  @ApiPropertyOptional({ description: 'Vehicle ID (if fitted)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  vehicleId?: string;

  @ApiPropertyOptional({ description: 'Axle position (if fitted)' })
  @IsOptional()
  @IsInt()
  positionId?: number;

  @ApiPropertyOptional({ description: 'Odometer reading' })
  @IsOptional()
  @IsInt()
  @Min(0)
  odometer?: number;

  @ApiPropertyOptional({ description: 'Tread depth left (mm)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  treadDepthLeft?: number;

  @ApiPropertyOptional({ description: 'Tread depth center (mm)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  treadDepthCenter?: number;

  @ApiPropertyOptional({ description: 'Tread depth right (mm)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  treadDepthRight?: number;

  @ApiPropertyOptional({ description: 'Average tread depth (mm)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  averageTreadDepth?: number;

  @ApiPropertyOptional({ description: 'Tyre pressure (bar/psi)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pressure?: number;

  @ApiPropertyOptional({ description: 'Overall tyre condition', enum: TyreCondition })
  @IsOptional()
  @IsEnum(TyreCondition)
  condition?: TyreCondition;

  @ApiPropertyOptional({ description: 'Type of damage if any' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  damageType?: string;

  @ApiPropertyOptional({ description: 'Description of damage' })
  @IsOptional()
  @IsString()
  damageDescription?: string;

  @ApiPropertyOptional({ description: 'Inspection recommendation' })
  @IsOptional()
  @IsString()
  recommendation?: string;

  @ApiPropertyOptional({ description: 'Person who performed the inspection' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  inspectedBy?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
