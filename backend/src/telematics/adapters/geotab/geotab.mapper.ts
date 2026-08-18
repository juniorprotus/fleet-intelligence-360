import { Injectable } from '@nestjs/common';
import { GeotabDevice, GeotabLogRecord, GeotabStatusData } from './geotab.types';
import { TelemetryNormalizationOutput } from '../telematics-provider.adapter.interface';

// Well-known Geotab diagnostic IDs
export const DIAGNOSTIC_ODOMETER_ID = 'DiagnosticOdometerId';
export const DIAGNOSTIC_ENGINE_HOURS_ID = 'DiagnosticEngineHoursId';
export const DIAGNOSTIC_FUEL_LEVEL_ID = 'DiagnosticFuelLevelId';

export interface CandidateMatchResult {
  geotabDeviceId: string;
  serialNumber?: string;
  vin?: string;
  registrationNumber?: string;
  candidateVehicleId?: string;
  matchStatus: 'MATCHED_EXISTING' | 'MATCHED_VIN' | 'MATCHED_REGISTRATION' | 'MANUAL_REVIEW' | 'UNMAPPED';
  confidenceScore: number;
}

@Injectable()
export class GeotabMapper {
  /**
   * Odometer Unit Conversion: meters -> km (meters / 1000)
   * 1000 -> 1, 100000 -> 100
   */
  convertOdometerMetersToKm(meters?: number | null): number | null {
    if (meters === undefined || meters === null || isNaN(meters)) return null;
    return meters / 1000;
  }

  /**
   * Engine Hours Unit Conversion: seconds -> hours (seconds / 3600)
   * 3600 -> 1, 7200 -> 2
   */
  convertEngineHoursSecondsToHours(seconds?: number | null): number | null {
    if (seconds === undefined || seconds === null || isNaN(seconds)) return null;
    return seconds / 3600;
  }

  /**
   * Fuel Level Normalization: 0-1 range to 0-100% OR retained if already 0-100%
   * Missing remains null (never converted to 0)
   */
  normalizeFuelLevel(rawFuel?: number | null): number | null {
    if (rawFuel === undefined || rawFuel === null || isNaN(rawFuel)) return null;
    if (rawFuel >= 0 && rawFuel <= 1.0) {
      return rawFuel * 100;
    }
    if (rawFuel > 1.0 && rawFuel <= 100.0) {
      return rawFuel;
    }
    return null;
  }

  /**
   * Normalizes Geotab LogRecord & StatusData items into canonical TelemetryNormalizationOutput
   */
  normalizeGeotabTelemetry(
    logRecord?: GeotabLogRecord,
    statusItems?: GeotabStatusData[],
    externalVehicleId?: string,
    serialNumber?: string,
  ): TelemetryNormalizationOutput {
    const extId = externalVehicleId || logRecord?.device?.id || 'UNKNOWN';
    const occurredAt = logRecord ? new Date(logRecord.dateTime) : new Date();

    let lat = logRecord?.latitude;
    let lng = logRecord?.longitude;
    let speed = logRecord?.speed;

    let odoKm: number | null = null;
    let engineHours: number | null = null;
    let fuelPercent: number | null = null;

    if (statusItems && Array.isArray(statusItems)) {
      for (const item of statusItems) {
        const diagId = item.diagnostic?.id;
        if (diagId === DIAGNOSTIC_ODOMETER_ID) {
          odoKm = this.convertOdometerMetersToKm(item.data);
        } else if (diagId === DIAGNOSTIC_ENGINE_HOURS_ID) {
          engineHours = this.convertEngineHoursSecondsToHours(item.data);
        } else if (diagId === DIAGNOSTIC_FUEL_LEVEL_ID) {
          fuelPercent = this.normalizeFuelLevel(item.data);
        }
      }
    }

    let qualityStatus: 'VALID' | 'INVALID_COORDINATES' | 'OUT_OF_RANGE_ODOMETER' | 'STALE_GPS' | 'INSUFFICIENT_DATA' = 'VALID';
    let qualityReason: string | undefined = undefined;

    if (lat !== undefined && lng !== undefined) {
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        qualityStatus = 'INVALID_COORDINATES';
        qualityReason = `Latitude (${lat}) or Longitude (${lng}) out of valid range`;
      }
    }

