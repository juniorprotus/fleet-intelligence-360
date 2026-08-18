import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DataScopeContext } from '../auth/data-scope.service';
import { EventPublisherService } from '../events/event-publisher.service';
import { AuditService } from '../audit/audit.service';
import { GenericProviderAdapter } from './adapters/generic-provider.adapter';
import {
  CreateIntegrationConnectionDto,
  UpdateIntegrationConnectionDto,
  MapExternalIdentityDto,
  RegisterExternalDeviceDto,
  AssignDeviceToVehicleDto,
  IngestGenericTelemetryDto,
} from './dto/integration.dto';
import {
  IntegrationProvider,
  IntegrationConnectionStatus,
  ExternalIdentityStatus,
  ExternalDeviceStatus,
  TelemetryProcessingStatus,
  TelemetryQualityStatus,
} from '@prisma/client';

import { CryptoService } from '../crypto/crypto.service';
import { GeotabProviderAdapter } from './adapters/geotab/geotab-provider.adapter';

@Injectable()
export class TelematicsService {
  private readonly logger = new Logger(TelematicsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: EventPublisherService,
    private readonly auditService: AuditService,
    private readonly genericAdapter: GenericProviderAdapter,
    private readonly cryptoService: CryptoService,
    private readonly geotabAdapter: GeotabProviderAdapter,
  ) {}

  /**
   * Helper: Mask encrypted credentials string so secrets are never returned in responses
   */
  private maskConnectionSecrets(conn: any) {
    if (!conn) return conn;
    const copy = { ...conn };
    if (copy.encryptedCredentials) {
      copy.encryptedCredentials = '[ENCRYPTED_SECRET_CONFIGURED]';
    }
    return copy;
  }

  // ─────────────────────────────────────────────────────────────
  // 5E.1 INTEGRATION CONNECTION MANAGEMENT
  // ─────────────────────────────────────────────────────────────

  async createConnection(
    dto: CreateIntegrationConnectionDto,
    userId?: string,
    scopeCtx?: DataScopeContext,
  ) {
    const tenantId = scopeCtx?.tenantId;
    const organizationId = scopeCtx?.organizationId;

    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required for Integration Connection creation');
    }

    const encryptedCredentials = dto.credentials
      ? this.cryptoService.encryptJson(dto.credentials)
      : undefined;

    const connection = await this.prisma.integrationConnection.create({
      data: {
        tenantId,
        organizationId,
        provider: dto.provider,
        connectionName: dto.connectionName,
        status: IntegrationConnectionStatus.NOT_CONNECTED,
        credentialReference: dto.credentialReference,
        encryptedCredentials,
        createdBy: userId,
      },
    });

    await this.auditService.logAction({
      module: 'TELEMATICS',
      action: 'INTEGRATION_CONNECTION_CREATE',
      entityType: 'IntegrationConnection',
      entityId: connection.id,
      userId,
      afterValue: {
        id: connection.id,
        tenantId: connection.tenantId,
        organizationId: connection.organizationId,
        provider: connection.provider,
        connectionName: connection.connectionName,
        status: connection.status,
      },
    });

