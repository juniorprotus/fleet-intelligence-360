-- =====================================================
-- FI360 Step 6A: Product Catalog Foundation Migration
-- This migration reconciles accumulated schema drift AND
-- creates the new product catalog tables.
-- All statements are idempotent (safe to re-run).
-- =====================================================

-- === NEW ENUMS (Product Catalog) ===
DO $$ BEGIN
  CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'DEPRECATED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PlanVersionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUPERSEDED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PricingModel" AS ENUM ('FLAT', 'PER_VEHICLE', 'TIERED', 'PROGRESSIVE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'ANNUAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- === EXISTING ENUM DRIFT FIXES (idempotent) ===
DO $$ BEGIN
  ALTER TYPE "TyreMovementType" ADD VALUE IF NOT EXISTS 'REGISTRATION';
END $$;
DO $$ BEGIN
  ALTER TYPE "TyreMovementType" ADD VALUE IF NOT EXISTS 'REPAIR_COMPLETE';
END $$;
DO $$ BEGIN
  ALTER TYPE "TyreMovementType" ADD VALUE IF NOT EXISTS 'DISPOSE';
END $$;
DO $$ BEGIN
  ALTER TYPE "TyreStatus" ADD VALUE IF NOT EXISTS 'INSPECTED';
END $$;
DO $$ BEGIN
  ALTER TYPE "TyreStatus" ADD VALUE IF NOT EXISTS 'IN_SERVICE';
END $$;
DO $$ BEGIN
  ALTER TYPE "TyreStatus" ADD VALUE IF NOT EXISTS 'DISPOSED';
END $$;

-- UserRole enum: This already has the correct values in the DB. Skip the destructive rewrite.
-- The DB already has: SUPER_ADMIN, CEO, FLEET_MANAGER, WORKSHOP_MANAGER, INVENTORY_MANAGER,
-- TYRE_SUPERVISOR, TYRE_TECHNICIAN, FINANCE_MANAGER, DRIVER, AUDITOR, READ_ONLY

-- === EXISTING TABLE COLUMN DRIFT FIXES (idempotent ADD COLUMN IF NOT EXISTS) ===

-- tyre_fitments
ALTER TABLE "tyre_fitments" ADD COLUMN IF NOT EXISTS "axle" INTEGER;
ALTER TABLE "tyre_fitments" ADD COLUMN IF NOT EXISTS "inner_outer" TEXT;
ALTER TABLE "tyre_fitments" ADD COLUMN IF NOT EXISTS "position_code" TEXT;
ALTER TABLE "tyre_fitments" ADD COLUMN IF NOT EXISTS "side" TEXT;
ALTER TABLE "tyre_fitments" ADD COLUMN IF NOT EXISTS "supervisor_verified_at" TIMESTAMP(3);
ALTER TABLE "tyre_fitments" ADD COLUMN IF NOT EXISTS "supervisor_verified_by" TEXT;
ALTER TABLE "tyre_fitments" ADD COLUMN IF NOT EXISTS "verification_status" TEXT DEFAULT 'PENDING';

-- tyre_inspections
ALTER TABLE "tyre_inspections" ADD COLUMN IF NOT EXISTS "rim_condition" TEXT;
ALTER TABLE "tyre_inspections" ADD COLUMN IF NOT EXISTS "sidewall_condition" TEXT;
ALTER TABLE "tyre_inspections" ADD COLUMN IF NOT EXISTS "supervisor_verified_at" TIMESTAMP(3);
ALTER TABLE "tyre_inspections" ADD COLUMN IF NOT EXISTS "supervisor_verified_by" TEXT;
ALTER TABLE "tyre_inspections" ADD COLUMN IF NOT EXISTS "valve_condition" TEXT;
ALTER TABLE "tyre_inspections" ADD COLUMN IF NOT EXISTS "verification_status" TEXT DEFAULT 'PENDING';
ALTER TABLE "tyre_inspections" ADD COLUMN IF NOT EXISTS "wear_pattern" TEXT;

