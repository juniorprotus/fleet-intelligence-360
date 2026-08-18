import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { IntegrationProvider } from '@prisma/client';
import {
  TelematicsProviderAdapter,
  TelemetryNormalizationInput,
  TelemetryNormalizationOutput,
} from '../telematics-provider.adapter.interface';
import { GeotabSessionManager } from './geotab.session';
import { GeotabMapper, CandidateMatchResult } from './geotab.mapper';
import { GeotabCredentials, GeotabDevice, GeotabLogRecord, GeotabStatusData } from './geotab.types';
import { CryptoService } from '../../../crypto/crypto.service';

@Injectable()
export class GeotabProviderAdapter implements TelematicsProviderAdapter {
  private readonly logger = new Logger(GeotabProviderAdapter.name);
  public readonly provider = IntegrationProvider.GEOTAB;

  constructor(
    private readonly sessionManager: GeotabSessionManager,
    private readonly mapper: GeotabMapper,
    private readonly cryptoService: CryptoService,
  ) {}

  /**
   * Helper: Parse & Decrypt raw credentials into GeotabCredentials in memory.
   */
  private parseCredentials(credentials?: string | Record<string, any>): GeotabCredentials {
    if (!credentials) {
      throw new InternalServerErrorException('Geotab credentials missing');
    }
    if (typeof credentials === 'string') {
      if (credentials.startsWith('v1:')) {
        return this.cryptoService.decryptJson<GeotabCredentials>(credentials);
      }
      try {
        const decoded = Buffer.from(credentials, 'base64').toString('utf8');
        return JSON.parse(decoded);
      } catch (e) {
        throw new InternalServerErrorException('Invalid credentials format');
      }
    }
    return credentials as GeotabCredentials;
  }

  async validateConnection(credentials?: string | Record<string, any>): Promise<{ ok: boolean; message?: string }> {
    const creds = this.parseCredentials(credentials);
    this.sessionManager.validateSandboxGuard(creds);

    const session = await this.sessionManager.getOrAuthenticateSession('temp_val', creds);
    if (!session || !session.sessionId) {
      return { ok: false, message: 'Authentication failed' };
    }
    return { ok: true, message: `Connected cleanly to Geotab Sandbox database '${session.database}'` };
  }

  async healthCheck(credentials?: string | Record<string, any>): Promise<{ status: string; latencyMs: number }> {
    const startTime = Date.now();
    try {
      const result = await this.validateConnection(credentials);
      const latencyMs = Date.now() - startTime;
      return {
        status: result.ok ? 'CONNECTED' : 'FAILED',
        latencyMs,
      };
    } catch (error: any) {
      this.logger.error(`Geotab healthCheck failed: ${error.message}`);
      return {
        status: 'FAILED',
        latencyMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Discovers Geotab Devices & calculates candidate matches against existing FI360 Vehicles.
   * Does NOT auto-create Vehicles or alter identity mappings.
   */
  async discoverGeotabAssets(
    credentials: string | Record<string, any>,
    connectionId: string,
    existingVehicles: Array<{ id: string; vin?: string | null; registrationNumber: string }>,
    existingMappings: Array<{ externalVehicleId: string; vehicleId: string }>,
  ): Promise<{ devices: GeotabDevice[]; candidates: CandidateMatchResult[] }> {
    const creds = this.parseCredentials(credentials);
    await this.sessionManager.getOrAuthenticateSession(connectionId, creds);

    // Mock/Sandbox Device Discovery
    const discoveredDevices: GeotabDevice[] = [
      {
        id: 'b1',
        name: 'Sandbox Vehicle 101',
        serialNumber: 'G9-001-SANDBOX',
        vin: '1G1N55SL2DA100101',
        licensePlate: 'KCA-0342X',
        deviceType: 'GO9',
        imei: '860123049100101',
      },
      {
        id: 'b2',
        name: 'Sandbox Truck 202',
        serialNumber: 'G9-002-SANDBOX',
        vin: '1NKHXL4X5JJ200202',
        licensePlate: 'KCF-9988Z',
        deviceType: 'GO9',
        imei: '860123049100202',
      },
    ];

    const candidates = discoveredDevices.map((device) =>
      this.mapper.matchDeviceToCandidates(device, existingVehicles, existingMappings),
    );

    return { devices: discoveredDevices, candidates };
  }

  /**
   * Fetches incremental Geotab feed (LogRecord & StatusData) using lastSyncCursor.
   */
  async fetchIncrementalFeed(
    credentials: string | Record<string, any>,
    connectionId: string,
    lastSyncCursor?: string,
  ): Promise<{ records: Array<{ logRecord?: GeotabLogRecord; statusItems?: GeotabStatusData[] }>; nextCursor: string }> {
    const creds = this.parseCredentials(credentials);
    await this.sessionManager.getOrAuthenticateSession(connectionId, creds);

    const currentCursor = lastSyncCursor || 'cursor_0';
    const nextCursor = `cursor_${Date.now()}`;

    // Sandbox feed records
    const records = [
      {
        logRecord: {
          id: `lr_${Date.now()}_1`,
          device: { id: 'b1' },
          dateTime: new Date().toISOString(),
          latitude: -1.2921,
          longitude: 36.8219,
          speed: 65.4,
        },
        statusItems: [
          { dateTime: new Date().toISOString(), device: { id: 'b1' }, diagnostic: { id: 'DiagnosticOdometerId' }, data: 128950000 }, // 128950 km
          { dateTime: new Date().toISOString(), device: { id: 'b1' }, diagnostic: { id: 'DiagnosticEngineHoursId' }, data: 18000000 }, // 5000 hrs
          { dateTime: new Date().toISOString(), device: { id: 'b1' }, diagnostic: { id: 'DiagnosticFuelLevelId' }, data: 0.75 }, // 75%
        ],
      },
    ];

    return { records, nextCursor };
  }

  normalizePayload(input: TelemetryNormalizationInput): TelemetryNormalizationOutput[] {
    const raw = input.rawPayload || {};
    const logRecord: GeotabLogRecord | undefined = raw.logRecord;
    const statusItems: GeotabStatusData[] | undefined = raw.statusItems;

    const normalized = this.mapper.normalizeGeotabTelemetry(
      logRecord,
      statusItems,
      input.externalVehicleId,
      input.serialNumber,
    );

    return [normalized];
  }
}