    if (odoKm !== null && odoKm < 0) {
      qualityStatus = 'OUT_OF_RANGE_ODOMETER';
      qualityReason = `Odometer value (${odoKm} km) cannot be negative`;
    }

    return {
      externalVehicleId: extId,
      serialNumber,
      providerEventId: logRecord?.id || `gtb_${extId}_${occurredAt.getTime()}`,
      occurredAt,
      latitude: lat,
      longitude: lng,
      speedKmh: speed,
      odometerKm: odoKm ?? undefined,
      engineHours: engineHours ?? undefined,
      fuelLevelPercent: fuelPercent ?? undefined,
      qualityStatus,
      qualityReason,
    };
  }

  /**
   * Performs non-mutating Candidate Matching between Geotab Devices and FI360 Vehicles
   */
  matchDeviceToCandidates(
    device: GeotabDevice,
    existingVehicles: Array<{ id: string; vin?: string | null; registrationNumber: string }>,
    existingMappings: Array<{ externalVehicleId: string; vehicleId: string }>,
  ): CandidateMatchResult {
    // 1. Existing explicit mapping match
    const mapped = existingMappings.find((m) => m.externalVehicleId === device.id);
    if (mapped) {
      return {
        geotabDeviceId: device.id,
        serialNumber: device.serialNumber,
        vin: device.vin,
        registrationNumber: device.licensePlate,
        candidateVehicleId: mapped.vehicleId,
        matchStatus: 'MATCHED_EXISTING',
        confidenceScore: 1.0,
      };
    }

    // 2. Exact VIN match
    if (device.vin) {
      const cleanVin = device.vin.trim().toUpperCase();
      const vinMatches = existingVehicles.filter((v) => v.vin && v.vin.trim().toUpperCase() === cleanVin);
      if (vinMatches.length === 1) {
        return {
          geotabDeviceId: device.id,
          serialNumber: device.serialNumber,
          vin: device.vin,
          registrationNumber: device.licensePlate,
          candidateVehicleId: vinMatches[0].id,
          matchStatus: 'MATCHED_VIN',
          confidenceScore: 0.95,
        };
      } else if (vinMatches.length > 1) {
        return {
          geotabDeviceId: device.id,
          serialNumber: device.serialNumber,
          vin: device.vin,
          registrationNumber: device.licensePlate,
          candidateVehicleId: undefined,
          matchStatus: 'MANUAL_REVIEW',
          confidenceScore: 0.5,
        };
      }
    }

    // 3. Exact Registration match
    if (device.licensePlate) {
      const cleanPlate = device.licensePlate.trim().toUpperCase();
      const plateMatches = existingVehicles.filter(
        (v) => v.registrationNumber && v.registrationNumber.trim().toUpperCase() === cleanPlate,
      );
      if (plateMatches.length === 1) {
        return {
          geotabDeviceId: device.id,
          serialNumber: device.serialNumber,
          vin: device.vin,
          registrationNumber: device.licensePlate,
          candidateVehicleId: plateMatches[0].id,
          matchStatus: 'MATCHED_REGISTRATION',
          confidenceScore: 0.9,
        };
      } else if (plateMatches.length > 1) {
        return {
          geotabDeviceId: device.id,
          serialNumber: device.serialNumber,
          vin: device.vin,
          registrationNumber: device.licensePlate,
          candidateVehicleId: undefined,
          matchStatus: 'MANUAL_REVIEW',
          confidenceScore: 0.5,
        };
      }
    }

    // 4. Unmapped
    return {
      geotabDeviceId: device.id,
      serialNumber: device.serialNumber,
      vin: device.vin,
      registrationNumber: device.licensePlate,
      candidateVehicleId: undefined,
      matchStatus: 'UNMAPPED',
      confidenceScore: 0.0,
    };
  }
}
