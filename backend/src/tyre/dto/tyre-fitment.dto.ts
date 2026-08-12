import {
  IsString,
  IsOptional,
  IsInt,
  IsDateString,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTyreFitmentDto {
  @ApiPropertyOptional({ description: 'Tyre ID' })
  @IsOptional()
  @IsInt()
  tyreId?: number;

  @ApiPropertyOptional({ description: 'Tyre barcode / identifier string' })
  @IsOptional()
  @IsString()
  tyreIdentifier?: string;

  @ApiProperty({ description: 'Vehicle ID (from Fleet module)', example: 'VEH-001' })
  @IsString()
  @MaxLength(50)
  vehicleId: string;

  @ApiProperty({ description: 'Axle position code (numeric)', example: 1 })
  @IsInt()
  @Min(1)
  positionId: number;

  @ApiPropertyOptional({ description: 'Position code (e.g. AX1-L, AX2-R-OUT)', example: 'AX1-L' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  positionCode?: string;

  @ApiPropertyOptional({ description: 'Axle number (1, 2, 3...)', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  axle?: number;

  @ApiPropertyOptional({ description: 'Side ("L" or "R")', example: 'L' })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  side?: string;

  @ApiPropertyOptional({ description: 'Inner/Outer designation ("INNER", "OUTER")', example: 'OUTER' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  innerOuter?: string;

  @ApiProperty({ description: 'Fitment date (ISO 8601)' })
  @IsDateString()
  fitmentDate: string;

  @ApiPropertyOptional({ description: 'Odometer at fitment' })
  @IsOptional()
  @IsInt()
  @Min(0)
  fitmentOdometer?: number;

  @ApiPropertyOptional({ description: 'Tread depth at fitment (mm)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fitmentTreadDepth?: number;

  @ApiPropertyOptional({ description: 'Person who fitted the tyre' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fittedBy?: string;

  @ApiPropertyOptional({ description: 'Supervisor verification status', example: 'VERIFIED' })
  @IsOptional()
  @IsString()
  verificationStatus?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RemoveTyreFitmentDto {
  @ApiProperty({ description: 'Removal date (ISO 8601)' })
  @IsDateString()
  removalDate: string;

  @ApiPropertyOptional({ description: 'Odometer at removal' })
  @IsOptional()
  @IsInt()
  @Min(0)
  removalOdometer?: number;

  @ApiPropertyOptional({ description: 'Tread depth at removal (mm)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  removalTreadDepth?: number;

  @ApiPropertyOptional({ description: 'Reason for removal' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  removalReason?: string;

  @ApiPropertyOptional({ description: 'Person who removed the tyre' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  removedBy?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class VerifyFitmentDto {
  @ApiProperty({ description: 'Verification decision: VERIFIED or REJECTED', example: 'VERIFIED' })
  @IsString()
  status: 'VERIFIED' | 'REJECTED';

  @ApiPropertyOptional({ description: 'Supervisor notes or rejection reason' })
  @IsOptional()
  @IsString()
  notes?: string;
}
