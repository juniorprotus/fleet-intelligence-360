-- CreateTable: tenants
CREATE TABLE IF NOT EXISTS "tenants" (
    "tenant_id" TEXT NOT NULL,
    "code" TEXT NOT NULL DEFAULT 'TNT-DEFAULT',
    "name" TEXT NOT NULL DEFAULT 'FI360 Default Tenant',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("tenant_id")
);

-- CreateTable: organizations
CREATE TABLE IF NOT EXISTS "organizations" (
    "organization_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "code" TEXT NOT NULL DEFAULT 'ORG-DEFAULT',
    "name" TEXT NOT NULL DEFAULT 'FI360 Fleet Organization',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("organization_id")
);

-- CreateTable: legal_entities
CREATE TABLE IF NOT EXISTS "legal_entities" (
    "legal_entity_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "code" TEXT NOT NULL DEFAULT 'LEG-DEFAULT',
    "name" TEXT NOT NULL DEFAULT 'FI360 Logistics Ltd',
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_entities_pkey" PRIMARY KEY ("legal_entity_id")
);

-- CreateTable: drivers
CREATE TABLE IF NOT EXISTS "drivers" (
    "driver_id" TEXT NOT NULL,
    "user_id" INTEGER,
    "driver_number" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "licence_number" TEXT,
    "licence_expiry" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("driver_id")
);

-- CreateTable: vehicle_workshop_assignments
CREATE TABLE IF NOT EXISTS "vehicle_workshop_assignments" (
    "id" SERIAL NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassigned_at" TIMESTAMP(3),
    "assigned_by" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_workshop_assignments_pkey" PRIMARY KEY ("id")
);

-- Unique Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_code_key" ON "tenants"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "organizations_code_key" ON "organizations"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "legal_entities_code_key" ON "legal_entities"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "drivers_driver_number_key" ON "drivers"("driver_number");

-- Indexes
CREATE INDEX IF NOT EXISTS "organizations_tenant_id_idx" ON "organizations"("tenant_id");
CREATE INDEX IF NOT EXISTS "legal_entities_organization_id_idx" ON "legal_entities"("organization_id");
CREATE INDEX IF NOT EXISTS "vehicle_workshop_assignments_vehicle_id_idx" ON "vehicle_workshop_assignments"("vehicle_id");
CREATE INDEX IF NOT EXISTS "vehicle_workshop_assignments_workshop_id_idx" ON "vehicle_workshop_assignments"("workshop_id");

-- Foreign Keys
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'organizations_tenant_id_fkey') THEN
        ALTER TABLE "organizations" ADD CONSTRAINT "organizations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'legal_entities_organization_id_fkey') THEN
        ALTER TABLE "legal_entities" ADD CONSTRAINT "legal_entities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vehicle_workshop_assignments_vehicle_id_fkey') THEN
        ALTER TABLE "vehicle_workshop_assignments" ADD CONSTRAINT "vehicle_workshop_assignments_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("vehicle_id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vehicle_workshop_assignments_workshop_id_fkey') THEN
        ALTER TABLE "vehicle_workshop_assignments" ADD CONSTRAINT "vehicle_workshop_assignments_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("workshop_id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
