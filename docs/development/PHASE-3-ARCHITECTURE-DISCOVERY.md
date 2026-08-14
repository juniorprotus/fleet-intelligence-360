# FI360 Phase 3 — Architecture Discovery & Baseline Assessment

**Document ID**: `FI360-PHASE3-ARCHITECTURE-DISCOVERY-v1.0`  
**Date**: August 14, 2026  
**Status**: APPROVED SPECIFICATION — VERIFICATION COMPLETE  

---

## 1. Existing Repository Inventory Audit

An exhaustive repository scan was conducted to map all existing core platform assets, domain modules, database tables, and shared services available to host Phase 3.

### Discovered Infrastructure & Core Capabilities:
1. **Multi-Tenant & Scope Hierarchy (`backend/prisma/schema.prisma`)**:
   - `Tenant` (`tenants` table) — Top-level isolation (`TNT-DEFAULT`).
   - `Organization` (`organizations` table) — Organizational scope (`ORG-DEFAULT`).
   - `LegalEntity` (`legal_entities` table) — Legal entity & currency (`LEG-DEFAULT`).
   - `Region` & `Depot` — Modeled as scoped strings on `Vehicle` and `Workshop` entities.
   - `Workshop` (`workshops` table) — Physical workshop locations.
2. **Fleet & Asset Domain Assets**:
   - `Vehicle` (`vehicles` table) — Authoritative vehicle master containing `vehicleStatus` (`ACTIVE`, `INACTIVE`, `MAINTENANCE`, `GROUNDED`, `DISPOSED`, `SOLD`).
   - `VehicleWorkshopAssignment` (`vehicle_workshop_assignments` table) — Immutable workshop transfer ledger.
   - `VehicleGroundingPolicy` (`vehicle_grounding_policies` table) — Central grounding rules engine.
   - `VehicleDowntime` (`vehicle_downtimes` table) — Operational downtime ledger tracking start, acknowledgment, recovery, and duration.
3. **Tyre Intelligence Domain Assets**:
   - `Tyre`, `TyrePosition`, `TyreFitment`, `TyreInspection`, `TyreMovement`, `TyreDefect`.
4. **Shared Platform Services (`backend/src/`)**:
   - `AuthModule` & `PermissionsGuard` — JWT authentication and RBAC permission token matrix.
   - `DataScopeService` — Scoped database filtering (`SYSTEM`, `ORGANISATION`, `REGION`, `WORKSHOP`, `DEPOT`).
   - `ApprovalWorkflowService` — Central approval and segregation-of-duties validation (`requesterId !== approverId`).
   - `EventPublisherService` — Node `EventEmitter` wrapping standardized 10-field domain event envelopes.
   - `AuditInterceptor` — Central mutation logging into `audit_logs` table.
   - `KpiGovernanceService` — 22-field KPI schema evaluation and 19 system governance KPIs.
   - `UniversalReportService` — 15-field report metadata catalogue and executive report generator.

---

## 2. Platform Entity Hierarchy Map

```
Tenant (TNT-DEFAULT)
  │
  ├── Organization (ORG-DEFAULT)
  │     │
  │     ├── Legal Entity (LEG-DEFAULT)
  │     │
  │     ├── Region (String: "Nairobi Region")
  │     │     │
  │     │     └── Depot (String: "Central Depot")
  │     │           │
  │     │           └── Workshop (Workshop Entity: WS-NBI-01)
  │     │                 │
  │     │                 ├── Vehicle (Vehicle Entity: KCA-2741X)
  │     │                 │     │
  │     │                 │     ├── VehicleDowntime (Downtime Ledger)
  │     │                 │     ├── VehicleWorkshopAssignment (Transfer Ledger)
  │     │                 │     ├── TyreFitment (Tyre Position Mapping)
  │     │                 │     └── WorkOrder (PHASE 3 WORKSHOP DOMAIN)
  │     │                 │           │
  │     │                 │           └── WorkOrderTask (Technician Assignment)
  │     │                 │
  │     │                 └── Users / Technicians (User Entity: WORKSHOP Scope)
```

> **Architecture Rule**: `Region` and `Depot` remain string attributes on `Vehicle` and `Workshop` models. They are NOT redesigned as separate database tables in Phase 3.

---

## 3. Existing Shared Capabilities Consumption Plan for Phase 3

Phase 3 **MUST NOT** build duplicate infrastructure. It will consume existing platform capabilities as follows:

| Platform Capability | Consuming Component | Consumption Pattern |
| :--- | :--- | :--- |
| **Authentication & RBAC** | `WorkshopController` | `@UseGuards(JwtAuthGuard, PermissionsGuard)` + `@RequirePermissions()` |
| **Data Scope Filtering** | `WorkshopService` | `DataScopeService.buildContext()` & `dataScopeService.vehicleWhere()` |
| **Approval Engine** | Quality Sign-off | `ApprovalWorkflowService.validateSegregationOfDuties(techId, supervisorId)` |
| **Domain Event Publishing** | Work Order Events | `EventPublisherService.publish({ eventType: 'workorder.completed', ... })` |
| **Central Audit Logging** | Work Order Mutations | `AuditInterceptor` automatically intercepts POST/PUT endpoints |
| **KPI Governance** | Workshop KPIs | `KpiGovernanceService.calculateKPI()` with 22-field contract |
| **Universal Reporting** | Workshop Reports | `UniversalReportService.generateReport()` with 15-field metadata |
