import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsObject,
  IsNumber,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import {
  IntegrationProvider,
  IntegrationConnectionStatus,
  ExternalIdentityStatus,
  ExternalDeviceStatus,
  TelemetryQualityStatus,
} from '@prisma/client';

export class CreateIntegrationConnectionDto {
  @IsEnum(IntegrationProvider)
  provider: IntegrationProvider;

  @IsString()
  @IsNotEmpty()
  connectionName: string;

  @IsOptional()
  @IsObject()
  credentials?: Record<string, any>;

  @IsOptional()
  @IsString()
  credentialReference?: string;
}

export class UpdateIntegrationConnectionDto {
  @IsOptional()
  @IsString()
  connectionName?: string;

  @IsOptional()
  @IsEnum(IntegrationConnectionStatus)
  status?: IntegrationConnectionStatus;

  @IsOptional()
  @IsObject()
  credentials?: Record<string, any>;

  @IsOptional()
  @IsString()
  credentialReference?: string;
}

export class MapExternalIdentityDto {
  @IsString()
  @IsNotEmpty()
  integrationConnectionId: string;

  @IsString()
  @IsNotEmpty()
  externalVehicleId: string;

  @IsOptional()
  @IsString()
  externalRegistration?: string;

  @IsOptional()
  @IsString()
  externalVin?: string;

  @IsOptional()
  @IsEnum(ExternalIdentityStatus)
  status?: ExternalIdentityStatus;
}

export class RegisterExternalDeviceDto {
  @IsString()
  @IsNotEmpty()
  integrationConnectionId: string;

  @IsString()
  @IsNotEmpty()
  serialNumber: string;

  @IsOptional()
  @IsString()
  deviceType?: string;

  @IsOptional()
  @IsString()
  imei?: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsEnum(ExternalDeviceStatus)
  status?: ExternalDeviceStatus;
}

export class AssignDeviceToVehicleDto {
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsString()
  @IsNotEmpty()
  vehicleId: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class IngestGenericTelemetryDto {
  @IsString()
  @IsNotEmpty()
  integrationConnectionId: string;

  @IsString()
  @IsNotEmpty()
  externalVehicleId: string;

  @IsOptional()
  @IsString()
  providerEventId?: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsDateString()
  occurredAt: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  speedKmh?: number;

  @IsOptional()
  @IsNumber()
  odometerKm?: number;

  @IsOptional()
  @IsNumber()
  engineHours?: number;

  @IsOptional()
  @IsBoolean()
  ignitionStatus?: boolean;

  @IsOptional()
  @IsNumber()
  fuelLevelPercent?: number;

  @IsOptional()
  @IsNumber()
  fuelRateLph?: number;

  @IsOptional()
  @IsNumber()
  heading?: number;

  @IsOptional()
  @IsNumber()
  tripDistanceKm?: number;
}