    return this.maskConnectionSecrets(connection);
  }

  async findAllConnections(scopeCtx: DataScopeContext) {
    const connections = await this.prisma.integrationConnection.findMany({
      where: {
        tenantId: scopeCtx.tenantId,
        ...(scopeCtx.organizationId && { organizationId: scopeCtx.organizationId }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return connections.map((conn) => this.maskConnectionSecrets(conn));
  }

  async findConnectionOne(id: string, scopeCtx?: DataScopeContext) {
    const connection = await this.prisma.integrationConnection.findUnique({
      where: { id },
    });

    if (!connection) {
      throw new NotFoundException(`Integration connection with ID ${id} not found`);
    }

    if (scopeCtx?.tenantId && connection.tenantId !== scopeCtx.tenantId) {
      throw new ForbiddenException('Cross-tenant connection access denied');
    }

    return connection;
  }

  async updateConnection(
    id: string,
    dto: UpdateIntegrationConnectionDto,
    userId?: string,
    scopeCtx?: DataScopeContext,
  ) {
    const existing = await this.findConnectionOne(id, scopeCtx);

    const encryptedCredentials = dto.credentials
      ? this.cryptoService.encryptJson(dto.credentials)
      : undefined;

    const updated = await this.prisma.integrationConnection.update({
      where: { id },
      data: {
        ...(dto.connectionName && { connectionName: dto.connectionName }),
        ...(dto.status && { status: dto.status }),
        ...(dto.credentialReference && { credentialReference: dto.credentialReference }),
        ...(encryptedCredentials && { encryptedCredentials }),
        updatedBy: userId,
      },
    });

    await this.auditService.logAction({
      module: 'TELEMATICS',
      action: 'INTEGRATION_CONNECTION_UPDATE',
      entityType: 'IntegrationConnection',
      entityId: id,
      userId,
      beforeValue: { connectionName: existing.connectionName, status: existing.status },
      afterValue: { connectionName: updated.connectionName, status: updated.status },
    });

    return this.maskConnectionSecrets(updated);
  }

  async testConnection(id: string, scopeCtx?: DataScopeContext) {
    const connection = await this.findConnectionOne(id, scopeCtx);

    let health: { status: string; latencyMs: number } = { status: 'CONNECTED', latencyMs: 12 };

    if (connection.provider === IntegrationProvider.GENERIC) {
      health = await this.genericAdapter.healthCheck(connection.encryptedCredentials);
    } else if (connection.provider === IntegrationProvider.GEOTAB) {
      health = await this.geotabAdapter.healthCheck(connection.encryptedCredentials);
    }

    const now = new Date();
    const updated = await this.prisma.integrationConnection.update({
      where: { id },
      data: {
        status: health.status === 'CONNECTED' ? IntegrationConnectionStatus.CONNECTED : IntegrationConnectionStatus.FAILED,
        lastSyncAt: now,
        lastSuccessfulSyncAt: health.status === 'CONNECTED' ? now : connection.lastSuccessfulSyncAt,
        lastFailedSyncAt: health.status !== 'CONNECTED' ? now : connection.lastFailedSyncAt,
      },
    });

    return {
      connectionId: id,
      provider: connection.provider,
      status: updated.status,
      latencyMs: health.latencyMs,
      testedAt: now,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 5E.2 EXTERNAL VEHICLE IDENTITY MAPPING
  // ─────────────────────────────────────────────────────────────

  async mapExternalIdentity(
    vehicleId: string,
    dto: MapExternalIdentityDto,
    userId?: string,
    scopeCtx?: DataScopeContext,
  ) {
    const tenantId = scopeCtx?.tenantId;
    const organizationId = scopeCtx?.organizationId;

    if (!tenantId || !organizationId) {
      throw new BadRequestException('Tenant ID and Organization ID required for External Identity mapping');
    }

    // Verify Vehicle exists & belongs to tenant
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, tenantId },
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle #${vehicleId} not found in tenant ${tenantId}.`);
    }

    // Verify IntegrationConnection exists & belongs to tenant
    const connection = await this.prisma.integrationConnection.findFirst({
      where: { id: dto.integrationConnectionId, tenantId },
    });
    if (!connection) {
      throw new NotFoundException(`Integration Connection #${dto.integrationConnectionId} not found.`);
    }

    // Check for existing mapping with (connectionId, externalVehicleId)
    const existing = await this.prisma.vehicleExternalIdentity.findUnique({
      where: {
        integrationConnectionId_externalVehicleId: {
          integrationConnectionId: dto.integrationConnectionId,
          externalVehicleId: dto.externalVehicleId,
        },
      },
    });

    let identity;
    if (existing) {
      identity = await this.prisma.vehicleExternalIdentity.update({
        where: { id: existing.id },
        data: {
          vehicleId,
          externalRegistration: dto.externalRegistration || existing.externalRegistration,
          externalVin: dto.externalVin || existing.externalVin,
          status: dto.status || ExternalIdentityStatus.MAPPED,
          lastSeenAt: new Date(),
          updatedBy: userId,
        },
      });
    } else {
      identity = await this.prisma.vehicleExternalIdentity.create({
        data: {
          tenantId,
          organizationId,
          integrationConnectionId: dto.integrationConnectionId,
          vehicleId,
          externalVehicleId: dto.externalVehicleId,
          externalRegistration: dto.externalRegistration,
          externalVin: dto.externalVin,
          status: dto.status || ExternalIdentityStatus.MAPPED,
          createdBy: userId,
        },
      });
    }

    await this.auditService.logAction({
      module: 'TELEMATICS',
      action: 'VEHICLE_EXTERNAL_IDENTITY_MAP',
      entityType: 'VehicleExternalIdentity',
      entityId: identity.id,
      userId,
      afterValue: {
        identityId: identity.id,
        vehicleId: identity.vehicleId,
        externalVehicleId: identity.externalVehicleId,
        provider: connection.provider,
        status: identity.status,
      },
    });

    return identity;
  }

  async listExternalIdentitiesForVehicle(vehicleId: string, scopeCtx: DataScopeContext) {
    return this.prisma.vehicleExternalIdentity.findMany({
      where: {
        vehicleId,
        tenantId: scopeCtx.tenantId,
      },
      include: {
        integrationConnection: {
          select: { id: true, provider: true, connectionName: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findCandidateMatches(externalVehicleId: string, vin?: string, registration?: string, scopeCtx?: DataScopeContext) {
    if (!scopeCtx?.tenantId) return { matchStatus: 'UNMAPPED', candidates: [] };

    // 1. Check exact VIN match
    if (vin) {
      const matchByVin = await this.prisma.vehicle.findFirst({
        where: { tenantId: scopeCtx.tenantId, vin: { equals: vin, mode: 'insensitive' } },
      });
      if (matchByVin) {
        return { matchStatus: 'MANUAL_REVIEW', matchReason: 'EXACT_VIN_MATCH', candidates: [matchByVin] };
      }
    }

    // 2. Check exact Registration match
    if (registration) {
      const matchByReg = await this.prisma.vehicle.findFirst({
        where: { tenantId: scopeCtx.tenantId, registrationNumber: { equals: registration, mode: 'insensitive' } },
      });
      if (matchByReg) {
        return { matchStatus: 'MANUAL_REVIEW', matchReason: 'EXACT_REGISTRATION_MATCH', candidates: [matchByReg] };
      }
    }

    return { matchStatus: 'UNMAPPED', candidates: [] };
  }

  // ─────────────────────────────────────────────────────────────
  // 5E.3 & 5E.4 EXTERNAL DEVICE & HISTORICAL ASSIGNMENTS
  // ─────────────────────────────────────────────────────────────

  async registerDevice(dto: RegisterExternalDeviceDto, userId?: string, scopeCtx?: DataScopeContext) {
    const tenantId = scopeCtx?.tenantId;
    const organizationId = scopeCtx?.organizationId;

    if (!tenantId || !organizationId) {
      throw new BadRequestException('Tenant ID and Organization ID required for Device Registration');
    }

    const connection = await this.prisma.integrationConnection.findFirst({
      where: { id: dto.integrationConnectionId, tenantId },
    });
    if (!connection) {
      throw new NotFoundException(`Integration Connection #${dto.integrationConnectionId} not found.`);
    }

    const device = await this.prisma.externalDevice.upsert({
      where: {
        integrationConnectionId_serialNumber: {
          integrationConnectionId: dto.integrationConnectionId,
          serialNumber: dto.serialNumber,
        },
      },
      update: {
        deviceType: dto.deviceType || 'GPS_TRACKER',
        imei: dto.imei,
        manufacturer: dto.manufacturer,
        model: dto.model,
        status: dto.status || ExternalDeviceStatus.ACTIVE,
      },
      create: {
        tenantId,
        organizationId,
        integrationConnectionId: dto.integrationConnectionId,
        deviceType: dto.deviceType || 'GPS_TRACKER',
        serialNumber: dto.serialNumber,
        imei: dto.imei,
        manufacturer: dto.manufacturer,
        model: dto.model,
        status: dto.status || ExternalDeviceStatus.ACTIVE,
      },
    });

    await this.auditService.logAction({
      module: 'TELEMATICS',
      action: 'EXTERNAL_DEVICE_REGISTER',
      entityType: 'ExternalDevice',
      entityId: device.id,
      userId,
      afterValue: {
        deviceId: device.id,
        serialNumber: device.serialNumber,
        deviceType: device.deviceType,
        status: device.status,
      },
    });

    return device;
  }

  async assignDeviceToVehicle(dto: AssignDeviceToVehicleDto, userId?: string, scopeCtx?: DataScopeContext) {
    const tenantId = scopeCtx?.tenantId;

    // Verify Device
    const device = await this.prisma.externalDevice.findFirst({
      where: { id: dto.deviceId, tenantId },
    });
    if (!device) {
      throw new NotFoundException(`Device #${dto.deviceId} not found.`);
    }

    // Verify Vehicle
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: dto.vehicleId, tenantId },
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle #${dto.vehicleId} not found.`);
    }

    const now = new Date();

    // End active assignment for device if exists (preserving history)
    await this.prisma.vehicleDeviceAssignmentHistory.updateMany({
      where: { deviceId: dto.deviceId, endedAt: null },
      data: { endedAt: now },
    });

    // Create new assignment ledger record
    const assignment = await this.prisma.vehicleDeviceAssignmentHistory.create({
      data: {
        deviceId: dto.deviceId,
        vehicleId: dto.vehicleId,
        startedAt: now,
        assignedBy: userId,
        reason: dto.reason || 'Device assigned to vehicle',
      },
    });

    await this.auditService.logAction({
      module: 'TELEMATICS',
      action: 'DEVICE_VEHICLE_ASSIGN',
      entityType: 'VehicleDeviceAssignmentHistory',
      entityId: String(assignment.id),
      userId,
      afterValue: {
        assignmentId: assignment.id,
        deviceId: dto.deviceId,
        vehicleId: dto.vehicleId,
        startedAt: assignment.startedAt,
      },
    });

    return assignment;
  }

  async listDevicesForVehicle(vehicleId: string, scopeCtx: DataScopeContext) {
    return this.prisma.vehicleDeviceAssignmentHistory.findMany({
      where: {
        vehicleId,
        device: { tenantId: scopeCtx.tenantId },
      },
      include: {
        device: {
          select: { id: true, serialNumber: true, deviceType: true, manufacturer: true, model: true, status: true },
        },
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 5E.5, 5E.6, 5E.7 & 5E.8 RAW INGESTION, NORMALIZATION & DOMAIN EVENTS
  // ─────────────────────────────────────────────────────────────

  async ingestTelemetry(
    connectionId: string,
    dto: IngestGenericTelemetryDto,
    userId?: string,
    scopeCtx?: DataScopeContext,
  ) {
    const tenantId = scopeCtx?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant ID required for Telemetry Ingestion');
    }

    const connection = await this.prisma.integrationConnection.findFirst({
      where: { id: connectionId, tenantId },
    });
    if (!connection) {
      throw new NotFoundException(`Integration Connection #${connectionId} not found.`);
    }

    // Lookup VehicleExternalIdentity mapping
    const identity = await this.prisma.vehicleExternalIdentity.findUnique({
      where: {
        integrationConnectionId_externalVehicleId: {
          integrationConnectionId: connectionId,
          externalVehicleId: dto.externalVehicleId,
        },
      },
    });

    const occurredAt = new Date(dto.occurredAt);

    // Idempotency check: providerEventId deduplication
    if (dto.providerEventId) {
      const existingPayload = await this.prisma.rawIntegrationPayload.findUnique({
        where: {
          integrationConnectionId_providerEventId: {
            integrationConnectionId: connectionId,
            providerEventId: dto.providerEventId,
          },
        },
        include: { normalizedTelemetry: true },
      });

      if (existingPayload) {
        this.logger.log(`Idempotent duplicate event ignored for providerEventId: ${dto.providerEventId}`);
        return {
          status: 'IDEMPOTENT_DUPLICATE_IGNORED',
          payloadId: existingPayload.id,
          normalizedTelemetry: existingPayload.normalizedTelemetry,
        };
      }
    }

    // Lookup device if serial number supplied
    let device;
    if (dto.serialNumber) {
      device = await this.prisma.externalDevice.findUnique({
        where: {
          integrationConnectionId_serialNumber: {
            integrationConnectionId: connectionId,
            serialNumber: dto.serialNumber,
          },
        },
      });
    }

    const rawPayloadJson = {
      externalVehicleId: dto.externalVehicleId,
      latitude: dto.latitude,
      longitude: dto.longitude,
      speedKmh: dto.speedKmh,
      odometerKm: dto.odometerKm,
      engineHours: dto.engineHours,
      ignitionStatus: dto.ignitionStatus,
      fuelLevelPercent: dto.fuelLevelPercent,
      fuelRateLph: dto.fuelRateLph,
      heading: dto.heading,
      tripDistanceKm: dto.tripDistanceKm,
    };

    // Unmapped External Identity handling: Quarantine payload
    if (!identity || identity.status !== ExternalIdentityStatus.MAPPED) {
      const rawPayload = await this.prisma.rawIntegrationPayload.create({
        data: {
          tenantId,
          organizationId: connection.organizationId || 'ORG-DEFAULT',
          integrationConnectionId: connectionId,
          deviceId: device?.id,
          provider: connection.provider,
          providerEventId: dto.providerEventId,
          eventType: 'telemetry.raw',
          occurredAt,
          payloadJson: rawPayloadJson,
          processingStatus: TelemetryProcessingStatus.QUARANTINED,
          processingError: `External Vehicle ID ${dto.externalVehicleId} is UNMAPPED to an FI360 Vehicle.id`,
        },
      });

      return {
        status: 'QUARANTINED_UNMAPPED_VEHICLE',
        payloadId: rawPayload.id,
        message: `External Vehicle ID ${dto.externalVehicleId} requires manual mapping in Vehicle Master.`,
      };
    }

    // Create Raw Payload
    const rawPayload = await this.prisma.rawIntegrationPayload.create({
      data: {
        tenantId,
        organizationId: identity.organizationId,
        integrationConnectionId: connectionId,
        deviceId: device?.id,
        provider: connection.provider,
        providerEventId: dto.providerEventId,
        eventType: 'telemetry.raw',
        occurredAt,
        payloadJson: rawPayloadJson,
        processingStatus: TelemetryProcessingStatus.RECEIVED,
      },
    });

    // Normalize Payload via GenericAdapter
    const normalizedOutputs = this.genericAdapter.normalizePayload({
      externalVehicleId: dto.externalVehicleId,
      serialNumber: dto.serialNumber,
      providerEventId: dto.providerEventId,
      occurredAt,
      rawPayload: rawPayloadJson,
    });

    const normalizedRecords: any[] = [];

    for (const norm of normalizedOutputs) {
      const normRec = await this.prisma.normalizedTelemetry.create({
        data: {
          rawPayloadId: rawPayload.id,
          tenantId,
          organizationId: identity.organizationId,
          integrationConnectionId: connectionId,
          vehicleId: identity.vehicleId,
          deviceId: device?.id,
          occurredAt: norm.occurredAt,
          latitude: norm.latitude,
          longitude: norm.longitude,
          speedKmh: norm.speedKmh,
          odometerKm: norm.odometerKm,
          engineHours: norm.engineHours,
          ignitionStatus: norm.ignitionStatus,
          fuelLevelPercent: norm.fuelLevelPercent,
          fuelRateLph: norm.fuelRateLph,
          heading: norm.heading,
          tripDistanceKm: norm.tripDistanceKm,
          qualityStatus: norm.qualityStatus as TelemetryQualityStatus,
          qualityReason: norm.qualityReason,
        },
      });
      normalizedRecords.push(normRec);

      // ─────────────────────────────────────────────────────────────
      // 5E.9 ODOMETER AUTHORITY & CONTROLLED UPDATE
      // ─────────────────────────────────────────────────────────────
      if (
        norm.qualityStatus === 'VALID' &&
        typeof norm.odometerKm === 'number' &&
        norm.odometerKm > 0
      ) {
        const vehicle = await this.prisma.vehicle.findUnique({
          where: { id: identity.vehicleId },
        });

        // Update Vehicle.currentOdometer only if valid and greater than current
        if (vehicle && (!vehicle.currentOdometer || norm.odometerKm >= vehicle.currentOdometer)) {
          await this.prisma.vehicle.update({
            where: { id: identity.vehicleId },
            data: { currentOdometer: norm.odometerKm },
          });
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 5E.8 EVENT PUBLISHER CANONICAL DOMAIN EVENTS
      // ─────────────────────────────────────────────────────────────
      if (norm.latitude !== undefined && norm.longitude !== undefined) {
        await this.eventPublisher.publish({
          eventType: 'telemetry.location.updated',
          entityId: identity.vehicleId,
          entityType: 'Vehicle',
          tenantId,
          organizationId: identity.organizationId,
          payload: {
            vehicleId: identity.vehicleId,
            latitude: norm.latitude,
            longitude: norm.longitude,
            speedKmh: norm.speedKmh,
            occurredAt: norm.occurredAt,
          },
        });
      }

      if (norm.odometerKm !== undefined) {
        await this.eventPublisher.publish({
          eventType: 'telemetry.odometer.updated',
          entityId: identity.vehicleId,
          entityType: 'Vehicle',
          tenantId,
          organizationId: identity.organizationId,
          payload: {
            vehicleId: identity.vehicleId,
            odometerKm: norm.odometerKm,
            occurredAt: norm.occurredAt,
          },
        });
      }

      if (norm.engineHours !== undefined) {
        await this.eventPublisher.publish({
          eventType: 'telemetry.engine_hours.updated',
          entityId: identity.vehicleId,
          entityType: 'Vehicle',
          tenantId,
          organizationId: identity.organizationId,
          payload: {
            vehicleId: identity.vehicleId,
            engineHours: norm.engineHours,
            occurredAt: norm.occurredAt,
          },
        });
      }

      if (norm.fuelLevelPercent !== undefined) {
        await this.eventPublisher.publish({
          eventType: 'telemetry.fuel_level.updated',
          entityId: identity.vehicleId,
          entityType: 'Vehicle',
          tenantId,
          organizationId: identity.organizationId,
          payload: {
            vehicleId: identity.vehicleId,
            fuelLevelPercent: norm.fuelLevelPercent,
            occurredAt: norm.occurredAt,
          },
        });
      }

      if (norm.speedKmh !== undefined && norm.speedKmh > 110) {
        await this.eventPublisher.publish({
          eventType: 'telemetry.overspeed.detected',
          entityId: identity.vehicleId,
          entityType: 'Vehicle',
          tenantId,
          organizationId: identity.organizationId,
          payload: {
            vehicleId: identity.vehicleId,
            speedKmh: norm.speedKmh,
            speedLimit: 100,
            occurredAt: norm.occurredAt,
          },
        });
      }
    }

    // Mark raw payload as PROCESSED
    await this.prisma.rawIntegrationPayload.update({
      where: { id: rawPayload.id },
      data: { processingStatus: TelemetryProcessingStatus.PROCESSED },
    });

    // Update Connection sync status & timestamps
    const now = new Date();
    await this.prisma.integrationConnection.update({
      where: { id: connectionId },
      data: {
        status: IntegrationConnectionStatus.CONNECTED,
        lastSyncAt: now,
        lastSuccessfulSyncAt: now,
      },
    });

    return {
      status: 'PROCESSED',
      rawPayloadId: rawPayload.id,
      recordsIngested: normalizedRecords.length,
      normalizedTelemetry: normalizedRecords,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 5E.10 VEHICLE TELEMATICS STATUS & SUMMARY API
  // ─────────────────────────────────────────────────────────────

  async getVehicleTelematicsStatus(vehicleId: string, scopeCtx: DataScopeContext) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, tenantId: scopeCtx.tenantId },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle #${vehicleId} not found.`);
    }

    // Fetch mapped external identities
    const externalIdentities = await this.prisma.vehicleExternalIdentity.findMany({
      where: { vehicleId },
      include: {
        integrationConnection: {
          select: { id: true, provider: true, connectionName: true, status: true, lastSyncAt: true },
        },
      },
    });

    // Fetch active device assignment
    const activeAssignment = await this.prisma.vehicleDeviceAssignmentHistory.findFirst({
      where: { vehicleId, endedAt: null },
      include: { device: true },
    });

    // Fetch latest normalized telemetry
    const latestTelemetry = await this.prisma.normalizedTelemetry.findFirst({
      where: { vehicleId },
      orderBy: { occurredAt: 'desc' },
    });

    const isConnected = externalIdentities.some(
      (id) => id.integrationConnection?.status === IntegrationConnectionStatus.CONNECTED,
    );

    let connectionStatus = 'NOT_CONNECTED';
    if (externalIdentities.length > 0) {
      if (isConnected && latestTelemetry) {
        connectionStatus = 'CONNECTED';
      } else if (externalIdentities.some((id) => id.status === ExternalIdentityStatus.MAPPED)) {
        connectionStatus = 'MAPPED_NO_LIVE_FEED';
      } else {
        connectionStatus = 'DISCONNECTED';
      }
    }

    return {
      vehicleId: vehicle.id,
      registrationNumber: vehicle.registrationNumber,
      connectionStatus,
      mappedIdentitiesCount: externalIdentities.length,
      externalIdentities: externalIdentities.map((ei) => ({
        identityId: ei.id,
        provider: ei.integrationConnection.provider,
        connectionName: ei.integrationConnection.connectionName,
        externalVehicleId: ei.externalVehicleId,
        mappingStatus: ei.status,
        connectionState: ei.integrationConnection.status,
        lastSyncAt: ei.integrationConnection.lastSyncAt,
      })),
      activeDevice: activeAssignment
        ? {
            deviceId: activeAssignment.device.id,
            serialNumber: activeAssignment.device.serialNumber,
            deviceType: activeAssignment.device.deviceType,
            manufacturer: activeAssignment.device.manufacturer,
            model: activeAssignment.device.model,
            assignedAt: activeAssignment.startedAt,
          }
        : null,
      latestMetrics: latestTelemetry
        ? {
            telemetryId: latestTelemetry.id,
            occurredAt: latestTelemetry.occurredAt,
            latitude: latestTelemetry.latitude,
            longitude: latestTelemetry.longitude,
            speedKmh: latestTelemetry.speedKmh,
            odometerKm: latestTelemetry.odometerKm,
            engineHours: latestTelemetry.engineHours,
            ignitionStatus: latestTelemetry.ignitionStatus,
            fuelLevelPercent: latestTelemetry.fuelLevelPercent,
            qualityStatus: latestTelemetry.qualityStatus,
          }
        : null,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 5E.1B GEOTAB DISCOVERY & INCREMENTAL SYNC
  // ─────────────────────────────────────────────────────────────

  async discoverGeotabAssets(connectionId: string, scopeCtx?: DataScopeContext) {
    const connection = await this.findConnectionOne(connectionId, scopeCtx);

    if (connection.provider !== IntegrationProvider.GEOTAB) {
      throw new BadRequestException(`Connection #${connectionId} is not a Geotab connection`);
    }

    if (!connection.encryptedCredentials) {
      throw new BadRequestException(`Connection #${connectionId} has no credentials configured`);
    }

    // Fetch existing Vehicles and Mappings for candidate matching
    const vehicles = await this.prisma.vehicle.findMany({
      where: { tenantId: connection.tenantId },
      select: { id: true, vin: true, registrationNumber: true },
    });

    const mappings = await this.prisma.vehicleExternalIdentity.findMany({
      where: { integrationConnectionId: connection.id },
      select: { externalVehicleId: true, vehicleId: true },
    });

    return this.geotabAdapter.discoverGeotabAssets(
      connection.encryptedCredentials,
      connection.id,
      vehicles,
      mappings,
    );
  }

  async syncGeotabIncremental(connectionId: string, scopeCtx?: DataScopeContext) {
    const connection = await this.findConnectionOne(connectionId, scopeCtx);

    if (connection.provider !== IntegrationProvider.GEOTAB) {
      throw new BadRequestException(`Connection #${connectionId} is not a Geotab connection`);
    }

    if (!connection.encryptedCredentials) {
      throw new BadRequestException(`Connection #${connectionId} has no credentials configured`);
    }

    // Fetch incremental feed using lastSyncCursor
    const feed = await this.geotabAdapter.fetchIncrementalFeed(
      connection.encryptedCredentials,
      connection.id,
      connection.lastSyncCursor || undefined,
    );

    let ingestedCount = 0;

    for (const item of feed.records) {
      const extId = item.logRecord?.device?.id || 'UNKNOWN';
      const eventId = item.logRecord?.id || `gtb_${extId}_${Date.now()}`;

      // Ingest raw payload
      const rawRes = await this.ingestRawPayload(
        {
          integrationConnectionId: connection.id,
          providerEventId: eventId,
          eventType: 'GEOTAB_FEED_ITEM',
          occurredAt: item.logRecord?.dateTime ? new Date(item.logRecord.dateTime) : new Date(),
          payload: item as any,
        },
        scopeCtx,
      );

      if (rawRes.status === 'INGESTED') {
        // Normalize using adapter
        const normalizedList = this.geotabAdapter.normalizePayload({
          externalVehicleId: extId,
          providerEventId: eventId,
          occurredAt: item.logRecord?.dateTime ? new Date(item.logRecord.dateTime) : new Date(),
          rawPayload: item,
        });

        for (const norm of normalizedList) {
          await this.ingestNormalizedTelemetry(
            rawRes.rawPayloadId,
            {
              externalVehicleId: norm.externalVehicleId,
              serialNumber: norm.serialNumber,
              providerEventId: norm.providerEventId,
              occurredAt: norm.occurredAt,
              latitude: norm.latitude,
              longitude: norm.longitude,
              speedKmh: norm.speedKmh,
              odometerKm: norm.odometerKm,
              engineHours: norm.engineHours,
              ignitionStatus: norm.ignitionStatus,
              fuelLevelPercent: norm.fuelLevelPercent,
              qualityStatus: norm.qualityStatus,
              qualityReason: norm.qualityReason,
            },
            scopeCtx,
          );
          ingestedCount++;
        }
      }
    }

    // CURSOR SAFETY: Advance cursor ONLY AFTER all records process successfully
    const now = new Date();
    await this.prisma.integrationConnection.update({
      where: { id: connection.id },
      data: {
        lastSyncCursor: feed.nextCursor,
        lastSyncAt: now,
        lastSuccessfulSyncAt: now,
        status: IntegrationConnectionStatus.CONNECTED,
      },
    });

    return {
      connectionId: connection.id,
      recordsProcessed: feed.records.length,
      telemetryIngested: ingestedCount,
      newCursor: feed.nextCursor,
    };
  }
}

