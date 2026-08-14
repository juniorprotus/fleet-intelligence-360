# FI360 Phase 3 — Test Strategy & Certification Plan

**Document ID**: `FI360-PHASE3-TEST-AND-CERTIFICATION-PLAN-v1.0`  
**Date**: August 14, 2026  
**Status**: APPROVED SPECIFICATION  

---

## 1. Expanded 25-Step Phase 3 E2E Integration Certification Flow

Phase 3 will be certified using an automated test script (`scratch/test-phase3-vertical-slice.js`) covering a complete 25-step operational lifecycle:

1. **Auth**: Login as `WORKSHOP_MANAGER` and `FLEET_MANAGER`.
2. **Vehicle**: Register test vehicle (`KCA-PH3-01X`).
3. **Tyre Fitment**: Register and fit steer tyre to position `AX1-L`.
4. **Inspection**: Log routine tyre inspection (1.2mm tread).
5. **Defect**: Log Critical Tyre Defect (`TYRE_CRITICAL_TREAD`).
6. **Policy**: Evaluate `VehicleGroundingPolicy`.
7. **Grounding**: Ground vehicle (`vehicleStatus = GROUNDED`).
8. **Downtime**: Open `VehicleDowntime` ledger record.
9. **Event**: Verify `vehicle.grounded` domain event emission.
10. **Auto WO**: Auto-create Workshop Work Order (`WO-2026-PH3-01`) linked to defect & downtime.
11. **WO Event**: Verify `workorder.created` domain event emission.
12. **Task**: Add maintenance task (`Replace Steer Tyre Casing`).
13. **Assign**: Assign work order task to Technician ID 5.
14. **Assign Event**: Verify `workorder.assigned` domain event emission.
15. **Start WO**: Transition Work Order to `IN_PROGRESS`.
16. **Complete Tasks**: Mark task status as `DONE`.
17. **Segregation Check**: Attempt approval using same technician ID (Assert `400 Forbidden` error).
18. **Quality Sign-off**: Complete Work Order with distinct Supervisor ID.
19. **WO Event**: Verify `workorder.completed` domain event emission.
20. **Auto Recovery**: Trigger `VehicleService.recoverVehicle()`.
21. **Status Reset**: Verify vehicle status restored to `ACTIVE`.
22. **Downtime Close**: Verify `VehicleDowntime` closed and `durationMinutes` calculated.
23. **Recovery Event**: Verify `vehicle.recovered` domain event emission.
24. **Audit Log**: Verify central `audit_logs` entries for Work Order lifecycle.
25. **Governed KPI & Reporting**: Scan 19 governed KPIs and generate Executive Work Order PDF report.

---

## 2. Mandatory Regression Protection Suite

During and after Phase 3 implementation, the following 4 automated regression test gates **MUST REMAIN 100% GREEN**:

```bash
# 1. Prisma Migration Baseline Check
npx prisma migrate status

# 2. NestJS Compilation Check (0 Errors)
npx nest build

# 3. Phase 2 Vertical Slice Certification
node scratch/test-phase2-vertical-slice.js

# 4. KPI Governance Release Gate
node scratch/kpi-compliance-gate.js

# 5. Universal Reporting & Tyre Regression
node scratch/test-universal-reporting-and-tyre.js
```
