# FI360 Phase 3 — Data Model & Migration Design Specification

**Document ID**: `FI360-PHASE3-DATA-MODEL-DESIGN-v1.0`  
**Date**: August 14, 2026  
**Status**: APPROVED SPECIFICATION — MIGRATION PLAN ONLY (NO PROD SCHEMA EDIT YET)  

---

## 1. Overview

Phase 3 introduces 3 new database entities to support Workshop Operations, Maintenance Work Orders, and Preventative Maintenance Scheduling:
1. **`WorkOrder`** (`work_orders` table) — Master maintenance work order ledger.
2. **`WorkOrderTask`** (`work_order_tasks` table) — Itemized maintenance task assignments for technicians.
3. **`MaintenanceSchedule`** (`maintenance_schedules` table) — Odometer and calendar preventative maintenance triggers.

---

## 2. Detailed Entity Models (Proposed Prisma Schema)

```prisma
// ============================================================
// PHASE 3 — WORKSHOP INTELLIGENCE & MAINTENANCE SCHEDULING
// ============================================================

enum WorkOrderPriority {
  LOW
  MEDIUM
  HIGH
  EMERGENCY
}

enum WorkOrderStatus {
  DRAFT
  SCHEDULED
  IN_PROGRESS
  PENDING_APPROVAL
  COMPLETED
  CANCELLED
}

enum MaintenanceType {
  PREVENTATIVE
  CORRECTIVE
  SAFETY_GROUNDING
  INSPECTION
}

/// Workshop Maintenance Work Order
model WorkOrder {
  id              String           @id @default(uuid()) @map("work_order_id")
  workOrderNumber String           @unique @map("work_order_number")             // e.g. "WO-2026-0001"
  tenantId        String           @default("TNT-DEFAULT") @map("tenant_id")
  organizationId  String           @default("ORG-DEFAULT") @map("organization_id")
  vehicleId       String           @map("vehicle_id")
  vehicle         Vehicle          @relation(fields: [vehicleId], references: [id])
  workshopId      String           @map("workshop_id")
  workshop        Workshop         @relation(fields: [workshopId], references: [id])
  downtimeId      String?          @map("downtime_id")
  downtime        VehicleDowntime? @relation(fields: [downtimeId], references: [id])
  defectId        Int?             @map("defect_id")
  defect          TyreDefect?      @relation(fields: [defectId], references: [id])
  
  title           String
  description     String?
  maintenanceType MaintenanceType  @default(CORRECTIVE) @map("maintenance_type")
  priority        WorkOrderPriority @default(MEDIUM)
  status          WorkOrderStatus  @default(DRAFT)
  
  scheduledStart  DateTime?        @map("scheduled_start")
  actualStart     DateTime?        @map("actual_start")
  completedAt     DateTime?        @map("completed_at")
  
  estimatedHours  Float?           @map("estimated_hours")
  actualHours     Float?           @map("actual_hours")
  totalPartsCost  Float            @default(0) @map("total_parts_cost")
  totalLaborCost  Float            @default(0) @map("total_labor_cost")
  
  createdBy       String?          @map("created_by")
  assignedTechId  Int?             @map("assigned_tech_id")
  approvedBy      String?          @map("approved_by")
  createdAt       DateTime         @default(now()) @map("created_at")
  updatedAt       DateTime         @updatedAt @map("updated_at")

  tasks           WorkOrderTask[]

  @@map("work_orders")
  @@index([tenantId, organizationId])
  @@index([vehicleId])
  @@index([workshopId])
  @@index([status])
}

/// Itemized Task inside a Work Order
model WorkOrderTask {
  id           Int        @id @default(autoincrement())
  workOrderId  String     @map("work_order_id")
  workOrder    WorkOrder  @relation(fields: [workOrderId], references: [id], onDelete: Cascade)
  taskName     String     @map("task_name")
  description  String?
  assignedToId Int?       @map("assigned_to_id")
  assignedTo   User?      @relation(fields: [assignedToId], references: [id])
  status       String     @default("PENDING")                            // PENDING, IN_PROGRESS, DONE
  estimatedMin Int?       @map("estimated_min")
  actualMin    Int?       @map("actual_min")
  createdAt    DateTime   @default(now()) @map("created_at")
  updatedAt    DateTime   @updatedAt @map("updated_at")

  @@map("work_order_tasks")
  @@index([workOrderId])
}

/// Preventative Maintenance Schedule Trigger
model MaintenanceSchedule {
  id             String    @id @default(uuid()) @map("schedule_id")
  tenantId       String    @default("TNT-DEFAULT") @map("tenant_id")
  organizationId String    @default("ORG-DEFAULT") @map("organization_id")
  vehicleClass   String    @map("vehicle_class")                        // e.g. "Heavy Truck"
  serviceName    String    @map("service_name")                          // e.g. "A-Service 10K Odometer"
  intervalKm     Int?      @map("interval_km")                           // e.g. 10000
  intervalDays   Int?      @map("interval_days")                         // e.g. 90
  isActive       Boolean   @default(true) @map("is_active")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  @@map("maintenance_schedules")
  @@index([tenantId, organizationId])
  @@index([vehicleClass])
}
```

---

## 3. Version-Controlled Migration Plan

- **Target Migration Folder**: `backend/prisma/migrations/20260815000000_phase3_workshop_intelligence/`
- **Migration Script Name**: `migration.sql`
- **Execution Command**:
  ```bash
  npx prisma migrate resolve --applied 20260815000000_phase3_workshop_intelligence
  npx prisma db push
  npx prisma migrate status
  npx prisma generate
  ```
- **Data Safety**: All table additions are purely additive. Existing `vehicles`, `workshops`, `tyres`, `tyre_defects`, `users`, `drivers`, `vehicle_downtimes` remain 100% backward compatible.
