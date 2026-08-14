# FI360 Phase 5 — Data Model & Migration Design Specification

**Document ID**: `FI360-PHASE5-DATA-MODEL-DESIGN-v1.0`  
**Date**: August 14, 2026  
**Status**: APPROVED SPECIFICATION — MIGRATION PLAN ONLY (ZERO CODE MUTATION AT THIS STAGE)  

---

## 1. Overview

Phase 5 introduces 5 new database entities to support Driver Shift Assignments, Pre-Trip/Post-Trip Inspections, Safety Incidents, and Driver Safety Scores:
1. **`DriverAssignment`** (`driver_assignments` table) — Shift assignment ledger linking drivers to vehicles.
2. **`TripInspection`** (`trip_inspections` table) — Digital Pre-Trip and Post-Trip vehicle inspection forms.
3. **`InspectionItemResult`** (`inspection_item_results` table) — Itemized inspection checklist items (tyres, brakes, lights, fluids).
4. **`SafetyIncident`** (`safety_incidents` table) — Safety violation & incident records (harsh braking, over-speeding, near-misses).
5. **`DriverSafetyScore`** (`driver_safety_scores` table) — Monthly rolling safety scores for drivers.

---

## 2. Detailed Entity Models (Proposed Prisma Schema)

```prisma
// ============================================================
// PHASE 5 — DRIVER & SAFETY INTELLIGENCE
// ============================================================

enum InspectionType {
  PRE_TRIP
  POST_TRIP
  ROUTINE_SAFETY
}

enum InspectionStatus {
  PASSED
  FAILED_MINOR
  FAILED_CRITICAL
}

enum AssignmentStatus {
  ACTIVE
  COMPLETED
  CANCELLED
}

enum IncidentSeverity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

/// Driver Vehicle Shift Assignment Ledger
model DriverAssignment {
  id             String           @id @default(uuid()) @map("assignment_id")
  tenantId       String           @default("TNT-DEFAULT") @map("tenant_id")
  organizationId String           @default("ORG-DEFAULT") @map("organization_id")
  driverId       Int              @map("driver_id")
  driver         User             @relation(fields: [driverId], references: [id])
  vehicleId      String           @map("vehicle_id")
  vehicle        Vehicle          @relation(fields: [vehicleId], references: [id])
  
  shiftStart     DateTime         @map("shift_start")
  shiftEnd       DateTime?        @map("shift_end")
  status         AssignmentStatus @default(ACTIVE)
  startOdometer  Int              @map("start_odometer")
  endOdometer    Int?             @map("end_odometer")
  notes          String?
  createdAt      DateTime         @default(now()) @map("created_at")
  updatedAt      DateTime         @updatedAt @map("updated_at")

  @@map("driver_assignments")
  @@index([tenantId, organizationId])
  @@index([driverId])
  @@index([vehicleId])
  @@index([status])
}

/// Digital Pre-Trip / Post-Trip Vehicle Inspection
model TripInspection {
  id             String            @id @default(uuid()) @map("inspection_id")
  inspectionNo   String            @unique @map("inspection_no")                // e.g. "INSP-2026-0001"
  tenantId       String            @default("TNT-DEFAULT") @map("tenant_id")
  organizationId String            @default("ORG-DEFAULT") @map("organization_id")
  vehicleId      String            @map("vehicle_id")
  vehicle        Vehicle           @relation(fields: [vehicleId], references: [id])
  driverId       Int               @map("driver_id")
  driver         User              @relation(fields: [driverId], references: [id])
  
  type           InspectionType    @default(PRE_TRIP)
  status         InspectionStatus  @default(PASSED)
  odometer       Int
  hasDefects     Boolean           @default(false) @map("has_defects")
  isGrounded     Boolean           @default(false) @map("is_grounded")
  groundingReason String?          @map("grounding_reason")
  submittedAt    DateTime          @default(now()) @map("submitted_at")

  itemResults    InspectionItemResult[]

  @@map("trip_inspections")
  @@index([tenantId, organizationId])
  @@index([vehicleId])
  @@index([driverId])
  @@index([type])
}

/// Checklist item inside an inspection
model InspectionItemResult {
  id             Int            @id @default(autoincrement())
  inspectionId   String         @map("inspection_id")
  tripInspection TripInspection @relation(fields: [inspectionId], references: [id], onDelete: Cascade)
  
  category       String         // "TYRES", "BRAKES", "LIGHTS", "FLUIDS", "STEERING"
  itemName       String         @map("item_name")
  isPassed       Boolean        @map("is_passed")
  severity       IncidentSeverity @default(LOW)
  notes          String?

  @@map("inspection_item_results")
  @@index([inspectionId])
}

/// Driver Safety Incident Ledger
model SafetyIncident {
  id             String           @id @default(uuid()) @map("incident_id")
  incidentNo     String           @unique @map("incident_no")                  // e.g. "INC-2026-0001"
  tenantId       String           @default("TNT-DEFAULT") @map("tenant_id")
  organizationId String           @default("ORG-DEFAULT") @map("organization_id")
  driverId       Int              @map("driver_id")
  driver         User             @relation(fields: [driverId], references: [id])
  vehicleId      String           @map("vehicle_id")
  vehicle        Vehicle          @relation(fields: [vehicleId], references: [id])
  
  incidentType   String           @map("incident_type")                        // HARSH_BRAKING, OVER_SPEEDING, ACCIDENT
  severity       IncidentSeverity @default(MEDIUM)
  description    String
  occurredAt     DateTime         @map("occurred_at")
  pointsDeducted Int              @default(5) @map("points_deducted")
  createdAt      DateTime         @default(now()) @map("created_at")

  @@map("safety_incidents")
  @@index([tenantId, organizationId])
  @@index([driverId])
  @@index([vehicleId])
}

/// Monthly Rolling Driver Safety Score
model DriverSafetyScore {
  id             Int      @id @default(autoincrement())
  tenantId       String   @default("TNT-DEFAULT") @map("tenant_id")
  organizationId String   @default("ORG-DEFAULT") @map("organization_id")
  driverId       Int      @map("driver_id")
  driver         User     @relation(fields: [driverId], references: [id])
  
  periodMonth    String   @map("period_month")                                 // e.g. "2026-08"
  score          Float    @default(100.0)                                     // 0.0 to 100.0
  totalTrips     Int      @default(0) @map("total_trips")
  inspectionsPassed Int   @default(0) @map("inspections_passed")
  incidentsCount Int      @default(0) @map("incidents_count")
  updatedAt      DateTime @updatedAt @map("updated_at")

  @@unique([driverId, periodMonth])
  @@map("driver_safety_scores")
  @@index([tenantId, organizationId])
}
```

---

## 3. Version-Controlled Migration Plan

- **Folder**: `backend/prisma/migrations/20260817000000_phase5_driver_safety/`
- **Execution Command**:
  ```bash
  npx prisma migrate resolve --applied 20260817000000_phase5_driver_safety
  npx prisma db push
  npx prisma migrate status
  npx prisma generate
  ```
