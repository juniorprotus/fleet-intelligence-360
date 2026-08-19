-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'GROUNDED', 'DISPOSED', 'SOLD');

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
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'ESCALATED', 'OVERDUE', 'RESOLVED', 'DISMISSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DefectStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TyreType" AS ENUM ('NEW', 'USED', 'RETREAD', 'REMOULD');

-- CreateEnum
CREATE TYPE "TyreStatus" AS ENUM ('IN_STOCK', 'INSPECTED', 'FITTED', 'IN_SERVICE', 'REMOVED', 'SENT_FOR_RETREAD', 'IN_RETREAD', 'RETURNED_RETREAD', 'SENT_FOR_REPAIR', 'IN_REPAIR', 'RETURNED_REPAIR', 'SCRAP', 'DISPOSED', 'SOLD', 'TRANSFERRED', 'LOST');

-- CreateEnum
CREATE TYPE "TyreCondition" AS ENUM ('GOOD', 'FAIR', 'POOR', 'DAMAGED', 'UNSERVICEABLE');

-- CreateEnum
CREATE TYPE "TyreMovementType" AS ENUM ('REGISTRATION', 'RECEIPT', 'FITMENT', 'REMOVAL', 'ROTATION', 'TRANSFER', 'SENT_RETREAD', 'RECEIVED_RETREAD', 'SENT_REPAIR', 'RECEIVED_REPAIR', 'REPAIR_COMPLETE', 'SCRAP', 'DISPOSE', 'SALE', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'CEO', 'FLEET_MANAGER', 'WORKSHOP_MANAGER', 'INVENTORY_MANAGER', 'TYRE_SUPERVISOR', 'TYRE_TECHNICIAN', 'FINANCE_MANAGER', 'DRIVER', 'AUDITOR', 'READ_ONLY');

-- CreateEnum
CREATE TYPE "WorkOrderPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'IN_PROGRESS', 'PENDING_APPROVAL', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('PREVENTATIVE', 'CORRECTIVE', 'SAFETY_GROUNDING', 'INSPECTION');

