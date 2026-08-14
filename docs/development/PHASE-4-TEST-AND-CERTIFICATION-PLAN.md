# FI360 Phase 4 — Test Strategy & Certification Plan

**Document ID**: `FI360-PHASE4-TEST-AND-CERTIFICATION-PLAN-v1.0`  
**Date**: August 14, 2026  
**Status**: APPROVED SPECIFICATION  

---

## 1. Complete Phase 4 E2E Vertical Slice Test Strategy

Phase 4 will be certified using `scratch/test-phase4-inventory-vertical-slice.js` covering a complete 28-step flow:

1. **Auth**: Login as `WORKSHOP_MANAGER` and `FLEET_MANAGER`.
2. **Vehicle & Grounding**: Register vehicle, ground via defect, open `VehicleDowntime`.
3. **Work Order**: Auto-create Work Order (`WO-2026-PH4-01`).
4. **Catalogue**: Register new `InventoryItem` (Michelin 315/80 Steer Casing).
5. **Stock**: Seed `InventoryStock` at Nairobi Workshop (Quantity: 10, Reorder Point: 5).
6. **Requisition**: Request parts requisition (1 Casing) for Work Order `WO-2026-PH4-01`.
7. **Stock Deduction**: Verify `InventoryStock.quantityOnHand` drops from 10 to 9.
8. **WO Cost Update**: Verify `WorkOrder.totalPartsCost` updated from \$0 to \$450.
9. **Low Stock Trigger**: Issue 5 more casings until `quantityOnHand` (4) < `reorderPoint` (5).
10. **Reorder Event**: Verify `inventory.reorder_triggered` domain event emitted.
11. **Auto PO**: Auto-create Purchase Order (`PO-2026-PH4-01`) for stock replenishment.
12. **PO Approval**: Approve Purchase Order via `ApprovalWorkflowService` (enforcing segregation of duties).
13. **Goods Receipt**: Receive delivered goods (10 casings) into Nairobi Workshop stock.
14. **Stock Replenishment**: Verify `InventoryStock.quantityOnHand` increases from 4 to 14.
15. **WO Completion**: Complete Work Order with Quality Sign-off.
16. **Vehicle Recovery**: Trigger `VehicleService.recoverVehicle()` restoring vehicle status to `ACTIVE`.
17. **Downtime Close**: Verify `VehicleDowntime` ledger closed.
18. **KPI Governance**: Evaluate `INVENTORY_TURNOVER`, `PARTS_STOCKOUT_RATE`, `PO_FULFILLMENT_CYCLE_TIME`.
19. **Universal Report**: Generate `INVENTORY_VALUATION_AND_STOCK_LEAKAGE_REPORT`.
20. **Audit Logs**: Verify audit logs captured for requisition and goods receipt.
21–28. **Regression Suite**: Run all previously certified Phase 1–3 regression test gates.

---

## 2. Mandatory Regression Protection Suite

During and after Phase 4 implementation, the following 7 automated release gates **MUST REMAIN 100% GREEN**:

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

# 6. KPI Governance Release Gate
node scratch/kpi-compliance-gate.js

# 7. Universal Reporting & Tyre Regression
node scratch/test-universal-reporting-and-tyre.js
```
