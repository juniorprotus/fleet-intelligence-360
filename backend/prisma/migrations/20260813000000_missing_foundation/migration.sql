-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DISPOSED', 'SOLD');

-- CreateEnum
CREATE TYPE "WorkshopStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "BudgetCategory" AS ENUM ('TYRES', 'FUEL', 'WORKSHOP', 'DRIVER', 'FLEET_FINANCIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "BudgetStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'OVER_BUDGET');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('LOW_TREAD', 'HIGH_PRESSURE', 'LOW_PRESSURE', 'INSPECTION_OVERDUE', 'UNAUTHORIZED_MOVEMENT', 'BUDGET_EXCEEDED', 'ROTATION_OVERDUE', 'REPLACEMENT_DUE', 'PREMATURE_FAILURE', 'SAFETY_CRITICAL', 'STOCK_LOW', 'REPEATED_PRESSURE_LOSS');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED', 'ESCALATED', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DefectStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED');

-- CreateTable
CREATE TABLE "vehicles" (
    "vehicle_id" TEXT NOT NULL,
    "registration_number" TEXT NOT NULL,
    "fleet_number" TEXT,
    "vehicle_class" TEXT,
    "make" TEXT,
    "model" TEXT,
    "depot" TEXT,
    "region" TEXT,
    "department" TEXT,
    "vehicle_status" "VehicleStatus" NOT NULL DEFAULT 'ACTIVE',
    "current_odometer" INTEGER,
    "acquisition_date" TIMESTAMP(3),
    "disposal_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "workshop_id" TEXT,
    "expected_tyres" INTEGER DEFAULT 10,
    "organization_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "vin" TEXT,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("vehicle_id")
);

-- CreateIndex
CREATE INDEX "vehicles_depot_idx" ON "vehicles"("depot" ASC);

-- CreateIndex
CREATE INDEX "vehicles_region_idx" ON "vehicles"("region" ASC);

-- CreateIndex
CREATE INDEX "vehicles_tenant_id_organization_id_idx" ON "vehicles"("tenant_id" ASC, "organization_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_registration_number_key" ON "vehicles"("registration_number");

-- CreateIndex
CREATE INDEX "vehicles_tenant_id_vehicle_status_idx" ON "vehicles"("tenant_id" ASC, "vehicle_status" ASC);

-- CreateIndex
CREATE INDEX "vehicles_vehicle_class_idx" ON "vehicles"("vehicle_class" ASC);

-- CreateIndex
CREATE INDEX "vehicles_vehicle_status_idx" ON "vehicles"("vehicle_status" ASC);

-- CreateIndex
CREATE INDEX "vehicles_vin_idx" ON "vehicles"("vin" ASC);

-- CreateIndex
CREATE INDEX "vehicles_workshop_id_idx" ON "vehicles"("workshop_id" ASC);

-- CreateTable
CREATE TABLE "workshops" (
    "workshop_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT,
    "depot" TEXT,
    "address" TEXT,
    "manager_id" INTEGER,
    "workshop_status" "WorkshopStatus" NOT NULL DEFAULT 'ACTIVE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "workshops_pkey" PRIMARY KEY ("workshop_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workshops_code_key" ON "workshops"("code" ASC);

-- CreateIndex
CREATE INDEX "workshops_depot_idx" ON "workshops"("depot" ASC);

-- CreateIndex
CREATE INDEX "workshops_region_idx" ON "workshops"("region" ASC);

-- CreateIndex
CREATE INDEX "workshops_workshop_status_idx" ON "workshops"("workshop_status" ASC);

-- CreateTable
CREATE TABLE "budgets" (
    "id" SERIAL NOT NULL,
    "period_label" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "organisation_unit" TEXT,
    "department" TEXT,
    "cost_centre" TEXT,
    "vehicle_class" TEXT,
    "budget_category" "BudgetCategory" NOT NULL,
    "budget_amount" DECIMAL(14,2) NOT NULL,
    "actual_expenditure" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "variance_amount" DECIMAL(14,2),
    "variance_percent" DECIMAL(6,2),
    "budget_status" "BudgetStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "budgets_budget_category_idx" ON "budgets"("budget_category" ASC);

-- CreateIndex
CREATE INDEX "budgets_budget_status_idx" ON "budgets"("budget_status" ASC);

-- CreateIndex
CREATE INDEX "budgets_period_label_idx" ON "budgets"("period_label" ASC);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "user_id" TEXT,
    "user_email" TEXT,
    "before_value" JSONB,
    "after_value" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" ASC);

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type" ASC, "entity_id" ASC);

-- CreateIndex
CREATE INDEX "audit_logs_module_idx" ON "audit_logs"("module" ASC);

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id" ASC);

-- CreateTable
CREATE TABLE "tyre_alerts" (
    "id" SERIAL NOT NULL,
    "alert_type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'MEDIUM',
    "tyre_id" INTEGER,
    "vehicle_id" TEXT,
    "position_id" INTEGER,
    "message" TEXT NOT NULL,
    "detail" TEXT,
    "recommended_action" TEXT,
    "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
    "acknowledged_by" TEXT,
    "acknowledged_at" TIMESTAMP(3),
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "resolution_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "depot" TEXT,
    "region" TEXT,
    "workshop_id" TEXT,
    "due_date" TIMESTAMP(3),
    "risk_score" INTEGER,

    CONSTRAINT "tyre_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tyre_alerts_alert_type_idx" ON "tyre_alerts"("alert_type" ASC);

-- CreateIndex
CREATE INDEX "tyre_alerts_depot_idx" ON "tyre_alerts"("depot" ASC);

-- CreateIndex
CREATE INDEX "tyre_alerts_region_idx" ON "tyre_alerts"("region" ASC);

-- CreateIndex
CREATE INDEX "tyre_alerts_severity_idx" ON "tyre_alerts"("severity" ASC);

-- CreateIndex
CREATE INDEX "tyre_alerts_status_idx" ON "tyre_alerts"("status" ASC);

-- CreateIndex
CREATE INDEX "tyre_alerts_tyre_id_idx" ON "tyre_alerts"("tyre_id" ASC);

-- CreateIndex
CREATE INDEX "tyre_alerts_vehicle_id_idx" ON "tyre_alerts"("vehicle_id" ASC);

-- CreateIndex
CREATE INDEX "tyre_alerts_workshop_id_idx" ON "tyre_alerts"("workshop_id" ASC);

-- CreateTable
CREATE TABLE "tyre_defects" (
    "id" SERIAL NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "tyre_id" INTEGER,
    "position_id" INTEGER,
    "defect_type" TEXT NOT NULL,
    "description" TEXT,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "DefectStatus" NOT NULL DEFAULT 'OPEN',
    "reported_by" TEXT NOT NULL,
    "reported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_to" TEXT,
    "assigned_at" TIMESTAMP(3),
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "resolution_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tyre_defects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tyre_defects_severity_idx" ON "tyre_defects"("severity" ASC);

-- CreateIndex
CREATE INDEX "tyre_defects_status_idx" ON "tyre_defects"("status" ASC);

-- CreateIndex
CREATE INDEX "tyre_defects_vehicle_id_idx" ON "tyre_defects"("vehicle_id" ASC);