-- CreateEnum
CREATE TYPE "InventoryCategory" AS ENUM ('TYRE_CASING', 'VALVE', 'RIM', 'BRAKE_PAD', 'FILTER', 'FLUID', 'GENERAL_SPARE');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('RECEIPT', 'ISSUE', 'RETURN', 'TRANSFER', 'ADJUSTMENT', 'OPENING_BALANCE', 'STOCKTAKE_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "RequisitionStatus" AS ENUM ('PENDING', 'APPROVED', 'ISSUED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InspectionType" AS ENUM ('PRE_TRIP', 'POST_TRIP', 'ROUTINE_SAFETY');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('PASSED', 'FAILED_MINOR', 'FAILED_CRITICAL');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "VehicleOwnershipType" AS ENUM ('OWNED', 'LEASED', 'FINANCED', 'RENTED');

-- CreateEnum
CREATE TYPE "VehicleDepreciationMethod" AS ENUM ('STRAIGHT_LINE', 'REDUCING_BALANCE', 'USAGE_BASED_KM');

-- CreateEnum
CREATE TYPE "BookValueAuthority" AS ENUM ('FI360', 'EXTERNAL_ERP', 'MANUAL_VERIFIED');

-- CreateEnum
CREATE TYPE "FinancialDataStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VehicleFinanceAgreementType" AS ENUM ('LEASING', 'CHATTEL_MORTGAGE', 'HIRE_PURCHASE', 'OPERATING_LEASE', 'OTHER');

-- CreateEnum
CREATE TYPE "VehicleFinanceAgreementStatus" AS ENUM ('ACTIVE', 'SETTLED', 'TERMINATED', 'DEFAULTED');

-- CreateEnum
CREATE TYPE "VehicleDisposalMethod" AS ENUM ('SALE', 'SCRAP', 'TRADE_IN', 'DONATION', 'INSURANCE_WRITE_OFF', 'OTHER');

-- CreateEnum
CREATE TYPE "VehicleDisposalStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'FINALIZED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FinanceBalanceSource" AS ENUM ('FI360_LEDGER', 'EXTERNAL', 'MANUAL');

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

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'DEPRECATED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PlanVersionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUPERSEDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PricingModel" AS ENUM ('FLAT', 'PER_VEHICLE', 'TIERED', 'PROGRESSIVE');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'ANNUAL');

-- CreateTable
CREATE TABLE "tenants" (
    "tenant_id" TEXT NOT NULL,
    "code" TEXT NOT NULL DEFAULT 'TNT-DEFAULT',
    "name" TEXT NOT NULL DEFAULT 'FI360 Default Tenant',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("tenant_id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "organization_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "code" TEXT NOT NULL DEFAULT 'ORG-DEFAULT',
    "name" TEXT NOT NULL DEFAULT 'FI360 Fleet Organization',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("organization_id")
);

-- CreateTable
CREATE TABLE "legal_entities" (
    "legal_entity_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "code" TEXT NOT NULL DEFAULT 'LEG-DEFAULT',
    "name" TEXT NOT NULL DEFAULT 'FI360 Logistics Ltd',
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_entities_pkey" PRIMARY KEY ("legal_entity_id")
);

-- CreateTable
CREATE TABLE "drivers" (
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

-- CreateTable
CREATE TABLE "vehicle_workshop_assignments" (
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

-- CreateTable
CREATE TABLE "vehicles" (
    "vehicle_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "vin" TEXT,
    "registration_number" TEXT NOT NULL,
    "fleet_number" TEXT,
    "vehicle_class" TEXT,
    "make" TEXT,
    "model" TEXT,
    "depot" TEXT,
    "region" TEXT,
    "department" TEXT,
    "workshop_id" TEXT,
    "vehicle_status" "VehicleStatus" NOT NULL DEFAULT 'ACTIVE',
    "expected_tyres" INTEGER DEFAULT 10,
    "current_odometer" INTEGER,
    "acquisition_date" TIMESTAMP(3),
    "disposal_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("vehicle_id")
);

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

-- CreateTable
CREATE TABLE "tyres" (
    "id" SERIAL NOT NULL,
    "tyre_identifier" TEXT NOT NULL,
    "serial_number" TEXT,
    "company_brand_number" TEXT,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "tyre_type" "TyreType" NOT NULL DEFAULT 'NEW',
    "construction" TEXT,
    "load_index" INTEGER,
    "speed_rating" TEXT,
    "pattern" TEXT,
    "ply_rating" TEXT,
    "dot_code" TEXT,
    "manufacturer" TEXT,
    "purchase_date" TIMESTAMP(3),
    "purchase_cost" DECIMAL(12,2),
    "purchase_order_number" TEXT,
    "currency" TEXT DEFAULT 'KES',
    "warranty_months" INTEGER,
    "expected_service_life_km" INTEGER,
    "supplier_id" INTEGER,
    "current_status" "TyreStatus" NOT NULL DEFAULT 'IN_STOCK',
    "current_position_id" INTEGER,
    "current_vehicle_id" TEXT,
    "current_odometer" INTEGER,
    "original_tread_depth" DECIMAL(5,2),
    "current_tread_depth" DECIMAL(5,2),
    "minimum_tread_depth" DECIMAL(5,2) DEFAULT 3.0,
    "initial_pressure" DECIMAL(5,2),
    "casing_condition" TEXT,
    "retread_count" INTEGER NOT NULL DEFAULT 0,
    "repair_count" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "tyres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tyre_suppliers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "contact_name" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tyre_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tyre_fitments" (
    "id" SERIAL NOT NULL,
    "tyre_id" INTEGER NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "position_id" INTEGER NOT NULL,
    "position_code" TEXT,
    "axle" INTEGER,
    "side" TEXT,
    "inner_outer" TEXT,
    "fitment_date" TIMESTAMP(3) NOT NULL,
    "fitment_odometer" INTEGER,
    "fitment_tread_depth" DECIMAL(5,2),
    "removal_date" TIMESTAMP(3),
    "removal_odometer" INTEGER,
    "removal_tread_depth" DECIMAL(5,2),
    "removal_reason" TEXT,
    "fitted_by" TEXT,
    "removed_by" TEXT,
    "supervisor_verified_by" TEXT,
    "supervisor_verified_at" TIMESTAMP(3),
    "verification_status" TEXT DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tyre_fitments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tyre_inspections" (
    "id" SERIAL NOT NULL,
    "tyre_id" INTEGER NOT NULL,
    "inspection_date" TIMESTAMP(3) NOT NULL,
    "vehicle_id" TEXT,
    "position_id" INTEGER,
    "odometer" INTEGER,
    "tread_depth_left" DECIMAL(5,2),
    "tread_depth_center" DECIMAL(5,2),
    "tread_depth_right" DECIMAL(5,2),
    "average_tread_depth" DECIMAL(5,2),
    "pressure" DECIMAL(5,2),
    "condition" "TyreCondition" DEFAULT 'GOOD',
    "wear_pattern" TEXT,
    "sidewall_condition" TEXT,
    "valve_condition" TEXT,
    "rim_condition" TEXT,
    "damage_type" TEXT,
    "damage_description" TEXT,
    "recommendation" TEXT,
    "inspected_by" TEXT,
    "supervisor_verified_by" TEXT,
    "supervisor_verified_at" TIMESTAMP(3),
    "verification_status" TEXT DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tyre_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tyre_movements" (
    "id" SERIAL NOT NULL,
    "tyre_id" INTEGER NOT NULL,
    "movement_type" "TyreMovementType" NOT NULL,
    "movement_date" TIMESTAMP(3) NOT NULL,
    "from_status" "TyreStatus",
    "to_status" "TyreStatus" NOT NULL,
    "from_vehicle_id" TEXT,
    "to_vehicle_id" TEXT,
    "from_position" INTEGER,
    "to_position" INTEGER,
    "from_location" TEXT,
    "to_location" TEXT,
    "odometer" INTEGER,
    "reason" TEXT,
    "performed_by" TEXT,
    "supervisor_id" TEXT,
    "verified_at" TIMESTAMP(3),
    "verification_status" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tyre_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tyre_alerts" (
    "id" SERIAL NOT NULL,
    "alert_type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'MEDIUM',
    "risk_score" INTEGER,
    "tyre_id" INTEGER,
    "vehicle_id" TEXT,
    "position_id" INTEGER,
    "workshop_id" TEXT,
    "region" TEXT,
    "depot" TEXT,
    "message" TEXT NOT NULL,
    "detail" TEXT,
    "recommended_action" TEXT,
    "due_date" TIMESTAMP(3),
    "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
    "acknowledged_by" TEXT,
    "acknowledged_at" TIMESTAMP(3),
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "resolution_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tyre_alerts_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "vehicle_grounding_policies" (
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

-- CreateTable
CREATE TABLE "vehicle_downtimes" (
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
    "reason" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'DRIVER',
    "department" TEXT,
    "region" TEXT,
    "depot" TEXT,
    "branch" TEXT,
    "workshop_id" TEXT,
    "assigned_vehicle_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_orders" (
    "work_order_id" TEXT NOT NULL,
    "work_order_number" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'TNT-DEFAULT',
    "organization_id" TEXT NOT NULL DEFAULT 'ORG-DEFAULT',
    "vehicle_id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "downtime_id" TEXT,
    "defect_id" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "maintenance_type" "MaintenanceType" NOT NULL DEFAULT 'CORRECTIVE',
    "priority" "WorkOrderPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduled_start" TIMESTAMP(3),
    "actual_start" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "estimated_hours" DOUBLE PRECISION,
    "actual_hours" DOUBLE PRECISION,
    "total_parts_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_labor_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_by" TEXT,
    "assigned_tech_id" INTEGER,
    "approved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("work_order_id")
);

-- CreateTable
CREATE TABLE "work_order_tasks" (
    "id" SERIAL NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "task_name" TEXT NOT NULL,
    "description" TEXT,
    "assigned_to_id" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "estimated_min" INTEGER,
    "actual_min" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_order_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_schedules" (
    "schedule_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'TNT-DEFAULT',
    "organization_id" TEXT NOT NULL DEFAULT 'ORG-DEFAULT',
    "vehicle_class" TEXT NOT NULL,
    "service_name" TEXT NOT NULL,
    "interval_km" INTEGER,
    "interval_days" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_schedules_pkey" PRIMARY KEY ("schedule_id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "item_id" TEXT NOT NULL,
    "part_number" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'TNT-DEFAULT',
    "organization_id" TEXT NOT NULL DEFAULT 'ORG-DEFAULT',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "InventoryCategory" NOT NULL DEFAULT 'GENERAL_SPARE',
    "unit_of_measure" TEXT NOT NULL DEFAULT 'EA',
    "default_unit_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("item_id")
);

-- CreateTable
CREATE TABLE "inventory_stocks" (
    "stock_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'TNT-DEFAULT',
    "organization_id" TEXT NOT NULL DEFAULT 'ORG-DEFAULT',
    "workshop_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "quantity_on_hand" INTEGER NOT NULL DEFAULT 0,
    "quantity_reserved" INTEGER NOT NULL DEFAULT 0,
    "reorder_point" INTEGER NOT NULL DEFAULT 5,
    "reorder_quantity" INTEGER NOT NULL DEFAULT 20,
    "unit_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_stocks_pkey" PRIMARY KEY ("stock_id")
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" SERIAL NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'TNT-DEFAULT',
    "organization_id" TEXT NOT NULL DEFAULT 'ORG-DEFAULT',
    "workshop_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "movement_type" "InventoryMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_cost" DOUBLE PRECISION NOT NULL,
    "total_cost" DOUBLE PRECISION NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "work_order_id" TEXT,
    "requisition_id" TEXT,
    "po_id" TEXT,
    "reference" TEXT,
    "performed_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parts_requisitions" (
    "requisition_id" TEXT NOT NULL,
    "req_number" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'TNT-DEFAULT',
    "organization_id" TEXT NOT NULL DEFAULT 'ORG-DEFAULT',
    "work_order_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_cost" DOUBLE PRECISION NOT NULL,
    "total_cost" DOUBLE PRECISION NOT NULL,
    "status" "RequisitionStatus" NOT NULL DEFAULT 'PENDING',
    "requested_by_id" INTEGER NOT NULL,
    "issued_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parts_requisitions_pkey" PRIMARY KEY ("requisition_id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "vendor_id" TEXT NOT NULL,
    "vendor_code" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'TNT-DEFAULT',
    "organization_id" TEXT NOT NULL DEFAULT 'ORG-DEFAULT',
    "name" TEXT NOT NULL,
    "contact_email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("vendor_id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "po_id" TEXT NOT NULL,
    "po_number" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'TNT-DEFAULT',
    "organization_id" TEXT NOT NULL DEFAULT 'ORG-DEFAULT',
    "vendor_id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "total_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "approved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("po_id")
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" SERIAL NOT NULL,
    "po_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "quantity_ordered" INTEGER NOT NULL,
    "quantity_received" INTEGER NOT NULL DEFAULT 0,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "total_price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_assignments" (
    "assignment_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'TNT-DEFAULT',
    "organization_id" TEXT NOT NULL DEFAULT 'ORG-DEFAULT',
    "driver_id" INTEGER NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "shift_start" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shift_end" TIMESTAMP(3),
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "start_odometer" INTEGER NOT NULL,
    "end_odometer" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_assignments_pkey" PRIMARY KEY ("assignment_id")
);

-- CreateTable
CREATE TABLE "trip_inspections" (
    "inspection_id" TEXT NOT NULL,
    "inspection_no" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'TNT-DEFAULT',
    "organization_id" TEXT NOT NULL DEFAULT 'ORG-DEFAULT',
    "vehicle_id" TEXT NOT NULL,
    "driver_id" INTEGER NOT NULL,
    "type" "InspectionType" NOT NULL DEFAULT 'PRE_TRIP',
    "status" "InspectionStatus" NOT NULL DEFAULT 'PASSED',
    "odometer" INTEGER NOT NULL,
    "has_defects" BOOLEAN NOT NULL DEFAULT false,
    "is_grounded" BOOLEAN NOT NULL DEFAULT false,
    "grounding_reason" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_inspections_pkey" PRIMARY KEY ("inspection_id")
);

-- CreateTable
CREATE TABLE "inspection_item_results" (
    "id" SERIAL NOT NULL,
    "inspection_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "is_passed" BOOLEAN NOT NULL,
    "severity" "IncidentSeverity" NOT NULL DEFAULT 'LOW',
    "notes" TEXT,

    CONSTRAINT "inspection_item_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_incidents" (
    "incident_id" TEXT NOT NULL,
    "incident_no" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'TNT-DEFAULT',
    "organization_id" TEXT NOT NULL DEFAULT 'ORG-DEFAULT',
    "driver_id" INTEGER NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "incident_type" TEXT NOT NULL,
    "severity" "IncidentSeverity" NOT NULL DEFAULT 'MEDIUM',
    "description" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "points_deducted" INTEGER NOT NULL DEFAULT 5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "safety_incidents_pkey" PRIMARY KEY ("incident_id")
);

-- CreateTable
CREATE TABLE "driver_safety_scores" (
    "id" SERIAL NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'TNT-DEFAULT',
    "organization_id" TEXT NOT NULL DEFAULT 'ORG-DEFAULT',
    "driver_id" INTEGER NOT NULL,
    "period_month" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "total_trips" INTEGER NOT NULL DEFAULT 0,
    "inspections_passed" INTEGER NOT NULL DEFAULT 0,
    "incidents_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_safety_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_corrections" (
    "correction_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'TNT-DEFAULT',
    "organization_id" TEXT NOT NULL DEFAULT 'ORG-DEFAULT',
    "domain" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "field_name" TEXT NOT NULL,
    "original_value" TEXT NOT NULL,
    "corrected_value" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "corrected_by_id" INTEGER NOT NULL,
    "corrected_by_email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "correlation_id" TEXT,
    "audit_log_id" TEXT,

    CONSTRAINT "data_corrections_pkey" PRIMARY KEY ("correction_id")
);

-- CreateTable
CREATE TABLE "vehicle_financial_profiles" (
    "profile_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "acquisition_cost" DECIMAL(14,2) NOT NULL,
    "capitalized_cost" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "acquisition_date" TIMESTAMP(3) NOT NULL,
    "in_service_date" TIMESTAMP(3) NOT NULL,
    "ownership_type" "VehicleOwnershipType" NOT NULL DEFAULT 'OWNED',
    "vendor_id" TEXT,
    "purchase_order_reference" TEXT,
    "depreciation_method" "VehicleDepreciationMethod" NOT NULL,
    "depreciation_rate_percent" DECIMAL(5,2) NOT NULL,
    "useful_life_years" INTEGER NOT NULL,
    "useful_life_km" INTEGER NOT NULL,
    "residual_value" DECIMAL(14,2) NOT NULL,
    "book_value_authority" "BookValueAuthority" NOT NULL DEFAULT 'FI360',
    "external_book_value" DECIMAL(14,2),
    "external_book_value_date" TIMESTAMP(3),
    "last_valuation_date" TIMESTAMP(3),
    "financial_data_status" "FinancialDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "tenant_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "vehicle_financial_profiles_pkey" PRIMARY KEY ("profile_id")
);

-- CreateTable
CREATE TABLE "vehicle_finance_agreements" (
    "agreement_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "agreement_number" TEXT NOT NULL,
    "agreement_type" "VehicleFinanceAgreementType" NOT NULL,
    "lender_or_lessor" TEXT NOT NULL,
    "facility_reference" TEXT,
    "principal_amount" DECIMAL(14,2) NOT NULL,
    "down_payment" DECIMAL(14,2) NOT NULL,
    "financed_amount" DECIMAL(14,2) NOT NULL,
    "interest_rate_percent" DECIMAL(5,2) NOT NULL,
    "term_months" INTEGER NOT NULL,
    "monthly_repayment" DECIMAL(14,2) NOT NULL,
    "outstanding_balance" DECIMAL(14,2) NOT NULL,
    "balance_source" "FinanceBalanceSource" NOT NULL DEFAULT 'MANUAL',
    "balance_as_of" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "start_date" TIMESTAMP(3) NOT NULL,
    "maturity_date" TIMESTAMP(3) NOT NULL,
    "annual_mileage_limit_km" INTEGER,
    "residual_balloon_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" "VehicleFinanceAgreementStatus" NOT NULL DEFAULT 'ACTIVE',
    "settled_at" TIMESTAMP(3),
    "settlement_amount" DECIMAL(14,2),
    "document_ref" TEXT,
    "tenant_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "vehicle_finance_agreements_pkey" PRIMARY KEY ("agreement_id")
);

-- CreateTable
CREATE TABLE "vehicle_disposal_records" (
    "disposal_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "disposal_date" TIMESTAMP(3) NOT NULL,
    "disposal_method" "VehicleDisposalMethod" NOT NULL,
    "buyer_name" TEXT,
    "buyer_contact" TEXT,
    "sale_proceeds" DECIMAL(14,2) NOT NULL,
    "disposal_costs" DECIMAL(14,2) NOT NULL,
    "book_value_at_disposal" DECIMAL(14,2) NOT NULL,
    "gain_or_loss_amount" DECIMAL(14,2) NOT NULL,
    "sale_invoice_number" TEXT,
    "reason" TEXT,
    "document_ref" TEXT,
    "status" "VehicleDisposalStatus" NOT NULL DEFAULT 'DRAFT',
    "tenant_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,
    "finalized_at" TIMESTAMP(3),
    "finalized_by" TEXT,

    CONSTRAINT "vehicle_disposal_records_pkey" PRIMARY KEY ("disposal_id")
);

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

-- CreateTable
CREATE TABLE "products" (
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

-- CreateTable
CREATE TABLE "plans" (
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

-- CreateTable
CREATE TABLE "plan_versions" (
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

-- CreateTable
CREATE TABLE "plan_prices" (
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

-- CreateTable
CREATE TABLE "plan_vehicle_pricing_bands" (
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

-- CreateIndex
CREATE UNIQUE INDEX "tenants_code_key" ON "tenants"("code");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_code_key" ON "organizations"("code");

-- CreateIndex
CREATE INDEX "organizations_tenant_id_idx" ON "organizations"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "legal_entities_code_key" ON "legal_entities"("code");

-- CreateIndex
CREATE INDEX "legal_entities_organization_id_idx" ON "legal_entities"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_driver_number_key" ON "drivers"("driver_number");

-- CreateIndex
CREATE INDEX "vehicle_workshop_assignments_vehicle_id_idx" ON "vehicle_workshop_assignments"("vehicle_id");

-- CreateIndex
CREATE INDEX "vehicle_workshop_assignments_workshop_id_idx" ON "vehicle_workshop_assignments"("workshop_id");

-- CreateIndex
CREATE UNIQUE INDEX "workshops_code_key" ON "workshops"("code");

-- CreateIndex
CREATE INDEX "workshops_region_idx" ON "workshops"("region");

-- CreateIndex
CREATE INDEX "workshops_depot_idx" ON "workshops"("depot");

-- CreateIndex
CREATE INDEX "workshops_workshop_status_idx" ON "workshops"("workshop_status");

-- CreateIndex
CREATE INDEX "vehicles_region_idx" ON "vehicles"("region");

-- CreateIndex
CREATE INDEX "vehicles_depot_idx" ON "vehicles"("depot");

-- CreateIndex
CREATE INDEX "vehicles_workshop_id_idx" ON "vehicles"("workshop_id");

-- CreateIndex
CREATE INDEX "vehicles_vehicle_class_idx" ON "vehicles"("vehicle_class");

-- CreateIndex
CREATE INDEX "vehicles_vehicle_status_idx" ON "vehicles"("vehicle_status");

-- CreateIndex
CREATE INDEX "vehicles_tenant_id_organization_id_idx" ON "vehicles"("tenant_id", "organization_id");

-- CreateIndex
CREATE INDEX "vehicles_tenant_id_vehicle_status_idx" ON "vehicles"("tenant_id", "vehicle_status");

-- CreateIndex
CREATE INDEX "vehicles_vin_idx" ON "vehicles"("vin");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_tenant_id_registration_number_key" ON "vehicles"("tenant_id", "registration_number");

-- CreateIndex
CREATE INDEX "budgets_period_label_idx" ON "budgets"("period_label");

-- CreateIndex
CREATE INDEX "budgets_budget_category_idx" ON "budgets"("budget_category");

-- CreateIndex
CREATE INDEX "budgets_budget_status_idx" ON "budgets"("budget_status");

-- CreateIndex
CREATE UNIQUE INDEX "tyres_tyre_identifier_key" ON "tyres"("tyre_identifier");

-- CreateIndex
CREATE INDEX "tyres_current_status_idx" ON "tyres"("current_status");

-- CreateIndex
CREATE INDEX "tyres_current_vehicle_id_idx" ON "tyres"("current_vehicle_id");

-- CreateIndex
CREATE INDEX "tyres_brand_model_idx" ON "tyres"("brand", "model");

-- CreateIndex
CREATE INDEX "tyres_supplier_id_idx" ON "tyres"("supplier_id");

-- CreateIndex
CREATE UNIQUE INDEX "tyre_suppliers_code_key" ON "tyre_suppliers"("code");

-- CreateIndex
CREATE INDEX "tyre_fitments_tyre_id_idx" ON "tyre_fitments"("tyre_id");

-- CreateIndex
CREATE INDEX "tyre_fitments_vehicle_id_idx" ON "tyre_fitments"("vehicle_id");

-- CreateIndex
CREATE INDEX "tyre_fitments_fitment_date_idx" ON "tyre_fitments"("fitment_date");

-- CreateIndex
CREATE INDEX "tyre_fitments_verification_status_idx" ON "tyre_fitments"("verification_status");

-- CreateIndex
CREATE INDEX "tyre_inspections_tyre_id_idx" ON "tyre_inspections"("tyre_id");

-- CreateIndex
CREATE INDEX "tyre_inspections_inspection_date_idx" ON "tyre_inspections"("inspection_date");

-- CreateIndex
CREATE INDEX "tyre_inspections_vehicle_id_idx" ON "tyre_inspections"("vehicle_id");

-- CreateIndex
CREATE INDEX "tyre_inspections_verification_status_idx" ON "tyre_inspections"("verification_status");

-- CreateIndex
CREATE INDEX "tyre_movements_tyre_id_idx" ON "tyre_movements"("tyre_id");

-- CreateIndex
CREATE INDEX "tyre_movements_movement_date_idx" ON "tyre_movements"("movement_date");

-- CreateIndex
CREATE INDEX "tyre_movements_movement_type_idx" ON "tyre_movements"("movement_type");

-- CreateIndex
CREATE INDEX "tyre_alerts_alert_type_idx" ON "tyre_alerts"("alert_type");

-- CreateIndex
CREATE INDEX "tyre_alerts_severity_idx" ON "tyre_alerts"("severity");

-- CreateIndex
CREATE INDEX "tyre_alerts_status_idx" ON "tyre_alerts"("status");

-- CreateIndex
CREATE INDEX "tyre_alerts_tyre_id_idx" ON "tyre_alerts"("tyre_id");

-- CreateIndex
CREATE INDEX "tyre_alerts_vehicle_id_idx" ON "tyre_alerts"("vehicle_id");

-- CreateIndex
CREATE INDEX "tyre_alerts_workshop_id_idx" ON "tyre_alerts"("workshop_id");

-- CreateIndex
CREATE INDEX "tyre_alerts_region_idx" ON "tyre_alerts"("region");

-- CreateIndex
CREATE INDEX "tyre_alerts_depot_idx" ON "tyre_alerts"("depot");

-- CreateIndex
CREATE INDEX "tyre_defects_vehicle_id_idx" ON "tyre_defects"("vehicle_id");

-- CreateIndex
CREATE INDEX "tyre_defects_status_idx" ON "tyre_defects"("status");

-- CreateIndex
CREATE INDEX "tyre_defects_severity_idx" ON "tyre_defects"("severity");

-- CreateIndex
CREATE INDEX "vehicle_grounding_policies_tenant_id_idx" ON "vehicle_grounding_policies"("tenant_id");

-- CreateIndex
CREATE INDEX "vehicle_grounding_policies_organization_id_idx" ON "vehicle_grounding_policies"("organization_id");

-- CreateIndex
CREATE INDEX "vehicle_downtimes_vehicle_id_idx" ON "vehicle_downtimes"("vehicle_id");

-- CreateIndex
CREATE INDEX "vehicle_downtimes_tenant_id_idx" ON "vehicle_downtimes"("tenant_id");

-- CreateIndex
CREATE INDEX "vehicle_downtimes_workshop_id_idx" ON "vehicle_downtimes"("workshop_id");

-- CreateIndex
CREATE INDEX "audit_logs_module_idx" ON "audit_logs"("module");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_workshop_id_idx" ON "users"("workshop_id");

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_work_order_number_key" ON "work_orders"("work_order_number");

-- CreateIndex
CREATE INDEX "work_orders_tenant_id_organization_id_idx" ON "work_orders"("tenant_id", "organization_id");

-- CreateIndex
CREATE INDEX "work_orders_vehicle_id_idx" ON "work_orders"("vehicle_id");

-- CreateIndex
CREATE INDEX "work_orders_workshop_id_idx" ON "work_orders"("workshop_id");

-- CreateIndex
CREATE INDEX "work_orders_status_idx" ON "work_orders"("status");

-- CreateIndex
CREATE INDEX "work_order_tasks_work_order_id_idx" ON "work_order_tasks"("work_order_id");

-- CreateIndex
CREATE INDEX "maintenance_schedules_tenant_id_organization_id_idx" ON "maintenance_schedules"("tenant_id", "organization_id");

-- CreateIndex
CREATE INDEX "maintenance_schedules_vehicle_class_idx" ON "maintenance_schedules"("vehicle_class");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_part_number_key" ON "inventory_items"("part_number");

-- CreateIndex
CREATE INDEX "inventory_items_tenant_id_organization_id_idx" ON "inventory_items"("tenant_id", "organization_id");

-- CreateIndex
CREATE INDEX "inventory_items_category_idx" ON "inventory_items"("category");

-- CreateIndex
CREATE INDEX "inventory_stocks_tenant_id_organization_id_idx" ON "inventory_stocks"("tenant_id", "organization_id");

-- CreateIndex
CREATE INDEX "inventory_stocks_workshop_id_idx" ON "inventory_stocks"("workshop_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_stocks_workshop_id_item_id_key" ON "inventory_stocks"("workshop_id", "item_id");

-- CreateIndex
CREATE INDEX "inventory_movements_tenant_id_organization_id_idx" ON "inventory_movements"("tenant_id", "organization_id");

-- CreateIndex
CREATE INDEX "inventory_movements_workshop_id_idx" ON "inventory_movements"("workshop_id");

-- CreateIndex
CREATE INDEX "inventory_movements_item_id_idx" ON "inventory_movements"("item_id");

-- CreateIndex
CREATE INDEX "inventory_movements_movement_type_idx" ON "inventory_movements"("movement_type");

-- CreateIndex
CREATE UNIQUE INDEX "parts_requisitions_req_number_key" ON "parts_requisitions"("req_number");

-- CreateIndex
CREATE INDEX "parts_requisitions_tenant_id_organization_id_idx" ON "parts_requisitions"("tenant_id", "organization_id");

-- CreateIndex
CREATE INDEX "parts_requisitions_work_order_id_idx" ON "parts_requisitions"("work_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_vendor_code_key" ON "vendors"("vendor_code");

-- CreateIndex
CREATE INDEX "vendors_tenant_id_organization_id_idx" ON "vendors"("tenant_id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_po_number_key" ON "purchase_orders"("po_number");

-- CreateIndex
CREATE INDEX "purchase_orders_tenant_id_organization_id_idx" ON "purchase_orders"("tenant_id", "organization_id");

-- CreateIndex
CREATE INDEX "purchase_orders_vendor_id_idx" ON "purchase_orders"("vendor_id");

-- CreateIndex
CREATE INDEX "purchase_orders_workshop_id_idx" ON "purchase_orders"("workshop_id");

-- CreateIndex
CREATE INDEX "purchase_order_items_po_id_idx" ON "purchase_order_items"("po_id");

-- CreateIndex
CREATE INDEX "driver_assignments_tenant_id_organization_id_idx" ON "driver_assignments"("tenant_id", "organization_id");

-- CreateIndex
CREATE INDEX "driver_assignments_driver_id_idx" ON "driver_assignments"("driver_id");

-- CreateIndex
CREATE INDEX "driver_assignments_vehicle_id_idx" ON "driver_assignments"("vehicle_id");

-- CreateIndex
CREATE INDEX "driver_assignments_status_idx" ON "driver_assignments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "trip_inspections_inspection_no_key" ON "trip_inspections"("inspection_no");

-- CreateIndex
CREATE INDEX "trip_inspections_tenant_id_organization_id_idx" ON "trip_inspections"("tenant_id", "organization_id");

-- CreateIndex
CREATE INDEX "trip_inspections_vehicle_id_idx" ON "trip_inspections"("vehicle_id");

-- CreateIndex
CREATE INDEX "trip_inspections_driver_id_idx" ON "trip_inspections"("driver_id");

-- CreateIndex
CREATE INDEX "trip_inspections_type_idx" ON "trip_inspections"("type");

-- CreateIndex
CREATE INDEX "inspection_item_results_inspection_id_idx" ON "inspection_item_results"("inspection_id");

-- CreateIndex
CREATE UNIQUE INDEX "safety_incidents_incident_no_key" ON "safety_incidents"("incident_no");

-- CreateIndex
CREATE INDEX "safety_incidents_tenant_id_organization_id_idx" ON "safety_incidents"("tenant_id", "organization_id");

-- CreateIndex
CREATE INDEX "safety_incidents_driver_id_idx" ON "safety_incidents"("driver_id");

-- CreateIndex
CREATE INDEX "safety_incidents_vehicle_id_idx" ON "safety_incidents"("vehicle_id");

-- CreateIndex
CREATE INDEX "driver_safety_scores_tenant_id_organization_id_idx" ON "driver_safety_scores"("tenant_id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "driver_safety_scores_driver_id_period_month_key" ON "driver_safety_scores"("driver_id", "period_month");

-- CreateIndex
CREATE INDEX "data_corrections_tenant_id_organization_id_idx" ON "data_corrections"("tenant_id", "organization_id");

-- CreateIndex
CREATE INDEX "data_corrections_domain_entity_type_entity_id_idx" ON "data_corrections"("domain", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "data_corrections_corrected_by_id_idx" ON "data_corrections"("corrected_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_financial_profiles_vehicle_id_key" ON "vehicle_financial_profiles"("vehicle_id");

-- CreateIndex
CREATE INDEX "vehicle_financial_profiles_tenant_id_organization_id_idx" ON "vehicle_financial_profiles"("tenant_id", "organization_id");

-- CreateIndex
CREATE INDEX "vehicle_financial_profiles_vehicle_id_idx" ON "vehicle_financial_profiles"("vehicle_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_finance_agreements_agreement_number_key" ON "vehicle_finance_agreements"("agreement_number");

-- CreateIndex
CREATE INDEX "vehicle_finance_agreements_tenant_id_organization_id_idx" ON "vehicle_finance_agreements"("tenant_id", "organization_id");

-- CreateIndex
CREATE INDEX "vehicle_finance_agreements_vehicle_id_idx" ON "vehicle_finance_agreements"("vehicle_id");

-- CreateIndex
CREATE INDEX "vehicle_disposal_records_tenant_id_organization_id_idx" ON "vehicle_disposal_records"("tenant_id", "organization_id");

-- CreateIndex
CREATE INDEX "vehicle_disposal_records_vehicle_id_idx" ON "vehicle_disposal_records"("vehicle_id");

-- CreateIndex
CREATE INDEX "integration_connections_tenant_id_idx" ON "integration_connections"("tenant_id");

-- CreateIndex
CREATE INDEX "integration_connections_tenant_id_organization_id_idx" ON "integration_connections"("tenant_id", "organization_id");

-- CreateIndex
CREATE INDEX "integration_connections_provider_status_idx" ON "integration_connections"("provider", "status");

-- CreateIndex
CREATE INDEX "vehicle_external_identities_tenant_id_organization_id_idx" ON "vehicle_external_identities"("tenant_id", "organization_id");

-- CreateIndex
CREATE INDEX "vehicle_external_identities_vehicle_id_idx" ON "vehicle_external_identities"("vehicle_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_external_identities_connection_id_external_vehicle__key" ON "vehicle_external_identities"("connection_id", "external_vehicle_id");

-- CreateIndex
CREATE INDEX "external_devices_tenant_id_organization_id_idx" ON "external_devices"("tenant_id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "external_devices_connection_id_serial_number_key" ON "external_devices"("connection_id", "serial_number");

-- CreateIndex
CREATE INDEX "vehicle_device_assignment_history_device_id_idx" ON "vehicle_device_assignment_history"("device_id");

-- CreateIndex
CREATE INDEX "vehicle_device_assignment_history_vehicle_id_idx" ON "vehicle_device_assignment_history"("vehicle_id");

-- CreateIndex
CREATE INDEX "raw_integration_payloads_tenant_id_organization_id_idx" ON "raw_integration_payloads"("tenant_id", "organization_id");

-- CreateIndex
CREATE INDEX "raw_integration_payloads_occurred_at_idx" ON "raw_integration_payloads"("occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "raw_integration_payloads_connection_id_provider_event_id_key" ON "raw_integration_payloads"("connection_id", "provider_event_id");

-- CreateIndex
CREATE INDEX "normalized_telemetry_tenant_id_organization_id_idx" ON "normalized_telemetry"("tenant_id", "organization_id");

-- CreateIndex
CREATE INDEX "normalized_telemetry_vehicle_id_occurred_at_idx" ON "normalized_telemetry"("vehicle_id", "occurred_at");

-- CreateIndex
CREATE INDEX "normalized_telemetry_device_id_occurred_at_idx" ON "normalized_telemetry"("device_id", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "products_product_key_key" ON "products"("product_key");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "products"("status");

-- CreateIndex
CREATE INDEX "plans_product_id_status_idx" ON "plans"("product_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "plans_product_id_plan_key_key" ON "plans"("product_id", "plan_key");

-- CreateIndex
CREATE INDEX "plan_versions_plan_id_status_idx" ON "plan_versions"("plan_id", "status");

-- CreateIndex
CREATE INDEX "plan_versions_effective_from_effective_to_idx" ON "plan_versions"("effective_from", "effective_to");

-- CreateIndex
CREATE UNIQUE INDEX "plan_versions_plan_id_version_number_key" ON "plan_versions"("plan_id", "version_number");

-- CreateIndex
CREATE INDEX "plan_prices_plan_version_id_idx" ON "plan_prices"("plan_version_id");

-- CreateIndex
CREATE INDEX "plan_prices_currency_billing_interval_idx" ON "plan_prices"("currency", "billing_interval");

-- CreateIndex
CREATE INDEX "plan_vehicle_pricing_bands_plan_version_id_idx" ON "plan_vehicle_pricing_bands"("plan_version_id");

-- CreateIndex
CREATE INDEX "plan_vehicle_pricing_bands_currency_billing_interval_idx" ON "plan_vehicle_pricing_bands"("currency", "billing_interval");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_entities" ADD CONSTRAINT "legal_entities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_workshop_assignments" ADD CONSTRAINT "vehicle_workshop_assignments_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("vehicle_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_workshop_assignments" ADD CONSTRAINT "vehicle_workshop_assignments_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("workshop_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("workshop_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tyres" ADD CONSTRAINT "tyres_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "tyre_suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tyre_fitments" ADD CONSTRAINT "tyre_fitments_tyre_id_fkey" FOREIGN KEY ("tyre_id") REFERENCES "tyres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tyre_fitments" ADD CONSTRAINT "tyre_fitments_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("vehicle_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tyre_inspections" ADD CONSTRAINT "tyre_inspections_tyre_id_fkey" FOREIGN KEY ("tyre_id") REFERENCES "tyres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tyre_inspections" ADD CONSTRAINT "tyre_inspections_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("vehicle_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tyre_movements" ADD CONSTRAINT "tyre_movements_tyre_id_fkey" FOREIGN KEY ("tyre_id") REFERENCES "tyres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tyre_alerts" ADD CONSTRAINT "tyre_alerts_tyre_id_fkey" FOREIGN KEY ("tyre_id") REFERENCES "tyres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tyre_defects" ADD CONSTRAINT "tyre_defects_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("vehicle_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tyre_defects" ADD CONSTRAINT "tyre_defects_tyre_id_fkey" FOREIGN KEY ("tyre_id") REFERENCES "tyres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_downtimes" ADD CONSTRAINT "vehicle_downtimes_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("vehicle_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_downtimes" ADD CONSTRAINT "vehicle_downtimes_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("workshop_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_downtimes" ADD CONSTRAINT "vehicle_downtimes_defect_id_fkey" FOREIGN KEY ("defect_id") REFERENCES "tyre_defects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("workshop_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("vehicle_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("workshop_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_downtime_id_fkey" FOREIGN KEY ("downtime_id") REFERENCES "vehicle_downtimes"("downtime_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_defect_id_fkey" FOREIGN KEY ("defect_id") REFERENCES "tyre_defects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_tasks" ADD CONSTRAINT "work_order_tasks_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("work_order_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_tasks" ADD CONSTRAINT "work_order_tasks_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_stocks" ADD CONSTRAINT "inventory_stocks_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("workshop_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_stocks" ADD CONSTRAINT "inventory_stocks_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "inventory_items"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("workshop_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "inventory_items"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("work_order_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parts_requisitions" ADD CONSTRAINT "parts_requisitions_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("work_order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parts_requisitions" ADD CONSTRAINT "parts_requisitions_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "inventory_items"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parts_requisitions" ADD CONSTRAINT "parts_requisitions_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("vendor_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("workshop_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "purchase_orders"("po_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "inventory_items"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_assignments" ADD CONSTRAINT "driver_assignments_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_assignments" ADD CONSTRAINT "driver_assignments_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("vehicle_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_inspections" ADD CONSTRAINT "trip_inspections_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("vehicle_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_inspections" ADD CONSTRAINT "trip_inspections_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_item_results" ADD CONSTRAINT "inspection_item_results_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "trip_inspections"("inspection_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_incidents" ADD CONSTRAINT "safety_incidents_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_incidents" ADD CONSTRAINT "safety_incidents_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("vehicle_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_safety_scores" ADD CONSTRAINT "driver_safety_scores_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_financial_profiles" ADD CONSTRAINT "vehicle_financial_profiles_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("vehicle_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_financial_profiles" ADD CONSTRAINT "vehicle_financial_profiles_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("vendor_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_finance_agreements" ADD CONSTRAINT "vehicle_finance_agreements_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("vehicle_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_disposal_records" ADD CONSTRAINT "vehicle_disposal_records_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("vehicle_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_external_identities" ADD CONSTRAINT "vehicle_external_identities_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "integration_connections"("connection_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_external_identities" ADD CONSTRAINT "vehicle_external_identities_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("vehicle_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_devices" ADD CONSTRAINT "external_devices_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "integration_connections"("connection_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_device_assignment_history" ADD CONSTRAINT "vehicle_device_assignment_history_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "external_devices"("device_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_device_assignment_history" ADD CONSTRAINT "vehicle_device_assignment_history_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("vehicle_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_integration_payloads" ADD CONSTRAINT "raw_integration_payloads_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "integration_connections"("connection_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_integration_payloads" ADD CONSTRAINT "raw_integration_payloads_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "external_devices"("device_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "normalized_telemetry" ADD CONSTRAINT "normalized_telemetry_raw_payload_id_fkey" FOREIGN KEY ("raw_payload_id") REFERENCES "raw_integration_payloads"("payload_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "normalized_telemetry" ADD CONSTRAINT "normalized_telemetry_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "integration_connections"("connection_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "normalized_telemetry" ADD CONSTRAINT "normalized_telemetry_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("vehicle_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "normalized_telemetry" ADD CONSTRAINT "normalized_telemetry_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "external_devices"("device_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_versions" ADD CONSTRAINT "plan_versions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("plan_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_prices" ADD CONSTRAINT "plan_prices_plan_version_id_fkey" FOREIGN KEY ("plan_version_id") REFERENCES "plan_versions"("plan_version_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_vehicle_pricing_bands" ADD CONSTRAINT "plan_vehicle_pricing_bands_plan_version_id_fkey" FOREIGN KEY ("plan_version_id") REFERENCES "plan_versions"("plan_version_id") ON DELETE RESTRICT ON UPDATE CASCADE;

