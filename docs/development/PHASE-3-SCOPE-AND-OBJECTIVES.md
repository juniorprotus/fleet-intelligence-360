# FI360 Phase 3 — Scope & Objectives Specification

**Document ID**: `FI360-PHASE3-SCOPE-AND-OBJECTIVES-v1.0`  
**Phase Target**: Phase 3 — Workshop Intelligence & Preventative Maintenance Scheduling  
**Date**: August 14, 2026  
**Status**: APPROVED SPECIFICATION — READY FOR PRE-CODE REVIEW  

---

## 1. Executive Summary & Context

With Phase 1 (Platform Foundation Hardening) and Phase 2 (Fleet & Asset + Tyre Vertical Slice) fully closed and certified, **Phase 3 introduces Workshop Intelligence & Maintenance Scheduling**.

In Phase 2, critical defects (e.g., severe tyre tread wear or sidewall damage) invoke the central Fleet Grounding Policy Engine, transitioning the vehicle status to `GROUNDED` and opening an active `VehicleDowntime` ledger record. 

Phase 3 completes the operational loop by establishing the **Workshop Maintenance & Work Order Execution Engine**:
1. Grounded vehicles and reported defects automatically generate or link to a formal **Workshop Work Order** (`WorkOrder`).
2. Workshop Supervisors assign work orders to qualified Technicians (`WorkOrderTask`).
3. Maintenance activities, spare parts requests (tyre casings/valves), labor hours, and repair actions are tracked in an auditable ledger.
4. Maintenance completion triggers a **Quality & Safety Sign-off**, invoking `ApprovalWorkflowService` (when required) before authorizing `VehicleService.recoverVehicle()` to close the downtime ledger and restore status to `ACTIVE`.

---

## 2. Logical Progression from Phases 1 & 2

```
PHASE 1 FOUNDATION
[Tenants, Orgs, Drivers, Events, Workflow, Audit, Scope]
       ↓
PHASE 2 VERTICAL SLICE
[Fleet Vehicle Master, Grounding Policy Engine, VehicleDowntime Ledger, GROUNDED Status]
       ↓
PHASE 3 WORKSHOP INTELLIGENCE (THIS PHASE)
[Workshop Work Orders, Maintenance Schedules, Technician Assignment, Quality Sign-off, Recovery Integration]
```

Phase 3 is the mandatory bridge between defect detection (Tyre Intelligence), grounding governance (Fleet & Asset), and operational recovery.

---

## 3. Explicit In-Scope Capabilities

1. **Work Order Lifecycle Management (`WorkOrder`)**:
   - Automated creation from Grounding Events and Critical Tyre Defects.
   - Manual work order creation by Workshop Managers / Fleet Supervisors.
   - States: `DRAFT`, `SCHEDULED`, `IN_PROGRESS`, `PENDING_APPROVAL`, `COMPLETED`, `CANCELLED`.
2. **Technician Task Assignment (`WorkOrderTask`)**:
   - Task allocation to specific Workshop Technicians.
   - Estimated vs. actual labor hours and task status tracking (`PENDING`, `IN_PROGRESS`, `DONE`).
3. **Preventative Maintenance Scheduling (`MaintenanceSchedule`)**:
   - Distance-based (odometer) and time-based (calendar) PM service intervals.
   - PM triggers for routine tyre rotations, wheel alignment, and safety inspections.
4. **Workshop Quality & Safety Sign-off (`ApprovalWorkflowService` Integration)**:
   - Mandatory sign-off for safety-critical repairs before vehicle status recovery.
   - Segregation of duties enforcement (`technicianId !== approverId`).
5. **Downtime Ledger Integration (`VehicleDowntime` Linking)**:
   - Linking Work Orders directly to open `VehicleDowntime` records (`workOrderId` reference).
   - Closing downtime upon formal work order completion and recovery sign-off.
6. **Shared Service Consumption**:
   - **Event Publisher**: Emitting `workorder.created`, `workorder.assigned`, `workorder.completed`, `workorder.approved`.
   - **KPI Governance**: Governing Workshop KPIs (`WORKSHOP_UTILIZATION`, `MEAN_TIME_TO_REPAIR`, `WORK_ORDER_BACKLOG`).
   - **Universal Reporting**: Generating Work Order Summary & Maintenance Compliance executive PDF/CSV reports.

---

## 4. Explicit Out-of-Scope Capabilities (Deferred to Later Phases)

To maintain vertical slice focus and prevent scope creep, the following are **EXPLICITLY EXCLUDED** from Phase 3:
- ❌ Full Spare Parts Inventory & Warehouse Management (Procurement Intelligence domain).
- ❌ Telematics CAN-bus automated diagnostic trouble code (DTC) ingestion (Telematics Intelligence domain).
- ❌ Third-party vendor invoicing and external workshop billing engines (Financial Intelligence domain).
- ❌ Fuel tank telemetry and driver behavior scoring (Fuel & Safety Intelligence domains).

---

## 5. Domain Ownership & Boundaries

- **Domain Owner**: **Workshop Intelligence Domain** (`backend/src/workshop/`).
- **Master Data Ownership**:
  - `Vehicle` remains 100% owned by **Fleet & Asset Domain**.
  - `Workshop` remains 100% owned by **Fleet & Asset Domain**.
  - `User` / `Driver` remain 100% owned by **Platform Foundation**.
  - `TyreDefect` / `Tyre` remain 100% owned by **Tyre Intelligence Domain**.
  - `WorkOrder`, `WorkOrderTask`, `MaintenanceSchedule` are owned by **Workshop Intelligence Domain**.
