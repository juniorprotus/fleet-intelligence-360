# FI360 Phase 5 — Scope & Objectives Specification

**Document ID**: `FI360-PHASE5-SCOPE-AND-OBJECTIVES-v1.0`  
**Phase Target**: Phase 5 — Driver & Safety Intelligence (Driver Assignments, Trip Inspections & Safety Slice)  
**Date**: August 14, 2026  
**Status**: APPROVED SPECIFICATION — DISCOVERY COMPLETE  

---

## 1. Executive Summary & Business Context

With Phase 1 (Platform Foundation), Phase 2 (Fleet & Asset + Tyre Vertical Slice), Phase 3 (Workshop Intelligence & PM Scheduling), and Phase 4 (Inventory & Procurement Intelligence) fully closed and certified, **Phase 5 introduces Driver & Safety Intelligence**.

In Phases 2–4, critical defects trigger policy-driven vehicle grounding, vehicle downtime ledgers, workshop work orders, and inventory spare parts requisitions. However, front-line vehicle operations rely on **Drivers** (`Driver` / `User`).

Phase 5 establishes the **Driver & Safety Intelligence Engine**:
1. Managing auditable driver-to-vehicle shift assignments (`DriverAssignment`).
2. Enforcing digital **Pre-Trip & Post-Trip Vehicle Inspections** (`TripInspection` & `InspectionItemResult`).
3. Allowing drivers to report defects directly via mobile/web forms (`DriverDefectReport`).
4. Automatically triggering `VehicleGroundingPolicy` evaluation when a Pre-Trip Inspection detects a safety-critical defect (e.g. blown steer tyre, failed brakes, fluid leak).
5. Logging safety incidents (`SafetyIncident`), calculating driver safety scores (`DriverSafetyScore`), and emitting domain events (`driver.assigned`, `inspection.completed`, `safety.incident_logged`).
6. Governing Phase 5 KPIs (`PRE_TRIP_COMPLIANCE_RATE`, `DRIVER_SAFETY_SCORE_AVG`, `DEFECT_REPORTING_LEAD_TIME`) via `KpiGovernanceService` and `UniversalReportService`.

---

## 2. Logical Progression from Phases 1–4

```
PHASE 1 FOUNDATION
[Tenants, Orgs, Drivers, Events, Workflow, Audit, DataScope]
       ↓
PHASE 2 FLEET & ASSET VERTICAL SLICE
[Fleet Vehicle Master, Grounding Policy Engine, VehicleDowntime Ledger, GROUNDED Status]
       ↓
PHASE 3 WORKSHOP INTELLIGENCE
[Work Orders, Maintenance Schedules, Technician Tasks, Quality Sign-off, Recovery Integration]
       ↓
PHASE 4 INVENTORY & PROCUREMENT INTELLIGENCE
[Inventory Stock Ledgers, Movement Ledgers, Parts Requisitions, Purchase Orders, Goods Receipt]
       ↓
PHASE 5 DRIVER & SAFETY INTELLIGENCE (THIS PHASE)
[Driver Shift Assignments, Pre/Post-Trip Digital Inspections, Safety Incidents, Driver Safety Scores]
```

Phase 5 completes the operational front-line feedback loop connecting driver daily shifts with vehicle safety grounding, workshop maintenance execution, and inventory stock management.

---

## 3. Explicit In-Scope Capabilities

1. **Driver Vehicle Shift Assignment Ledger (`DriverAssignment`)**:
   - Assigning drivers to specific vehicles for shifts (`ACTIVE`, `COMPLETED`).
   - Preventing double-assignment of drivers or vehicles during overlapping shifts.
2. **Digital Pre-Trip & Post-Trip Inspections (`TripInspection` & `InspectionItemResult`)**:
   - Structured checklist items (Tyre Tread & Pressure, Brakes, Lights, Steering, Fluids, Emergency Equipment).
   - Pass/Fail grading per checklist item with odometer capture and photo attachment references.
3. **Safety Grounding Trigger Integration**:
   - If a Pre-Trip Inspection item with severity `CRITICAL` fails, the system automatically invokes `VehicleService.groundVehicle()`, creating a `VehicleDowntime` record and triggering a Workshop `WorkOrder`.
4. **Driver Safety Incidents & Violation Scoring (`SafetyIncident` & `DriverSafetyScore`)**:
   - Recording safety incidents (harsh braking, over-speeding, near-misses, accidents).
   - Calculating monthly rolling driver safety scores.
5. **Shared Platform Service Consumption**:
   - **Event Publisher**: Emitting `driver.assigned`, `inspection.completed`, `safety.incident_logged`.
   - **KPI Governance**: Governing `PRE_TRIP_COMPLIANCE_RATE`, `DRIVER_SAFETY_SCORE_AVG`, `DEFECT_REPORTING_LEAD_TIME`.
   - **Universal Reporting**: Generating Driver Safety Compliance Executive PDF/CSV reports.

---

## 4. Explicit Out-of-Scope Capabilities (Deferred to Later Phases)

- ❌ Automated CAN-bus OBD-II telematics stream ingestion (Telematics Intelligence domain).
- ❌ External Driver License Authority API automated verification (External Integrations domain).

---

## 5. Master Data Ownership & Boundaries

- **Domain Owner**: **Driver & Safety Intelligence Domain** (`backend/src/driver/` & `backend/src/safety/`).
- **Master Data Ownership**:
  - `User`, `Driver`: Owned 100% by **Platform Core Foundation**.
  - `Vehicle`, `Workshop`: Owned 100% by **Fleet & Asset Domain**.
  - `Tyre`, `TyreDefect`: Owned 100% by **Tyre Intelligence Domain**.
  - `WorkOrder`, `WorkOrderTask`: Owned 100% by **Workshop Intelligence Domain**.
  - `InventoryItem`, `InventoryStock`: Owned 100% by **Inventory & Procurement Domain**.
  - `DriverAssignment`, `TripInspection`, `InspectionItemResult`, `SafetyIncident`, `DriverSafetyScore`: Owned 100% by **Driver & Safety Intelligence Domain**.
