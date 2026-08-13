import { IsString, IsOptional, IsEnum, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlertType, AlertSeverity, AlertStatus } from '@prisma/client';

export class CreateAlertDto {
  @ApiProperty({ enum: AlertType })
  @IsEnum(AlertType)
  alertType: AlertType;

  @ApiPropertyOptional({ enum: AlertSeverity })
  @IsOptional()
  @IsEnum(AlertSeverity)
  severity?: AlertSeverity;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  tyreId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  positionId?: number;

  @ApiProperty({ example: 'Tread depth critically low (2.1 mm)' })
  @IsString()
  message: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  detail?: string;

  @ApiPropertyOptional({ example: 'Schedule tyre replacement immediately' })
  @IsOptional()
  @IsString()
  recommendedAction?: string;

  @ApiPropertyOptional({ example: 95 })
  @IsOptional()
  @IsInt()
  riskScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  dueDate?: Date | string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  workshopId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  depot?: string;

  @ApiPropertyOptional({ enum: AlertStatus })
  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus;
}

export class AcknowledgeAlertDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class ResolveAlertDto {
  @ApiProperty({ example: 'Tyre replaced on vehicle' })
  @IsString()
  resolutionNote: string;
}
