# FI360 Phase 5 — Security, RBAC & Audit Contract Specification

**Document ID**: `FI360-PHASE5-SECURITY-AUDIT-CONTRACT-v1.0`  
**Date**: August 14, 2026  
**Status**: APPROVED SPECIFICATION  

---

## 1. Role-Based Access Control (RBAC) Matrix

Phase 5 endpoint permissions are governed strictly by `permissions.matrix.ts`:

| Permission Token | Description | Roles Possessing Token |
| :--- | :--- | :--- |
| `DRIVER_READ` | View driver profiles, assignments & inspections | `SUPER_ADMIN`, `CEO`, `FLEET_MANAGER`, `WORKSHOP_MANAGER`, `TYRE_SUPERVISOR`, `DRIVER`, `AUDITOR` |
| `DRIVER_DEFECT_CREATE` | Log driver defects and submit pre-trip inspections | `SUPER_ADMIN`, `FLEET_MANAGER`, `DRIVER` |
| `SAFETY_READ` | View safety incidents & driver safety scores | `SUPER_ADMIN`, `CEO`, `FLEET_MANAGER`, `WORKSHOP_MANAGER`, `AUDITOR` |
| `SAFETY_CREATE` | Record safety incidents & log safety score deductions | `SUPER_ADMIN`, `FLEET_MANAGER` |

---

## 2. Data Scope Enforcement

- **Drivers (`ScopeLevel.VEHICLE` / `ScopeLevel.WORKSHOP`)**: Drivers see only their assigned vehicle inspections and shift logs.
- **Fleet Managers (`ScopeLevel.REGION` / `ScopeLevel.ORGANISATION`)**: Access all driver assignments, pre-trip compliance reports, and safety scores within their region/organization.

---

## 3. Central Audit Logging

All driver shift assignments, pre-trip inspection submissions, grounding triggers, and safety incident logs are automatically intercepted by `AuditInterceptor` (`backend/src/audit/audit.interceptor.ts`) and recorded in `audit_logs`.
