# FI360 Phase 2 — Vertical Slice Contract Specification

This document defines the formal domain contracts, data ownership boundaries, event contracts, and policy abstractions for **FI360 Phase 2: Fleet & Asset + Tyre Vertical Slice**.

---

## 1. Domain Ownership & Boundaries

| Domain | Master Entity Owned | Source of Truth | Permitted Foreign References | Events Produced |
| :--- | :--- | :--- | :--- | :--- |
| **Platform Identity** | `Tenant`, `Organization`, `LegalEntity` | `tenants`, `organizations`, `legal_entities` | User Accounts | `tenant.created` |
| **Location / Workshop**| `Workshop`, `VehicleWorkshopAssignment` | `workshops`, `vehicle_workshop_assignments` | `Vehicle`, `User` | `vehicle.workshop.transferred` |
| **Fleet & Asset** | `Vehicle`, `VehicleDowntime`, `GroundingPolicy` | `vehicles`, `vehicle_downtimes` | `Tenant`, `Organization`, `Workshop` | `vehicle.created`, `vehicle.grounded`, `vehicle.recovered` |
| **Tyre Intelligence** | `Tyre`, `TyreFitment`, `TyreInspection`, `TyreDefect` | `tyres`, `tyre_fitments`, `tyre_defects` | `Vehicle`, `Workshop`, `User` | `tyre.registered`, `tyre.fitted`, `tyre.inspected`, `tyre.removed`, `tyre.defect.critical`, `tyre.scrapped` |
| **Shared Platform** | `KpiGovernance`, `UniversalReport`, `AuditLog` | `kpis`, `reports`, `audit_logs` | All Domains | `approval.decided`, `report.generated` |

---

## 2. Vehicle Grounding Policy Abstraction

Grounding is **POLICY-DRIVEN** and never hard-coded.

```typescript
export interface VehicleGroundingPolicy {
  policyId: string;
  tenantId: string;
  organizationId?: string;
  vehicleClass?: string;          // e.g. "Heavy Truck", "Trailer", "All"
  defectCategory: string;          // e.g. "TYRE_CRITICAL_TREAD", "TYRE_BURST_RISK"
  severityThreshold: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isAutomaticGrounding: boolean;   // if true, grounds automatically upon defect
  requiresApproval: boolean;       // if true, routes through ApprovalWorkflowService
  effectiveFrom: string;
}
```

### Policy Evaluation Rules:
1. When a `TyreDefect` with severity `CRITICAL` or `HIGH` is logged:
2. The `FleetGroundingPolicyService` matches the defect against active policies for the vehicle's `organizationId` and `vehicleClass`.
3. If `isAutomaticGrounding = true` and `requiresApproval = false`, the vehicle transitions to `GROUNDED` immediately and opens a `VehicleDowntime` ledger record.
4. If `requiresApproval = true`, an approval request is generated via `ApprovalWorkflowService` enforcing segregation of duties (`requesterId !== approverId`).

---

## 3. Vehicle Downtime Domain Ledger Contract

```prisma
model VehicleDowntime {
  id               String    @id @default(uuid()) @map("downtime_id")
  vehicleId        String    @map("vehicle_id")
  vehicle          Vehicle   @relation(fields: [vehicleId], references: [id])
  tenantId         String    @default("TNT-DEFAULT") @map("tenant_id")
  organizationId   String    @default("ORG-DEFAULT") @map("organization_id")
  workshopId       String?   @map("workshop_id")
  workshop         Workshop? @relation(fields: [workshopId], references: [id])
  downtimeType     String    @default("UNPLANNED") @map("downtime_type")
  reason           String
  sourceDomain     String    @default("TYRE_INTELLIGENCE") @map("source_domain")
  sourceEntityId   String?   @map("source_entity_id")
  startedAt        DateTime  @default(now()) @map("started_at")
  acknowledgedAt   DateTime? @map("acknowledged_at")
  recoveredAt      DateTime? @map("recovered_at")
  durationMinutes  Int?      @map("duration_minutes")
  responsibleParty String?   @map("responsible_party")
  defectId         Int?      @map("defect_id")
  defect           TyreDefect? @relation(fields: [defectId], references: [id])
  startedBy        String?   @map("started_by")
  recoveredBy      String?   @map("recovered_by")
  createdAt        DateTime  @default(now()) @map("created_at")

  @@map("vehicle_downtimes")
  @@index([vehicleId])
  @@index([tenantId])
  @@index([workshopId])
}
```

---

## 4. Standardized Domain Event Envelope Contract

All events emitted during the vertical slice conform strictly to the standard envelope:

```typescript
export interface FI360DomainEventEnvelope<T = any> {
  eventId: string;          // e.g. "EVT-1786689000000-123"
  eventType: string;        // e.g. "vehicle.grounded"
  eventVersion: string;     // e.g. "1.0"
  tenantId: string;         // e.g. "TNT-DEFAULT"
  organizationId?: string;  // e.g. "ORG-DEFAULT"
  entityId: string;         // e.g. "VEH-001"
  entityType: string;       // e.g. "Vehicle"
  occurredAt: string;       // ISO 8601 Timestamp
  actorId?: string;         // User ID of performer
  correlationId?: string;   // Trace correlation ID
  payload: T;
}
```

---

## 5. End-to-End Vertical Slice Flow

```
Tyre Critical Defect Logged
       ↓
FleetGroundingPolicy Evaluated (Severity: CRITICAL, Auto: TRUE)
       ↓
ApprovalWorkflowService Verified (Segregation of Duties Checked if required)
       ↓
Vehicle Status -> GROUNDED
       ↓
VehicleDowntime Record Opened (sourceDomain: TYRE_INTELLIGENCE)
       ↓
Event Emitted: vehicle.grounded
       ↓
Tyre Repair / Replacement Completed
       ↓
Defect Status -> RESOLVED
       ↓
Vehicle Status -> ACTIVE
       ↓
VehicleDowntime Closed (recoveredAt, durationMinutes calculated)
       ↓
Event Emitted: vehicle.recovered
       ↓
Governed KPIs & Universal Reports Evaluated via KpiGovernanceService & UniversalReportService
```
