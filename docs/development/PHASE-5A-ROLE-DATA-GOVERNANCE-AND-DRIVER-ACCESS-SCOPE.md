# FI360 Phase 5A — Role, Data Governance & Driver Safety Access Specification

**Document ID**: `FI360-PHASE5A-ROLE-DATA-GOVERNANCE-SCOPE-v1.0`  
**Date**: August 14, 2026  
**Status**: APPROVED SPECIFICATION  
**Scope**: Operational Permissions, Driver Vehicle Scoping, Data Entry Governance, and Controlled Historical Data Correction

---

## 1. Executive Summary & Objectives

FI360 Phase 5A strengthens the platform's operational accountability, data governance, and role-based access control (RBAC) boundaries by establishing formal operational permissions for Tyre Technicians and Tyre Supervisors, strict vehicle scoping for Drivers, and a controlled, non-destructive Data Correction Governance framework for System Administrators.

### Primary Objectives:
1. **Driver Vehicle Scoping & Pre-Trip Inspection Access**: Validate on the backend that a `DRIVER` user can only submit pre-trip/post-trip inspections for vehicles actively assigned to them via `DriverAssignment`. Unassigned submission attempts are denied and logged as security events.
2. **Tyre Technician Operational Key-In Permissions**: Authorize `TYRE_TECHNICIAN` to key in routine operational data (inspections, tread depth, pressure, fitment/removal transactions, stock receipts/issues) without granting permissions to edit historical records or modify protected masters.
3. **Tyre Supervisor Supervisory & Operational Permissions**: Authorize `TYRE_SUPERVISOR` to perform key-in operations, review technician submissions, verify fitments/inspections, initiate stock reconciliations, and request historical corrections without granting direct, uncontrolled record overwrites.
4. **Controlled System Administrator Data Correction Governance**: Authorize `SUPER_ADMIN` as the sole role permitted to perform historical operational data corrections. All corrections require mandatory change rationale, preserve original values alongside corrected values in an immutable `DataCorrection` ledger, and link to the central `AuditLog`.
5. **System-Wide Action Distinction**: Formalize explicit boundaries between `CREATE`, `READ`, `OPERATIONAL_UPDATE`, `APPROVE`, `CORRECT`, `DELETE`, and `SYSTEM_CONFIGURE`.

---

## 2. Scope vs. Non-Scope

### In Scope for Phase 5A:
- Backend authorization guard in `DriverController` enforcing active `DriverAssignment` validation for driver trip inspection submissions.
- Explicit permissions for Tyre Technician and Tyre Supervisor data key-in and verification.
- `DataCorrection` Prisma model and `data_corrections` PostgreSQL table.
- System Admin Data Correction endpoints (`POST /api/v1/system-admin/corrections`, `GET /api/v1/system-admin/corrections`).
- Frontend Driver dashboard UI enhancements for Pre-Trip / Post-Trip digital checklists.
- Frontend System Admin UI for Data Correction Governance.
- Comprehensive integration & security test suite `scratch/test-phase5a-role-governance.js`.

### Non-Scope (Prohibited):
- Implementation of Phase 6 modules (Fuel, Financial Analytics, Sustainability, Asset Lifecycle).
- Destructive updates or silent overwrites of historical inspection, tyre, inventory, or safety records.
- Duplication of Driver, Vehicle, Workshop, Inventory, or Tyre master models.
- Direct manual editing of KPI values or formulas.
- Modification of immutable `audit_logs` records.

---

## 3. Data Ownership & Domain Governance

```
                               ┌───────────────────────────────────┐
                               │  PLATFORM SHARED SERVICES ENGINE  │
                               └─────────────────┬─────────────────┘
                                                 │
        ┌──────────────────────┬─────────────────┼─────────────────┬──────────────────────┐
        ▼                      ▼                 ▼                 ▼                      ▼
┌────────────────┐     ┌───────────────┐ ┌───────────────┐ ┌───────────────┐     ┌────────────────┐
│ FLEET & ASSET  │     │ DRIVER SAFETY │ │  TYRE INTELL. │ │   WORKSHOP    │     │  INVENTORY &   │
│   (Vehicle)    │     │   (Driver)    │ │ (Tyre Master) │ │ (Work Order)  │     │  PROCUREMENT   │
└───────┬────────┘     └───────┬───────┘ └───────┬───────┘ └───────┬───────┘     └───────┬────────┘
        │                      │                 │                 │                     │
        └──────────────────────┴─────────────────┼─────────────────┴─────────────────────┘
                                                 ▼
                               ┌───────────────────────────────────┐
                               │   DATA CORRECTION GOVERNANCE      │
                               │    (System Admin Append-Only)     │
                               └───────────────────────────────────┘
```

- **Fleet & Asset**: Authoritative for Vehicle status, assignments, and grounding.
- **Driver & Safety**: Authoritative for `DriverAssignment`, `TripInspection`, `InspectionItemResult`, `SafetyIncident`, and `DriverSafetyScore`.
- **Tyre Intelligence**: Authoritative for `Tyre`, `TyreInspection`, `TyreFitment`, and `TyreDefect`.
- **Workshop Intelligence**: Authoritative for `WorkOrder`, `WorkOrderTask`, and `MaintenanceSchedule`.
- **Inventory & Procurement**: Authoritative for `InventoryItem`, `InventoryStock`, `InventoryMovement`, `PurchaseOrder`, and `Vendor`.
- **System Administration**: Authoritative for `User`, `Role`, `Tenant`, `Organization`, and `DataCorrection`.

---

## 4. Authorization & Security Model

### Driver Scoping Enforcement Architecture:
```
Authenticated User (JWT)
        │
        ▼
Extract User ID & Role (DRIVER)
        │
        ▼
Query Active DriverAssignment (status = 'ACTIVE', driverId = userId, vehicleId = dto.vehicleId)
        │
 ┌──────┴───────────────────────────┐
 │ Active Assignment Exists?        │
 └──────┬───────────────────┬───────┘
        │ YES               │ NO
        ▼                   ▼
Process Inspection     Deny Request (HTTP 403) + Log Security Audit Event
```

---

## 5. Audit & Data Editability Policy

1. **Operational Records**:
   - `CREATE`: Allowed for authorized operational roles (`DRIVER`, `TYRE_TECHNICIAN`, `TYRE_SUPERVISOR`, `WORKSHOP_MANAGER`). Records are immutable upon submission.
   - `CORRECT`: Authorized solely for `SUPER_ADMIN` through controlled `DataCorrection` ledger.
2. **Master Data**:
   - Managed according to domain-specific ownership (e.g. `FLEET_MANAGER` configures Vehicles; `TYRE_SUPERVISOR` registers Tyres).
3. **Audit Trail (`audit_logs`)**:
   - `IMMUTABLE`. No role (including `SUPER_ADMIN`) may modify or delete audit log entries.
4. **KPI Governance**:
   - Derived strictly from live PostgreSQL database records via `KpiGovernanceService`. Manual KPI overwrites strictly prohibited.

---

## 6. Verification & Regression Plan

- Executable test script: `scratch/test-phase5a-role-governance.js`
- All 10 existing platform regression gates must pass 100% clean.
- Mobile responsiveness across 14 resolutions (320px–1920px).
