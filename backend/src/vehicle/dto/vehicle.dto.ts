import {
  IsString, IsOptional, IsEnum, IsDateString, IsInt, IsBoolean, MaxLength
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleStatus } from '@prisma/client';

export class CreateVehicleDto {
  @ApiProperty({ example: 'KDA123A' })
  @IsString()
  @MaxLength(30)
  registrationNumber: string;

  @ApiPropertyOptional({ example: 'FLT-001' })
  @IsOptional()
  @IsString()
  fleetNumber?: string;

  @ApiPropertyOptional({ example: 'Heavy Truck' })
  @IsOptional()
  @IsString()
  vehicleClass?: string;

  @ApiPropertyOptional({ example: 'Scania' })
  @IsOptional()
  @IsString()
  make?: string;

  @ApiPropertyOptional({ example: 'R560' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: 'Nairobi Depot' })
  @IsOptional()
  @IsString()
  depot?: string;

  @ApiPropertyOptional({ example: 'Nairobi' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ example: 'Operations' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: 10, description: 'Total expected tyres / capacity for this vehicle' })
  @IsOptional()
  @IsInt()
  expectedTyres?: number;

  @ApiPropertyOptional({ enum: VehicleStatus, example: 'ACTIVE' })
  @IsOptional()
  @IsEnum(VehicleStatus)
  vehicleStatus?: VehicleStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  currentOdometer?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  acquisitionDate?: string;
}

export class UpdateVehicleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fleetNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vehicleClass?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  make?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  depot?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ enum: VehicleStatus })
  @IsOptional()
  @IsEnum(VehicleStatus)
  vehicleStatus?: VehicleStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  currentOdometer?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  disposalDate?: string;
}
