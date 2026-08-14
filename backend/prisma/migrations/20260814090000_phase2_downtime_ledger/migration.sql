-- CreateTable: vehicle_grounding_policies
CREATE TABLE IF NOT EXISTS "vehicle_grounding_policies" (
    "policy_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'TNT-DEFAULT',
    "organization_id" TEXT NOT NULL DEFAULT 'ORG-DEFAULT',
    "name" TEXT NOT NULL DEFAULT 'Standard Fleet Grounding Policy',
    "vehicle_class" TEXT,
    "defect_category" TEXT NOT NULL,
    "severity_threshold" TEXT NOT NULL DEFAULT 'CRITICAL',
    "is_automatic_grounding" BOOLEAN NOT NULL DEFAULT true,
    "requires_approval" BOOLEAN NOT NULL DEFAULT false,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_grounding_policies_pkey" PRIMARY KEY ("policy_id")
);

-- CreateTable: vehicle_downtimes
CREATE TABLE IF NOT EXISTS "vehicle_downtimes" (
    "downtime_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'TNT-DEFAULT',
    "organization_id" TEXT NOT NULL DEFAULT 'ORG-DEFAULT',
    "workshop_id" TEXT,
    "downtime_type" TEXT NOT NULL DEFAULT 'UNPLANNED',
    "reason" TEXT NOT NULL,
    "source_domain" TEXT NOT NULL DEFAULT 'TYRE_INTELLIGENCE',
    "source_entity_id" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged_at" TIMESTAMP(3),
    "recovered_at" TIMESTAMP(3),
    "duration_minutes" INTEGER,
    "responsible_party" TEXT,
    "defect_id" INTEGER,
    "started_by" TEXT,
    "recovered_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_downtimes_pkey" PRIMARY KEY ("downtime_id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "vehicle_grounding_policies_tenant_id_idx" ON "vehicle_grounding_policies"("tenant_id");
CREATE INDEX IF NOT EXISTS "vehicle_grounding_policies_organization_id_idx" ON "vehicle_grounding_policies"("organization_id");
CREATE INDEX IF NOT EXISTS "vehicle_downtimes_vehicle_id_idx" ON "vehicle_downtimes"("vehicle_id");
CREATE INDEX IF NOT EXISTS "vehicle_downtimes_tenant_id_idx" ON "vehicle_downtimes"("tenant_id");
CREATE INDEX IF NOT EXISTS "vehicle_downtimes_workshop_id_idx" ON "vehicle_downtimes"("workshop_id");

-- Foreign Keys
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vehicle_downtimes_vehicle_id_fkey') THEN
        ALTER TABLE "vehicle_downtimes" ADD CONSTRAINT "vehicle_downtimes_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("vehicle_id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vehicle_downtimes_workshop_id_fkey') THEN
        ALTER TABLE "vehicle_downtimes" ADD CONSTRAINT "vehicle_downtimes_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("workshop_id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vehicle_downtimes_defect_id_fkey') THEN
        ALTER TABLE "vehicle_downtimes" ADD CONSTRAINT "vehicle_downtimes_defect_id_fkey" FOREIGN KEY ("defect_id") REFERENCES "tyre_defects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
