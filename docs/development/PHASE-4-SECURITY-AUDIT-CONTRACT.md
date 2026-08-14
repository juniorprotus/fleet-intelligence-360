# FI360 Phase 4 — Security, RBAC & Audit Contract Specification

**Document ID**: `FI360-PHASE4-SECURITY-AUDIT-CONTRACT-v1.0`  
**Date**: August 14, 2026  
**Status**: APPROVED SPECIFICATION  

---

## 1. Role-Based Access Control (RBAC) Matrix

Phase 4 endpoint permissions are governed strictly by `permissions.matrix.ts`:

| Permission Token | Description | Roles Possessing Token |
| :--- | :--- | :--- |
| `INVENTORY_READ` | View inventory stock levels and catalogue | `SUPER_ADMIN`, `CEO`, `FLEET_MANAGER`, `WORKSHOP_MANAGER`, `TYRE_SUPERVISOR`, `AUDITOR` |
| `INVENTORY_CREATE` | Register new inventory items | `SUPER_ADMIN`, `WORKSHOP_MANAGER` |
| `INVENTORY_UPDATE` | Requisition and issue spare parts | `SUPER_ADMIN`, `WORKSHOP_MANAGER`, `TYRE_SUPERVISOR`, `TYRE_TECHNICIAN` |
| `PROCUREMENT_CREATE` | Create Purchase Orders & Vendor masters | `SUPER_ADMIN`, `FLEET_MANAGER`, `WORKSHOP_MANAGER` |
| `PROCUREMENT_UPDATE` | Approve POs & Receive goods | `SUPER_ADMIN`, `FLEET_MANAGER` |

---

## 2. Segregation of Duties Enforcement

- **Purchase Order Approval**: The user creating a Purchase Order (`createdBy`) **MUST NOT** approve the Purchase Order (`approvedBy`) for total amounts exceeding \$1,000.
- `ApprovalWorkflowService.validateSegregationOfDuties(creatorId, approverId)` is executed prior to PO approval.

---

## 3. Central Audit Logging

All Phase 4 stock adjustments, requisitions, goods receipts, and PO state changes are automatically intercepted by `AuditInterceptor` (`backend/src/audit/audit.interceptor.ts`) and recorded in `audit_logs`.
