import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeatureStatus } from '@prisma/client';

export class CreateFeatureDto {
  @ApiProperty() @IsString() featureCode: string;
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(FeatureStatus) status?: FeatureStatus;
  @ApiPropertyOptional() @IsOptional() @IsNumber() displayOrder?: number;
}

export class UpdateFeatureDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(FeatureStatus) status?: FeatureStatus;
  @ApiPropertyOptional() @IsOptional() @IsNumber() displayOrder?: number;
}

export class CreatePlanEntitlementDto {
  @ApiProperty() @IsString() planVersionId: string;
  @ApiProperty() @IsString() featureId: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() enabled?: boolean;
}

export class UpdatePlanEntitlementDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() enabled?: boolean;
}
