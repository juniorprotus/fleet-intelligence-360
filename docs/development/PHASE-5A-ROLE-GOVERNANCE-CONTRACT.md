# FI360 Phase 5A — Role Governance & Permission Matrix Contract

## Document Control
- **Document ID**: `FI360-PHASE-5A-ROLE-GOVERNANCE-CONTRACT-v1.0`
- **Status**: `CERTIFIED`

---

## Permission Matrix Mapping

| Permission Token | Description | SUPER_ADMIN | FLEET_MANAGER | WORKSHOP_MANAGER | TYRE_SUPERVISOR | TYRE_TECHNICIAN | DRIVER |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `DRIVER_INSPECTION_CREATE` | Submit digital Pre/Post-Trip inspection for assigned vehicle | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `DRIVER_INSPECTION_VIEW_OWN` | View own submitted trip inspection history | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `DRIVER_SAFETY_VIEW_OWN` | View own rolling driver safety score & incidents | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `TYRE_INSPECT` | Key in operational tyre inspection & tread depth | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `TYRE_FIT` | Key in tyre fitment / removal | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `DATA_CORRECTION_CREATE` | Submit data correction request | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `DATA_CORRECTION_EXECUTE` | Execute controlled append-only data correction | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `DATA_CORRECTION_HISTORY_VIEW` | View append-only data correction ledger | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Role Definitions & Operational Boundaries

1. **`SUPER_ADMIN`**:
   - Sole role authorized to execute controlled append-only data corrections (`DATA_CORRECTION_EXECUTE`).
   - Retains full read access to audit logs and correction ledger.

2. **`TYRE_TECHNICIAN`**:
   - Key-in rights for operational field data (tyre inspections, tread measurements, pressure readings, stock receipts, fitments).
   - Zero historical record edit rights (`DATA_CORRECTION_EXECUTE` = false).

3. **`TYRE_SUPERVISOR`**:
   - Key-in rights, fitment & inspection verification rights, and correction request submission capability (`DATA_CORRECTION_CREATE`).
   - Zero direct historical overwrite rights.

4. **`DRIVER`**:
   - Strictly scoped to performing digital Pre-Trip / Post-Trip inspections against currently assigned vehicle (`DRIVER_INSPECTION_CREATE`).
   - Read-only access to own vehicle details, fitted tyres, submitted inspection history, and safety score.
