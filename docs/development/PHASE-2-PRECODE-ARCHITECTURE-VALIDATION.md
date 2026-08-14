# FI360 Phase 2 — Pre-Code Architecture Validation Report

**Date**: 2026-08-14  
**Target Module**: FI360 Fleet & Asset + Tyre Intelligence Vertical Slice  
**Auditor**: FI360 Principal Platform Architect  
**Validation Policy**: **PRE-CODE VALIDATION ONLY — ZERO SOURCE CODE OR DATABASE MUTATIONS.**  

---

## 1. Architecture Validation Result

The grounding policy design and `VehicleDowntime` domain ledger architecture have been thoroughly validated against **FI360 Architecture Standards v3.0**.

### Key Validation Outcomes:
1. **Fleet & Asset Master Ownership**: `VehicleDowntime` is owned 100% by the **Fleet & Asset Domain**. Tyre Intelligence, Workshop Intelligence, Safety, Telematics, and Compliance do **NOT** own downtime records; they publish events or invoke the central Fleet Grounding Policy Service.
2. **Policy-Driven Grounding Engine**: Grounding is strictly policy-driven via `VehicleGroundingPolicy`. Hardcoded defect-to-grounding rules are forbidden.
3. **Idempotency Guarantee**: Repeated grounding requests for an already grounded vehicle will **NOT** create duplicate open downtime records. The service returns the existing open `VehicleDowntime` record.
4. **Recovery Rules**: Recovery requests target the active open downtime record for the vehicle, recording `recoveredAt` timestamp, calculating `durationMinutes`, and transitioning status to `ACTIVE`.
5. **Segregation of Duties**: When `requiresApproval = true`, `ApprovalWorkflowService` enforces `requesterId !== approverId`.

---

## 2. Proposed Final Data Model

### A. Grounding Policy Model (`schema.prisma`)
```prisma
model VehicleGroundingPolicy {
  id                   String   @id @default(uuid()) @map("policy_id")
  tenantId             String   @default("TNT-DEFAULT") @map("tenant_id")
  organizationId       String   @default("ORG-DEFAULT") @map("organization_id")
  name                 String   @default("Standard Fleet Grounding Policy")
  vehicleClass         String?  @map("vehicle_class")         // e.g. "Heavy Truck", "ALL"
  defectCategory       String   @map("defect_category")       // e.g. "TYRE_CRITICAL_TREAD", "BRAKE_FAILURE"
  severityThreshold    String   @default("CRITICAL") @map("severity_threshold")
  isAutomaticGrounding Boolean  @default(true) @map("is_automatic_grounding")
  requiresApproval     Boolean  @default(false) @map("requires_approval")
  effectiveFrom        DateTime @default(now()) @map("effective_from")
  createdAt            DateTime @default(now()) @map("created_at")

  @@map("vehicle_grounding_policies")
  @@index([tenantId])
  @@index([organizationId])
}
```

### B. Vehicle Downtime Domain Ledger Model (`schema.prisma`)
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

## 3. Domain Ownership Matrix

| Domain | Entity Owned | Source of Truth | Permitted Operations | Events Produced |
| :--- | :--- | :--- | :--- | :--- |
| **Fleet & Asset** | `Vehicle`, `VehicleDowntime`, `VehicleGroundingPolicy` | `vehicles`, `vehicle_downtimes` | Grounding, Recovery, Workshop Transfer | `vehicle.grounded`, `vehicle.recovered` |
| **Location / Workshop**| `Workshop`, `VehicleWorkshopAssignment` | `workshops`, `vehicle_workshop_assignments` | Assignment Ledger | `vehicle.workshop.transferred` |
| **Tyre Intelligence** | `Tyre`, `TyreFitment`, `TyreInspection`, `TyreDefect` | `tyres`, `tyre_fitments` | Defect logging, Repairs, Fitments | `tyre.defect.critical` |
| **Shared Platform** | `KpiGovernance`, `UniversalReport`, `AuditLog` | `kpis`, `reports`, `audit_logs` | Evaluation, Export, Logging | `approval.decided`, `report.generated` |

---

## 4. Standard Event Contracts

