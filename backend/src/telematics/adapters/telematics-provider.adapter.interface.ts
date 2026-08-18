import { IntegrationProvider } from '@prisma/client';

export interface TelemetryNormalizationInput {
  externalVehicleId: string;
  serialNumber?: string;
  providerEventId?: string;
  occurredAt: Date;
  rawPayload: Record<string, any>;
}

export interface TelemetryNormalizationOutput {
  externalVehicleId: string;
  serialNumber?: string;
  providerEventId?: string;
  occurredAt: Date;
  latitude?: number;
  longitude?: number;
  speedKmh?: number;
  odometerKm?: number;
  engineHours?: number;
  ignitionStatus?: boolean;
  fuelLevelPercent?: number;
  fuelRateLph?: number;
  heading?: number;
  tripDistanceKm?: number;
  qualityStatus: 'VALID' | 'INVALID_COORDINATES' | 'OUT_OF_RANGE_ODOMETER' | 'STALE_GPS' | 'INSUFFICIENT_DATA';
  qualityReason?: string;
}

export interface TelematicsProviderAdapter {
  provider: IntegrationProvider;
  validateConnection(credentials?: string | Record<string, any>): Promise<{ ok: boolean; message?: string }>;
  healthCheck(credentials?: string | Record<string, any>): Promise<{ status: string; latencyMs: number }>;
  normalizePayload(input: TelemetryNormalizationInput): TelemetryNormalizationOutput[];
}
