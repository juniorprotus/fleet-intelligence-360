-- CreateEnum
CREATE TYPE "InspectionType" AS ENUM ('PRE_TRIP', 'POST_TRIP', 'ROUTINE_SAFETY');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('PASSED', 'FAILED_MINOR', 'FAILED_CRITICAL');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

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

-- CreateIndex
CREATE INDEX "driver_assignments_tenant_id_organization_id_idx" ON "driver_assignments"("tenant_id", "organization_id");
CREATE INDEX "driver_assignments_driver_id_idx" ON "driver_assignments"("driver_id");
CREATE INDEX "driver_assignments_vehicle_id_idx" ON "driver_assignments"("vehicle_id");
CREATE INDEX "driver_assignments_status_idx" ON "driver_assignments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "trip_inspections_inspection_no_key" ON "trip_inspections"("inspection_no");
CREATE INDEX "trip_inspections_tenant_id_organization_id_idx" ON "trip_inspections"("tenant_id", "organization_id");
CREATE INDEX "trip_inspections_vehicle_id_idx" ON "trip_inspections"("vehicle_id");
CREATE INDEX "trip_inspections_driver_id_idx" ON "trip_inspections"("driver_id");
CREATE INDEX "trip_inspections_type_idx" ON "trip_inspections"("type");

-- CreateIndex
CREATE INDEX "inspection_item_results_inspection_id_idx" ON "inspection_item_results"("inspection_id");

-- CreateIndex
CREATE UNIQUE INDEX "safety_incidents_incident_no_key" ON "safety_incidents"("incident_no");
CREATE INDEX "safety_incidents_tenant_id_organization_id_idx" ON "safety_incidents"("tenant_id", "organization_id");
CREATE INDEX "safety_incidents_driver_id_idx" ON "safety_incidents"("driver_id");
CREATE INDEX "safety_incidents_vehicle_id_idx" ON "safety_incidents"("vehicle_id");

-- CreateIndex
CREATE UNIQUE INDEX "driver_safety_scores_driver_id_period_month_key" ON "driver_safety_scores"("driver_id", "period_month");
CREATE INDEX "driver_safety_scores_tenant_id_organization_id_idx" ON "driver_safety_scores"("tenant_id", "organization_id");

-- AddForeignKey
ALTER TABLE "driver_assignments" ADD CONSTRAINT "driver_assignments_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "driver_assignments" ADD CONSTRAINT "driver_assignments_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("vehicle_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_inspections" ADD CONSTRAINT "trip_inspections_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("vehicle_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "trip_inspections" ADD CONSTRAINT "trip_inspections_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_item_results" ADD CONSTRAINT "inspection_item_results_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "trip_inspections"("inspection_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_incidents" ADD CONSTRAINT "safety_incidents_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "safety_incidents" ADD CONSTRAINT "safety_incidents_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("vehicle_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_safety_scores" ADD CONSTRAINT "driver_safety_scores_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
