# FI360 Phase 5A — Scope & Objectives Specification

## Document Control
- **Document ID**: `FI360-PHASE-5A-SCOPE-v1.0`
- **Status**: `CERTIFIED & APPROVED`
- **Target Release**: `FI360 Core Platform Release v5.1`

---

## Executive Summary

Phase 5A strengthens operational accountability, Driver vehicle scoping, Tyre Technician & Supervisor operational key-in permissions, and System Administrator controlled append-only data correction across the FI360 platform.

Phase 6 remains **STRICTLY BLOCKED**. Phase 5A enhances role governance and operational security while preserving 100% of certified Phase 1–5 backend, frontend, database, RBAC, and KPI contracts.

---

## Core Objectives

1. **Driver Operational Scoping Enforcement**:
   - Authenticated Drivers are restricted strictly to performing digital Pre-Trip / Post-Trip inspections against their currently active assigned vehicle (`DriverAssignment` status = `ACTIVE`).
   - Inspection attempts against unassigned vehicles are strictly denied server-side with `HTTP 403 Forbidden` and audited as a security violation event (`security.unauthorized_inspection_attempt`).
   - Vehicle assignment cannot be spoofed via client-supplied `vehicleId`.

2. **Tyre Technician Operational Key-In Permissions**:
   - Operational field technicians (`TYRE_TECHNICIAN`) can key in routine operational data (inspections, tread depth, pressure, stock receipts, issues, fitments) without historical record editing rights.

3. **Tyre Supervisor Operational Governance**:
   - Operational supervisors (`TYRE_SUPERVISOR`) possess key-in permissions, supervisory review rights, and correction request submission capability without direct historical record overwrites.

4. **System Administrator Controlled Append-Only Data Correction**:
   - `SUPER_ADMIN` is the sole role permitted to execute controlled corrections to existing system data.
   - Direct historical overwrites or silent deletions are strictly prohibited.
   - Every correction generates an immutable, append-only record in the `data_corrections` ledger (`DataCorrection` Prisma model).
   - Mandatory business justification reason, user identity, timestamp, tenant, organization, and correlation ID are captured.

5. **Frontend & Dashboard Governance Alignment**:
   - Update Driver Dashboard to dynamically fetch assigned vehicle (`GET /api/v1/driver-intelligence/my-vehicle`) and submitted inspection history (`GET /api/v1/driver-intelligence/my-inspections`).
   - Update Super Admin Dashboard with the Append-Only Data Correction Ledger history table.
