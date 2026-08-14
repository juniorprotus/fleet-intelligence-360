# FI360 Phase 5A — Granular Role-Permission Matrix Specification

**Document ID**: `FI360-PHASE5A-ROLE-PERMISSION-MATRIX-v1.0`  
**Date**: August 14, 2026  
**Status**: APPROVED SPECIFICATION  
**Governance Standard**: FI360 RBAC & Permission Matrix Architecture (`permissions.matrix.ts`)

---

## 1. Governance Principles

1. **Permission Token Enforcement**: Controllers check explicit permission tokens (e.g. `Permission.DRIVER_INSPECTION_CREATE`), NOT role string checks.
2. **Backend Scoping**: Frontend visibility toggles do not constitute authorization. Every endpoint enforces permissions and data scope levels (`SYSTEM`, `ORGANISATION`, `REGION`, `WORKSHOP`, `DEPOT`, `VEHICLE`).
3. **Data Correction Distinction**: The permission to correct historical operational records (`DATA_CORRECTION_EXECUTE`) is restricted exclusively to `SUPER_ADMIN`.

---

## 2. Granular Permission Definitions

### Driver & Safety Intelligence Permissions:
- `DRIVER_READ` (`driver.read`): View driver profiles, shift assignments, and inspection history.
- `DRIVER_INSPECTION_CREATE` (`driver.inspection.create`): Perform and submit pre-trip/post-trip inspections for actively assigned vehicle.
- `DRIVER_INSPECTION_VIEW_OWN` (`driver.inspection.view_own`): View own submitted inspection history.
- `DRIVER_SAFETY_VIEW_OWN` (`driver.safety.view_own`): View own driver safety score and safety feedback.
- `SAFETY_READ` (`safety.read`): View safety incidents and fleet-wide safety performance metrics.
- `SAFETY_CREATE` (`safety.create`): Log driver safety incidents and assign score deductions.

### Tyre Intelligence & Inventory Entry Permissions:
- `TYRE_INSPECTION_CREATE` (`tyre.inspection.create`): Record tyre pressure, tread depth, and visual condition logs.
- `TYRE_STOCK_CREATE` (`tyre.stock.create`): Register new tyre stock inventory items.
- `TYRE_STOCK_RECEIVE` (`tyre.stock.receive`): Key in tyre stock receipts from vendors/transfers.
- `TYRE_STOCK_ISSUE` (`tyre.stock.issue`): Issue tyres from workshop stock to work orders or vehicles.
- `TYRE_STOCK_TRANSFER` (`tyre.stock.transfer`): Record inter-workshop tyre stock transfers.
- `TYRE_STOCK_ADJUST_REQUEST` (`tyre.stock.adjust_request`): Initiate inventory stock adjustment requests.
- `TYRE_SUPERVISION_REVIEW` (`tyre.supervision.review`): Perform supervisory review and verification of technician entries.

### System Administration & Data Correction Governance Permissions:
- `DATA_CORRECTION_CREATE` (`data.correction.create`): Submit a formal historical data correction request.
- `DATA_CORRECTION_EXECUTE` (`data.correction.execute`): Execute an append-only historical data correction with mandatory reason.
- `DATA_CORRECTION_HISTORY_VIEW` (`data.correction.history_view`): View complete append-only correction audit history.

---

## 3. Platform Role-Permission Matrix

| Role | Dashboard | Scope Level | Driver Inspection | Tyre Operational Key-In | Tyre Supervision | Inventory Movement Key-In | Data Correction Authority | Audit Log Access |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `SUPER_ADMIN` | Admin | `SYSTEM` | Full Read/Create | Full Access | Full Access | Full Access | **SOLE AUTHORIZED EXECUTER** | Full Read |
| `CEO` | Executive | `ORGANISATION` | Read Only | Read Only | Read Only | Read Only | PROHIBITED | Read Only |
| `FLEET_MANAGER` | Fleet Ops | `ORGANISATION` | Full Read | Read Only | Read Only | Read Only | PROHIBITED | Read Only |
| `WORKSHOP_MANAGER` | Workshop | `WORKSHOP` | Read Only | Operational Read | Review & Verify | Issue/Receive | PROHIBITED | Read Only |
| `TYRE_SUPERVISOR` | Tyre Control | `WORKSHOP` | Read Only | **Full Key-In** | **Supervisory Review** | **Issue/Receive/Transfer** | Request Only | Read Only |
| `TYRE_TECHNICIAN` | Technician | `WORKSHOP` | Read Only | **Routine Key-In** | Read Only | **Issue/Receive Key-In** | PROHIBITED | No Access |
| `FINANCE_MANAGER` | Finance | `ORGANISATION` | No Access | Read Only | Read Only | Valuation Read | PROHIBITED | Read Only |
| `DRIVER` | My Vehicle | `VEHICLE` | **Assigned Vehicle Only** | No Access | No Access | No Access | PROHIBITED | No Access |
| `AUDITOR` | Auditor | `ORGANISATION` | Read Only | Read Only | Read Only | Read Only | PROHIBITED | Full Read |
| `READ_ONLY` | Auditor | `ORGANISATION` | Read Only | Read Only | Read Only | Read Only | PROHIBITED | Read Only |

---

## 4. Backend Enforcement Mapping

```typescript
// Driver Controller Scoping Guard
@Post('inspections')
@RequirePermissions(Permission.DRIVER_INSPECTION_CREATE, Permission.DRIVER_READ)
async submitTripInspection(@Request() req, @Body() body: any) { ... }

// System Admin Data Correction Controller
@Post('corrections')
@RequirePermissions(Permission.DATA_CORRECTION_EXECUTE, Permission.ADMIN_SYSTEM)
async executeDataCorrection(@Request() req, @Body() body: DataCorrectionDto) { ... }
```