-- tyre_movements
ALTER TABLE "tyre_movements" ADD COLUMN IF NOT EXISTS "from_location" TEXT;
ALTER TABLE "tyre_movements" ADD COLUMN IF NOT EXISTS "supervisor_id" TEXT;
ALTER TABLE "tyre_movements" ADD COLUMN IF NOT EXISTS "to_location" TEXT;
ALTER TABLE "tyre_movements" ADD COLUMN IF NOT EXISTS "verification_status" TEXT;
ALTER TABLE "tyre_movements" ADD COLUMN IF NOT EXISTS "verified_at" TIMESTAMP(3);

-- tyres
ALTER TABLE "tyres" ADD COLUMN IF NOT EXISTS "casing_condition" TEXT;
ALTER TABLE "tyres" ADD COLUMN IF NOT EXISTS "company_brand_number" TEXT;
ALTER TABLE "tyres" ADD COLUMN IF NOT EXISTS "construction" TEXT;
ALTER TABLE "tyres" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'KES';
ALTER TABLE "tyres" ADD COLUMN IF NOT EXISTS "expected_service_life_km" INTEGER;
ALTER TABLE "tyres" ADD COLUMN IF NOT EXISTS "initial_pressure" DECIMAL(5,2);
ALTER TABLE "tyres" ADD COLUMN IF NOT EXISTS "manufacturer" TEXT;
ALTER TABLE "tyres" ADD COLUMN IF NOT EXISTS "warranty_months" INTEGER;
ALTER TABLE "tyres" ALTER COLUMN "minimum_tread_depth" SET DEFAULT 3.0;

-- users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "assigned_vehicle_id" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "branch" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "department" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "depot" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "region" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "workshop_id" TEXT;
DO $$ BEGIN
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'DRIVER';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- === NEW PRODUCT CATALOG TABLES ===

CREATE TABLE IF NOT EXISTS "products" (
    "product_id" TEXT NOT NULL,
    "product_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "products_pkey" PRIMARY KEY ("product_id")
);

CREATE TABLE IF NOT EXISTS "plans" (
    "plan_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "plan_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "PlanStatus" NOT NULL DEFAULT 'DRAFT',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "plans_pkey" PRIMARY KEY ("plan_id")
);

CREATE TABLE IF NOT EXISTS "plan_versions" (
    "plan_version_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "status" "PlanVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "pricing_model" "PricingModel" NOT NULL DEFAULT 'FLAT',
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "billing_interval" "BillingInterval" NOT NULL DEFAULT 'MONTHLY',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "plan_versions_pkey" PRIMARY KEY ("plan_version_id")
);

CREATE TABLE IF NOT EXISTS "plan_prices" (
    "plan_price_id" TEXT NOT NULL,
    "plan_version_id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "billing_interval" "BillingInterval" NOT NULL,
    "amount" DECIMAL(12,2),
    "is_default" BOOLEAN NOT NULL DEFAULT true,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "plan_prices_pkey" PRIMARY KEY ("plan_price_id")
);

CREATE TABLE IF NOT EXISTS "plan_vehicle_pricing_bands" (
    "pricing_band_id" TEXT NOT NULL,
    "plan_version_id" TEXT NOT NULL,
    "min_vehicles" INTEGER NOT NULL DEFAULT 0,
    "max_vehicles" INTEGER,
    "price_per_vehicle" DECIMAL(12,2),
    "flat_price" DECIMAL(12,2),
    "currency" TEXT NOT NULL,
    "billing_interval" "BillingInterval" NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "plan_vehicle_pricing_bands_pkey" PRIMARY KEY ("pricing_band_id")
);

