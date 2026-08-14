# FI360 Phase 3 — Security, RBAC & Audit Contract Specification

**Document ID**: `FI360-PHASE3-SECURITY-AUDIT-CONTRACT-v1.0`  
**Date**: August 14, 2026  
**Status**: APPROVED SPECIFICATION  

---

## 1. Role-Based Access Control (RBAC) Matrix

Phase 3 endpoint permissions are governed strictly by the central token matrix in `backend/src/auth/permissions.matrix.ts`:

| Permission Token | Description | Roles Possessing Token |
| :--- | :--- | :--- |
| `WORKSHOP_READ` | View work orders, PM schedules, and workshop queues | `SUPER_ADMIN`, `CEO`, `FLEET_MANAGER`, `WORKSHOP_MANAGER`, `TYRE_SUPERVISOR`, `AUDITOR` |
| `WORKSHOP_CREATE` | Create new maintenance work orders | `SUPER_ADMIN`, `FLEET_MANAGER`, `WORKSHOP_MANAGER` |
| `WORKSHOP_UPDATE` | Edit work order tasks, labor hours, and sign off completion | `SUPER_ADMIN`, `FLEET_MANAGER`, `WORKSHOP_MANAGER`, `TYRE_SUPERVISOR` |
| `WORKSHOP_DELETE` | Cancel or purge draft work orders | `SUPER_ADMIN`, `FLEET_MANAGER` |

---

## 2. Segregation of Duties Enforcement

In compliance with FI360 Segregation of Duties principles:
- The technician executing a maintenance work order (`assignedTechId`) **MUST NOT** perform the final quality sign-off / approval (`approvedBy`).
- `ApprovalWorkflowService.validateSegregationOfDuties(technicianId, supervisorId)` is executed prior to `VehicleService.recoverVehicle()`.
- Violation attempts throw a `400 Bad Request / Forbidden` exception: `"Segregation of duties violation: Requester and Approver must be distinct identities."`

---

## 3. Central Audit Logging

All Phase 3 Work Order state mutations are automatically intercepted by `AuditInterceptor` (`backend/src/audit/audit.interceptor.ts`) and recorded in the central `audit_logs` table.

### Audit Entry Metadata Captured:
- `userId` & `userEmail`
- `action` (`WORKORDER_CREATED`, `WORKORDER_TASK_ADDED`, `WORKORDER_COMPLETED`)
- `entityType` (`WorkOrder`)
- `entityId` (UUID)
- `beforeState` & `afterState` JSON snapshots
- `ipAddress` & `userAgent`
- `tenantId` & `organizationId`
