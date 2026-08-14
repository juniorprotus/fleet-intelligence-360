# FI360 Phase 5 — Test Strategy & Certification Plan

**Document ID**: `FI360-PHASE5-TEST-AND-CERTIFICATION-PLAN-v1.0`  
**Date**: August 14, 2026  
**Status**: APPROVED SPECIFICATION  

---

## 1. Complete Phase 5 E2E Vertical Slice Test Strategy

Phase 5 will be certified using `scratch/test-phase5-driver-vertical-slice.js` covering a complete 30-step flow:

1. **Auth**: Login as `FLEET_MANAGER` and `DRIVER`.
2. **Vehicle & Driver**: Register vehicle (`KCA-PH5-001`) and driver (`John Doe`).
3. **Shift Assignment**: Assign driver to vehicle (`DriverAssignment` status `ACTIVE`).
4. **Pre-Trip Inspection**: Submit digital Pre-Trip Inspection with Steer Tyre Tread FAIL (`CRITICAL`).
5. **Auto Grounding**: Verify `TripInspection.isGrounded` = `true` and `VehicleStatus` set to `GROUNDED`.
6. **VehicleDowntime**: Verify `VehicleDowntime` ledger record created.
7. **Work Order Auto-Create**: Verify auto-created Workshop `WorkOrder` (`SAFETY_GROUNDING`).
8. **Inventory Parts Requisition**: Requisition steer tyre casing from workshop store.
9. **Stock Deduction**: Verify `InventoryStock` decremented and `InventoryMovement` (`ISSUE`) logged.
10. **Work Order Repair**: Technician repairs vehicle and signs off quality.
11. **Vehicle Recovery**: Restores `VehicleStatus` to `ACTIVE` and closes downtime.
12. **Safety Incident Logging**: Log harsh braking incident (`SafetyIncident`).
13. **Safety Score Evaluation**: Calculate updated monthly `DriverSafetyScore` (95.0 / 100).
14. **Shift Completion**: Complete driver shift assignment (`COMPLETED`).
15. **Domain Events**: Verify `driver.assigned`, `inspection.completed`, `safety.incident_logged`.
16. **KPI Governance**: Evaluate `PRE_TRIP_COMPLIANCE_RATE`, `DRIVER_SAFETY_SCORE_AVG`, `DEFECT_REPORTING_LEAD_TIME`.
17. **Universal Report**: Generate `DRIVER_PRE_TRIP_INSPECTION_COMPLIANCE_REPORT`.
18. **Audit Trail**: Verify complete audit trail in `audit_logs`.
19–30. **Regression Protection**: Execute all 7 certified release gates from Phases 1–4.

---

## 2. Mandatory 8 Automated Release Gates for Phase 5

During and after Phase 5 implementation, the following 8 automated release gates **MUST REMAIN 100% GREEN**:

```bash
# 1. Prisma Migration Baseline Check
npx prisma migrate status

# 2. NestJS Compilation Check (0 Errors)
npx nest build

# 3. Phase 2 Fleet Grounding Slice Certification
node scratch/test-phase2-vertical-slice.js

# 4. Phase 3 Workshop Intelligence Slice Certification
node scratch/test-phase3-workshop-vertical-slice.js

# 5. Phase 4 Inventory & Procurement Slice Certification
node scratch/test-phase4-inventory-vertical-slice.js

# 6. Phase 5 Driver & Safety Slice Certification
node scratch/test-phase5-driver-vertical-slice.js

# 7. KPI Governance Release Gate
node scratch/kpi-compliance-gate.js

# 8. Universal Reporting & Tyre Regression
node scratch/test-universal-reporting-and-tyre.js
```
