import { Injectable, Logger } from '@nestjs/common';
import { IntegrationProvider } from '@prisma/client';
import {
  TelematicsProviderAdapter,
  TelemetryNormalizationInput,
  TelemetryNormalizationOutput,
} from './telematics-provider.adapter.interface';

@Injectable()
export class GenericProviderAdapter implements TelematicsProviderAdapter {
  private readonly logger = new Logger(GenericProviderAdapter.name);
  public readonly provider = IntegrationProvider.GENERIC;

  async validateConnection(credentials?: string | Record<string, any>): Promise<{ ok: boolean; message?: string }> {
    return { ok: true, message: 'Generic provider connection validated' };
  }

  async healthCheck(credentials?: string | Record<string, any>): Promise<{ status: string; latencyMs: number }> {
    return { status: 'CONNECTED', latencyMs: 15 };
  }

  normalizePayload(input: TelemetryNormalizationInput): TelemetryNormalizationOutput[] {
    const raw = input.rawPayload || {};
    const lat = typeof raw.latitude === 'number' ? raw.latitude : undefined;
    const lng = typeof raw.longitude === 'number' ? raw.longitude : undefined;
    const speed = typeof raw.speedKmh === 'number' ? raw.speedKmh : typeof raw.speed === 'number' ? raw.speed : undefined;
    const odo = typeof raw.odometerKm === 'number' ? raw.odometerKm : typeof raw.odometer === 'number' ? raw.odometer : undefined;
    const engHours = typeof raw.engineHours === 'number' ? raw.engineHours : undefined;
    const ignition = typeof raw.ignitionStatus === 'boolean' ? raw.ignitionStatus : undefined;
    const fuelLvl = typeof raw.fuelLevelPercent === 'number' ? raw.fuelLevelPercent : undefined;
    const fuelRate = typeof raw.fuelRateLph === 'number' ? raw.fuelRateLph : undefined;
    const heading = typeof raw.heading === 'number' ? raw.heading : undefined;
    const tripDist = typeof raw.tripDistanceKm === 'number' ? raw.tripDistanceKm : undefined;

    let qualityStatus: 'VALID' | 'INVALID_COORDINATES' | 'OUT_OF_RANGE_ODOMETER' | 'STALE_GPS' | 'INSUFFICIENT_DATA' = 'VALID';
    let qualityReason: string | undefined = undefined;

    if (lat !== undefined && lng !== undefined) {
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        qualityStatus = 'INVALID_COORDINATES';
        qualityReason = `Latitude (${lat}) or Longitude (${lng}) out of valid range`;
      }
    }

    if (odo !== undefined && odo < 0) {
      qualityStatus = 'OUT_OF_RANGE_ODOMETER';
      qualityReason = `Odometer value (${odo}) cannot be negative`;
    }

    return [
      {
        externalVehicleId: input.externalVehicleId,
        serialNumber: input.serialNumber,
        providerEventId: input.providerEventId,
        occurredAt: input.occurredAt,
        latitude: lat,
        longitude: lng,
        speedKmh: speed,
        odometerKm: odo,
        engineHours: engHours,
        ignitionStatus: ignition,
        fuelLevelPercent: fuelLvl,
        fuelRateLph: fuelRate,
        heading,
        tripDistanceKm: tripDist,
        qualityStatus,
        qualityReason,
      },
    ];
  }
}
