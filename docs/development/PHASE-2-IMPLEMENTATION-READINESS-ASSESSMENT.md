# FI360 Phase 2 — Fleet & Asset + Tyre Vertical Slice Implementation Readiness Assessment (Revised v2.0)

**Date**: 2026-08-14  
**Status**: **REVISED IMPLEMENTATION PLAN & READINESS ASSESSMENT**  
**Phase 2 Target**: **Policy-Driven Fleet & Asset + Tyre + Workshop + Downtime Vertical Slice**  

---

## 1. Executive Summary

This document presents the revised implementation readiness assessment for **FI360 Phase 2: Fleet & Asset + Tyre Vertical Slice**.
Following architectural review, Phase 2 incorporates:
1. **Policy-Driven Vehicle Grounding**: Grounding decisions process through `VehicleGroundingPolicy` configurations.
2. **Domain Ledger `VehicleDowntime`**: Implements complete domain fields (`downtimeId`, `tenantId`, `organizationId`, `workshopId`, `sourceDomain`, `defectId`, `startedAt`, `recoveredAt`, `durationMinutes`).
3. **Approval Integration**: Uses `ApprovalWorkflowService` enforcing segregation of duties (`requesterId !== approverId`) when grounding policy requires approval.
4. **Tested Domain Events**: E2E verification of 10-field standard event envelope (`eventId`, `eventType`, `eventVersion`, `tenantId`, `organizationId`, `entityId`, `entityType`, `occurredAt`, `actorId`, `payload`).
5. **Strict Scope Control**: Phase 2 is strictly limited to the initial vertical slice (Zero unapproved domain expansions).

---

## 2. Current Repository State & Classification

| Capability / Module | Current Implementation State | Classification |
| :--- | :--- | :--- |
| **Tyre Intelligence** | 100% Functional, 7-Day Scheduler, Work Queues, Governed KPIs | **IMPLEMENTED** |
| **Universal Reporting** | 15 Metadata Fields, Level 1–3 Catalogue, PDF/CSV/XLSX | **IMPLEMENTED** |
| **KPI Governance** | 22-Field Contract Engine (`KpiGovernanceService`) | **IMPLEMENTED** |
| **Domain Events** | Standard Event Envelope (`EventPublisherService`) | **IMPLEMENTED** |
| **Approval Workflow** | Segregation of Duties (`ApprovalWorkflowService`) | **IMPLEMENTED** |
| **Audit Engine** | Interceptor & `audit_logs` table (`AuditModule`) | **IMPLEMENTED** |
| **Vehicle Master** | Basic CRUD in `VehicleService`, `vehicles` table | **PARTIALLY IMPLEMENTED** |
| **Workshop Ledger** | Model `VehicleWorkshopAssignment` in Prisma | **PARTIALLY IMPLEMENTED** |
| **Driver Master** | Model `Driver` in Prisma schema (Separate from User) | **PARTIALLY IMPLEMENTED** |
| **Grounding Policy** | Policy-driven grounding engine | **NEW FOR PHASE 2** |
| **Downtime Ledger** | Domain ledger `VehicleDowntime` in Prisma | **NEW FOR PHASE 2** |

---

## 3. Policy-Driven Vehicle Grounding Architecture

Grounding is **POLICY-DRIVEN** and never hard-coded.

- **Grounding Policy Contract**:
  - `policyId` (String UUID)
  - `tenantId` (String)
  - `organizationId` (String)
  - `vehicleClass` (String, e.g. "Heavy Truck", "ALL")
  - `defectCategory` (String, e.g. "TYRE_CRITICAL_TREAD", "TYRE_BURST_RISK")
  - `severityThreshold` ("CRITICAL" | "HIGH")
  - `isAutomaticGrounding` (Boolean)
  - `requiresApproval` (Boolean)
- **Workflow Approval**: If `requiresApproval = true`, the grounding request routes through `ApprovalWorkflowService`, checking `requesterId !== approverId`.

---

## 4. Domain Ledger `VehicleDowntime` Model

