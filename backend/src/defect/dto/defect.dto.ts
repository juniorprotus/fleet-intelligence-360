import { IsString, IsOptional, IsEnum, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlertSeverity, DefectStatus } from '@prisma/client';

export class CreateDefectDto {
  @ApiProperty({ example: 'KDA123A' })
  @IsString()
  vehicleId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  tyreId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  positionId?: number;

  @ApiProperty({ example: 'Sidewall Bulge' })
  @IsString()
  defectType: string;

  @ApiPropertyOptional({ example: 'Visible bulge on outer sidewall after hitting curb' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: AlertSeverity })
  @IsOptional()
  @IsEnum(AlertSeverity)
  severity?: AlertSeverity;

  @ApiProperty({ example: 'technician@fi360.com' })
  @IsString()
  reportedBy: string;
}

export class UpdateDefectStatusDto {
  @ApiProperty({ enum: DefectStatus })
  @IsEnum(DefectStatus)
  status: DefectStatus;

  @ApiPropertyOptional({ example: 'john.technician' })
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiPropertyOptional({ example: 'Replaced tyre with spare' })
  @IsOptional()
  @IsString()
  resolutionNote?: string;
}