-- === INDEXES (idempotent with IF NOT EXISTS) ===
CREATE UNIQUE INDEX IF NOT EXISTS "products_product_key_key" ON "products"("product_key");
CREATE INDEX IF NOT EXISTS "products_status_idx" ON "products"("status");
CREATE INDEX IF NOT EXISTS "plans_product_id_status_idx" ON "plans"("product_id", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "plans_product_id_plan_key_key" ON "plans"("product_id", "plan_key");
CREATE INDEX IF NOT EXISTS "plan_versions_plan_id_status_idx" ON "plan_versions"("plan_id", "status");
CREATE INDEX IF NOT EXISTS "plan_versions_effective_from_effective_to_idx" ON "plan_versions"("effective_from", "effective_to");
CREATE UNIQUE INDEX IF NOT EXISTS "plan_versions_plan_id_version_number_key" ON "plan_versions"("plan_id", "version_number");
CREATE INDEX IF NOT EXISTS "plan_prices_plan_version_id_idx" ON "plan_prices"("plan_version_id");
CREATE INDEX IF NOT EXISTS "plan_prices_currency_billing_interval_idx" ON "plan_prices"("currency", "billing_interval");
CREATE INDEX IF NOT EXISTS "plan_vehicle_pricing_bands_plan_version_id_idx" ON "plan_vehicle_pricing_bands"("plan_version_id");
CREATE INDEX IF NOT EXISTS "plan_vehicle_pricing_bands_currency_billing_interval_idx" ON "plan_vehicle_pricing_bands"("currency", "billing_interval");

-- Existing table drift indexes
CREATE INDEX IF NOT EXISTS "tyre_fitments_verification_status_idx" ON "tyre_fitments"("verification_status");
CREATE INDEX IF NOT EXISTS "tyre_inspections_verification_status_idx" ON "tyre_inspections"("verification_status");
CREATE INDEX IF NOT EXISTS "tyre_movements_movement_type_idx" ON "tyre_movements"("movement_type");
CREATE INDEX IF NOT EXISTS "tyres_supplier_id_idx" ON "tyres"("supplier_id");
CREATE INDEX IF NOT EXISTS "users_workshop_id_idx" ON "users"("workshop_id");

-- === FOREIGN KEYS (idempotent) ===
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vehicles_workshop_id_fkey') THEN
    ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("workshop_id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tyre_fitments_vehicle_id_fkey') THEN
    ALTER TABLE "tyre_fitments" ADD CONSTRAINT "tyre_fitments_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("vehicle_id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tyre_inspections_vehicle_id_fkey') THEN
    ALTER TABLE "tyre_inspections" ADD CONSTRAINT "tyre_inspections_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("vehicle_id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tyre_alerts_tyre_id_fkey') THEN
    ALTER TABLE "tyre_alerts" ADD CONSTRAINT "tyre_alerts_tyre_id_fkey" FOREIGN KEY ("tyre_id") REFERENCES "tyres"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tyre_defects_vehicle_id_fkey') THEN
    ALTER TABLE "tyre_defects" ADD CONSTRAINT "tyre_defects_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("vehicle_id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tyre_defects_tyre_id_fkey') THEN
    ALTER TABLE "tyre_defects" ADD CONSTRAINT "tyre_defects_tyre_id_fkey" FOREIGN KEY ("tyre_id") REFERENCES "tyres"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_workshop_id_fkey') THEN
    ALTER TABLE "users" ADD CONSTRAINT "users_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("workshop_id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Product catalog foreign keys
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plans_product_id_fkey') THEN
    ALTER TABLE "plans" ADD CONSTRAINT "plans_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plan_versions_plan_id_fkey') THEN
    ALTER TABLE "plan_versions" ADD CONSTRAINT "plan_versions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("plan_id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plan_prices_plan_version_id_fkey') THEN
    ALTER TABLE "plan_prices" ADD CONSTRAINT "plan_prices_plan_version_id_fkey" FOREIGN KEY ("plan_version_id") REFERENCES "plan_versions"("plan_version_id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plan_vehicle_pricing_bands_plan_version_id_fkey') THEN
    ALTER TABLE "plan_vehicle_pricing_bands" ADD CONSTRAINT "plan_vehicle_pricing_bands_plan_version_id_fkey" FOREIGN KEY ("plan_version_id") REFERENCES "plan_versions"("plan_version_id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- === INDEX RENAMES (idempotent) ===
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'external_devices_connection_id_serial_number_idx') THEN
    ALTER INDEX "external_devices_connection_id_serial_number_idx" RENAME TO "external_devices_connection_id_serial_number_key";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'raw_integration_payloads_connection_id_provider_event_id_idx') THEN
    ALTER INDEX "raw_integration_payloads_connection_id_provider_event_id_idx" RENAME TO "raw_integration_payloads_connection_id_provider_event_id_key";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'vehicle_external_identities_connection_id_external_vehicle_idx') THEN
    ALTER INDEX "vehicle_external_identities_connection_id_external_vehicle_idx" RENAME TO "vehicle_external_identities_connection_id_external_vehicle__key";
  END IF;
END $$;
