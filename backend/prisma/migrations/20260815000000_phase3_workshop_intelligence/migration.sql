-- CreateEnum
CREATE TYPE "WorkOrderPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'IN_PROGRESS', 'PENDING_APPROVAL', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('PREVENTATIVE', 'CORRECTIVE', 'SAFETY_GROUNDING', 'INSPECTION');

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

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_work_order_number_key" ON "work_orders"("work_order_number");
CREATE INDEX "work_orders_tenant_id_organization_id_idx" ON "work_orders"("tenant_id", "organization_id");
CREATE INDEX "work_orders_vehicle_id_idx" ON "work_orders"("vehicle_id");
CREATE INDEX "work_orders_workshop_id_idx" ON "work_orders"("workshop_id");
CREATE INDEX "work_orders_status_idx" ON "work_orders"("status");

-- CreateIndex
CREATE INDEX "work_order_tasks_work_order_id_idx" ON "work_order_tasks"("work_order_id");

-- CreateIndex
CREATE INDEX "maintenance_schedules_tenant_id_organization_id_idx" ON "maintenance_schedules"("tenant_id", "organization_id");
CREATE INDEX "maintenance_schedules_vehicle_class_idx" ON "maintenance_schedules"("vehicle_class");

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("vehicle_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("workshop_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_downtime_id_fkey" FOREIGN KEY ("downtime_id") REFERENCES "vehicle_downtimes"("downtime_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_defect_id_fkey" FOREIGN KEY ("defect_id") REFERENCES "tyre_defects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_tasks" ADD CONSTRAINT "work_order_tasks_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("work_order_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "work_order_tasks" ADD CONSTRAINT "work_order_tasks_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
