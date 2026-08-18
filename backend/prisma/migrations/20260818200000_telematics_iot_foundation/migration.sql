-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('GENERIC', 'GEOTAB', 'TRAKZEE', 'FLEETIO', 'CHEVIN');

-- CreateEnum
CREATE TYPE "IntegrationConnectionStatus" AS ENUM ('CONNECTED', 'SYNCING', 'DEGRADED', 'FAILED', 'DISCONNECTED', 'AUTHENTICATION_ERROR', 'RATE_LIMITED', 'NOT_CONNECTED');

-- CreateEnum
CREATE TYPE "ExternalIdentityStatus" AS ENUM ('MAPPED', 'UNMAPPED', 'MANUAL_REVIEW', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "ExternalDeviceStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'UNASSIGNED', 'DECOMMISSIONED');

-- CreateEnum
CREATE TYPE "TelemetryProcessingStatus" AS ENUM ('RECEIVED', 'NORMALIZED', 'PROCESSED', 'REJECTED', 'QUARANTINED', 'FAILED');

-- CreateEnum
CREATE TYPE "TelemetryQualityStatus" AS ENUM ('VALID', 'INVALID_COORDINATES', 'OUT_OF_RANGE_ODOMETER', 'STALE_GPS', 'INSUFFICIENT_DATA');

-- CreateTable
CREATE TABLE "integration_connections" (
    "connection_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "organization_id" TEXT,
    "provider" "IntegrationProvider" NOT NULL DEFAULT 'GENERIC',
    "connection_name" TEXT NOT NULL,
    "status" "IntegrationConnectionStatus" NOT NULL DEFAULT 'NOT_CONNECTED',
    "credential_reference" TEXT,
    "encrypted_credentials" TEXT,
    "last_sync_at" TIMESTAMP(3),
    "last_successful_sync_at" TIMESTAMP(3),
    "last_failed_sync_at" TIMESTAMP(3),
    "last_error" TEXT,
    "last_sync_cursor" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "integration_connections_pkey" PRIMARY KEY ("connection_id")
);

-- CreateTable
CREATE TABLE "vehicle_external_identities" (
    "identity_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "external_vehicle_id" TEXT NOT NULL,
    "external_registration" TEXT,
    "external_vin" TEXT,
    "status" "ExternalIdentityStatus" NOT NULL DEFAULT 'MAPPED',
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "vehicle_external_identities_pkey" PRIMARY KEY ("identity_id")
);

-- CreateTable
CREATE TABLE "external_devices" (
    "device_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "device_type" TEXT NOT NULL DEFAULT 'GPS_TRACKER',
    "serial_number" TEXT NOT NULL,
    "imei" TEXT,
    "manufacturer" TEXT,
    "model" TEXT,
    "status" "ExternalDeviceStatus" NOT NULL DEFAULT 'ACTIVE',
    "installed_at" TIMESTAMP(3),
    "decommissioned_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_devices_pkey" PRIMARY KEY ("device_id")
);

-- CreateTable
CREATE TABLE "vehicle_device_assignment_history" (
    "id" SERIAL NOT NULL,
    "device_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "assigned_by" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_device_assignment_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_integration_payloads" (
    "payload_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "device_id" TEXT,
    "provider" "IntegrationProvider" NOT NULL,
    "provider_event_id" TEXT,
    "event_type" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload_json" JSONB NOT NULL,
    "processing_status" "TelemetryProcessingStatus" NOT NULL DEFAULT 'RECEIVED',
    "processing_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_integration_payloads_pkey" PRIMARY KEY ("payload_id")
);

-- CreateTable
CREATE TABLE "normalized_telemetry" (
    "telemetry_id" TEXT NOT NULL,
    "raw_payload_id" TEXT,
    "tenant_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "device_id" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "speed_kmh" DOUBLE PRECISION,
    "odometer_km" INTEGER,
    "engine_hours" DOUBLE PRECISION,
    "ignition_status" BOOLEAN,
    "fuel_level_percent" DOUBLE PRECISION,
    "fuel_rate_lph" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "trip_distance_km" DOUBLE PRECISION,
    "quality_status" "TelemetryQualityStatus" NOT NULL DEFAULT 'VALID',
    "quality_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "normalized_telemetry_pkey" PRIMARY KEY ("telemetry_id")
);

-- CreateIndex
CREATE INDEX "integration_connections_tenant_id_idx" ON "integration_connections"("tenant_id");
CREATE INDEX "integration_connections_tenant_id_organization_id_idx" ON "integration_connections"("tenant_id", "organization_id");
CREATE INDEX "integration_connections_provider_status_idx" ON "integration_connections"("provider", "status");

-- CreateIndex
CREATE INDEX "vehicle_external_identities_tenant_id_organization_id_idx" ON "vehicle_external_identities"("tenant_id", "organization_id");
CREATE INDEX "vehicle_external_identities_vehicle_id_idx" ON "vehicle_external_identities"("vehicle_id");
CREATE UNIQUE INDEX "vehicle_external_identities_connection_id_external_vehicle_idx" ON "vehicle_external_identities"("connection_id", "external_vehicle_id");

-- CreateIndex
CREATE INDEX "external_devices_tenant_id_organization_id_idx" ON "external_devices"("tenant_id", "organization_id");
CREATE UNIQUE INDEX "external_devices_connection_id_serial_number_idx" ON "external_devices"("connection_id", "serial_number");

-- CreateIndex
CREATE INDEX "vehicle_device_assignment_history_device_id_idx" ON "vehicle_device_assignment_history"("device_id");
CREATE INDEX "vehicle_device_assignment_history_vehicle_id_idx" ON "vehicle_device_assignment_history"("vehicle_id");

-- CreateIndex
CREATE INDEX "raw_integration_payloads_tenant_id_organization_id_idx" ON "raw_integration_payloads"("tenant_id", "organization_id");
CREATE INDEX "raw_integration_payloads_occurred_at_idx" ON "raw_integration_payloads"("occurred_at");
CREATE UNIQUE INDEX "raw_integration_payloads_connection_id_provider_event_id_idx" ON "raw_integration_payloads"("connection_id", "provider_event_id");

-- CreateIndex
CREATE INDEX "normalized_telemetry_tenant_id_organization_id_idx" ON "normalized_telemetry"("tenant_id", "organization_id");
CREATE INDEX "normalized_telemetry_vehicle_id_occurred_at_idx" ON "normalized_telemetry"("vehicle_id", "occurred_at");
CREATE INDEX "normalized_telemetry_device_id_occurred_at_idx" ON "normalized_telemetry"("device_id", "occurred_at");

-- AddForeignKey
ALTER TABLE "vehicle_external_identities" ADD CONSTRAINT "vehicle_external_identities_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "integration_connections"("connection_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vehicle_external_identities" ADD CONSTRAINT "vehicle_external_identities_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("vehicle_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_devices" ADD CONSTRAINT "external_devices_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "integration_connections"("connection_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_device_assignment_history" ADD CONSTRAINT "vehicle_device_assignment_history_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "external_devices"("device_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vehicle_device_assignment_history" ADD CONSTRAINT "vehicle_device_assignment_history_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("vehicle_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_integration_payloads" ADD CONSTRAINT "raw_integration_payloads_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "integration_connections"("connection_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "raw_integration_payloads" ADD CONSTRAINT "raw_integration_payloads_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "external_devices"("device_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "normalized_telemetry" ADD CONSTRAINT "normalized_telemetry_raw_payload_id_fkey" FOREIGN KEY ("raw_payload_id") REFERENCES "raw_integration_payloads"("payload_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "normalized_telemetry" ADD CONSTRAINT "normalized_telemetry_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "integration_connections"("connection_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "normalized_telemetry" ADD CONSTRAINT "normalized_telemetry_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("vehicle_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "normalized_telemetry" ADD CONSTRAINT "normalized_telemetry_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "external_devices"("device_id") ON DELETE SET NULL ON UPDATE CASCADE;