```typescript
// vehicle.grounded
{
  eventId: "EVT-1786689500000-101",
  eventType: "vehicle.grounded",
  eventVersion: "1.0",
  tenantId: "TNT-DEFAULT",
  organizationId: "ORG-DEFAULT",
  entityId: "VEH-KCA123A",
  entityType: "Vehicle",
  occurredAt: "2026-08-14T09:30:00.000Z",
  actorId: "supervisor@fi360.com",
  payload: {
    vehicleId: "VEH-KCA123A",
    downtimeId: "DT-98765",
    sourceDomain: "TYRE_INTELLIGENCE",
    reason: "Critical Tyre Defect (Tread 1.5mm)",
    workshopId: "WS-NBI-01"
  }
}

// vehicle.recovered
{
  eventId: "EVT-1786689600000-102",
  eventType: "vehicle.recovered",
  eventVersion: "1.0",
  tenantId: "TNT-DEFAULT",
  organizationId: "ORG-DEFAULT",
  entityId: "VEH-KCA123A",
  entityType: "Vehicle",
  occurredAt: "2026-08-14T10:45:00.000Z",
  actorId: "supervisor@fi360.com",
  payload: {
    vehicleId: "VEH-KCA123A",
    downtimeId: "DT-98765",
    durationMinutes: 75,
    recoveredBy: "supervisor@fi360.com"
  }
}
```

---

## 5. API Contracts

| Method | Endpoint | Authorization | DataScope | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/vehicles/:id/transfer-workshop` | `FLEET_MANAGER` | `ORGANISATION` | Transfer vehicle workshop & log assignment |
| `GET` | `/api/v1/vehicles/:id/workshop-history` | `FLEET_MANAGER` | `ORGANISATION` | Query vehicle workshop transfer history |
| `POST` | `/api/v1/vehicles/:id/ground` | `WORKSHOP_MANAGER` | `WORKSHOP` | Evaluate grounding policy & ground vehicle |
| `POST` | `/api/v1/vehicles/:id/recover` | `WORKSHOP_MANAGER` | `WORKSHOP` | Close open downtime & recover vehicle |
| `GET` | `/api/v1/vehicles/downtime-summary` | `FLEET_MANAGER` | `ORGANISATION` | Query active & historical downtime ledgers |

---

## 6. Security & Authorization Matrix

| User Role | Can View Vehicles | Can Transfer Workshop | Can Ground Vehicle | Can Approve Grounding | Can Recover Vehicle |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `SUPER_ADMIN` | YES | YES | YES | YES | YES |
| `CEO` | YES | READ ONLY | READ ONLY | READ ONLY | READ ONLY |
| `FLEET_MANAGER` | YES | YES | YES | YES | YES |
| `WORKSHOP_MANAGER` | YES (Scope) | YES (Scope) | YES (Scope) | YES (Scope) | YES (Scope) |
| `TYRE_SUPERVISOR` | YES (Scope) | NO | YES (Defect) | YES (Workflow) | YES (Scope) |
| `TYRE_TECHNICIAN` | YES (Scope) | NO | REQUEST ONLY | NO | NO |
| `FINANCE_MANAGER` | YES | READ ONLY | NO | NO | NO |
| `DRIVER` | OWN VEHICLE | NO | NO | NO | NO |
| `AUDITOR` | READ ONLY | READ ONLY | READ ONLY | READ ONLY | READ ONLY |

---

## 7. 22-Step E2E Test Design

1. Platform Scope Verification (`TNT-DEFAULT`, `ORG-DEFAULT`)
2. Vehicle Master Registration (`KCA 123A`)
3. Workshop Entity Verification (`WS-NBI-01`)
4. Workshop Transfer (`VehicleWorkshopAssignment` recorded)
5. Workshop Transfer History Query
6. Tyre Registration (`TYR-000001`)
7. Tyre Fitment (`AX1-L`)
8. Tyre Inspection Logging
9. Tyre Defect Logging
10. Defect Severity Escalation (`CRITICAL`)
11. Grounding Policy Evaluation (`isAutomaticGrounding = true`)
12. Approval Verification via `ApprovalWorkflowService`
13. Vehicle Status Transition to `GROUNDED`
14. `VehicleDowntime` Record Creation (`startedAt` logged)
15. Idempotency Check (Repeated grounding returns existing open downtime)
16. Tyre Replacement & Defect Resolution
17. Vehicle Recovery Call (`Vehicle.vehicleStatus -> ACTIVE`)
18. `VehicleDowntime` Close (`recoveredAt`, `durationMinutes` calculated)
19. Domain Event Envelope Verification (`vehicle.grounded`, `vehicle.recovered`)
20. Central Audit Log Verification
21. Governed KPI Evaluation via `KpiGovernanceService`
22. Universal Report Generation (PDF/CSV/XLSX)

---

## 8. Identified Gaps & Phase 2 v2.0 Enhancements

- **Enhancement 1**: Added `VehicleGroundingPolicy` model to `schema.prisma`.
- **Enhancement 2**: Added explicit idempotency handling in `VehicleService.groundVehicle()`.
- **Enhancement 3**: Injected `ApprovalWorkflowService` into `VehicleService` for policy approval checks.

---

## 9. Final Gate Recommendation

> ### **FINAL RECOMMENDATION: GO FOR PHASE 2 IMPLEMENTATION**