```prisma
model VehicleDowntime {
  id               String      @id @default(uuid()) @map("downtime_id")
  vehicleId        String      @map("vehicle_id")
  vehicle          Vehicle     @relation(fields: [vehicleId], references: [id])
  tenantId         String      @default("TNT-DEFAULT") @map("tenant_id")
  organizationId   String      @default("ORG-DEFAULT") @map("organization_id")
  workshopId       String?     @map("workshop_id")
  workshop         Workshop?   @relation(fields: [workshopId], references: [id])
  downtimeType     String      @default("UNPLANNED") @map("downtime_type")
  reason           String
  sourceDomain     String      @default("TYRE_INTELLIGENCE") @map("source_domain")
  sourceEntityId   String?     @map("source_entity_id")
  startedAt        DateTime    @default(now()) @map("started_at")
  acknowledgedAt   DateTime?   @map("acknowledged_at")
  recoveredAt      DateTime?   @map("recovered_at")
  durationMinutes  Int?        @map("duration_minutes")
  responsibleParty String?     @map("responsible_party")
  defectId         Int?        @map("defect_id")
  defect           TyreDefect? @relation(fields: [defectId], references: [id])
  startedBy        String?     @map("started_by")
  recoveredBy      String?     @map("recovered_by")
  createdAt        DateTime    @default(now()) @map("created_at")

  @@map("vehicle_downtimes")
  @@index([vehicleId])
  @@index([tenantId])
  @@index([workshopId])
}
```

---

## 5. Expanded E2E Certification Test Suite (22 Required Steps)

1. **Platform Scope**: Verify `TNT-DEFAULT` and `ORG-DEFAULT` data scope context.
2. **Vehicle Registration**: Register Vehicle `KCA 123A` in Fleet Master.
3. **Workshop Creation**: Verify Workshop `WS-NBI-01` entity.
4. **Workshop Transfer**: Transfer vehicle to `WS-NBI-01` (`VehicleWorkshopAssignment` ledger recorded).
5. **Assignment History**: Query vehicle workshop transfer history.
6. **Tyre Registration**: Register physical Tyre `TYR-000001`.
7. **Tyre Fitment**: Fit tyre to position `AX1-L`.
8. **Tyre Inspection**: Log routine 7-day inspection readings.
9. **Tyre Defect Logging**: Log defect on tyre `TYR-000001`.
10. **Critical Severity**: Set defect severity to `CRITICAL` (Tread depth 1.5mm).
11. **Grounding Policy Evaluation**: Evaluate policy (`isAutomaticGrounding = true`).
12. **Approval Verification**: Verify `ApprovalWorkflowService` segregation of duties.
13. **Vehicle Grounding**: Transition vehicle status to `GROUNDED`.
14. **Downtime Ledger Opened**: Verify `VehicleDowntime` record opened with `startedAt`.
15. **Tyre Replacement**: Replace tyre and resolve defect.
16. **Vehicle Recovery**: Transition vehicle status to `ACTIVE`.
17. **Downtime Ledger Closed**: Verify `recoveredAt` timestamp and `durationMinutes` calculated.
18. **Domain Events Certification**: Verify 10-field event envelope on `vehicle.grounded` and `vehicle.recovered`.
19. **Audit Trail Certification**: Verify audit logs recorded for all operations.
20. **KPI Governance Certification**: Verify 19/19 KPIs evaluated via `KpiGovernanceService`.
21. **Universal Report Generation**: Generate Level 3 Executive Report (PDF/CSV/XLSX).
22. **Tyre Domain Regression**: Verify 100% Tyre capabilities functional without regression.

---

## 6. Revised Development Sequence (Phases 2A through 2H)

- **Phase 2A**: Prisma Data Model (`VehicleDowntime` model + versioned migration `20260814090000_phase2_downtime_ledger`).
- **Phase 2B**: Vehicle Workshop Transfer API & History Ledger (`POST /api/v1/vehicles/:id/transfer-workshop`).
- **Phase 2C**: Policy-Driven Vehicle Grounding & Downtime API (`POST /api/v1/vehicles/:id/ground`, `/recover`).
- **Phase 2D**: Event Integration & Verification (`vehicle.grounded`, `vehicle.recovered`).
- **Phase 2E**: UI Vertical Slice Integration (Grounding Banner, Workshop Transfer Modal).
- **Phase 2F**: Expanded 22-Step E2E Certification Script (`scratch/test-phase2-vertical-slice.js`).
- **Phase 2G**: KPI & Universal Report Certification.
- **Phase 2H**: Final Phase 2 Gate Report.

---

## 7. Recommended Phase 2 Gate Status

> **STATUS: REVISED PLAN COMPLETED — READY FOR USER APPROVAL & PHASE 2A EXECUTION**
