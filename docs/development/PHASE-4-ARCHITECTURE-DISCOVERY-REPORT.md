# FI360 Phase 4 — Architecture Discovery & Implementation Readiness Report

**Document ID**: `FI360-PHASE4-ARCHITECTURE-DISCOVERY-REPORT-v1.0`  
**Date**: August 14, 2026  
**Author**: Antigravity AI Engineering & Architecture Team  
**Audit Mode**: **DISCOVERY & SPECIFICATION ONLY — ZERO PRODUCTION CODE MUTATION**  
**Prerequisites**: Phase 1 (CLOSED), Phase 1A (CLOSED), Phase 2 (CLOSED), Phase 3 (CLOSED & CERTIFIED)  

---

## 1. Phase 4 Scope & Rationale

### Logical Progression from Phase 3:
- **Phase 1**: Platform Foundation (Tenants, Orgs, Drivers, Events, Workflow, Audit, DataScope).
- **Phase 2**: Fleet & Asset Vehicle Master, Grounding Policies (`VehicleGroundingPolicy`), Downtime Ledgers (`VehicleDowntime`), and `GROUNDED` status.
- **Phase 3**: Workshop Intelligence & Work Orders (`WorkOrder`, `WorkOrderTask`, `MaintenanceSchedule`, Quality Sign-off & Recovery Integration).
- **Phase 4 (This Phase)**: **Inventory & Procurement Intelligence (Spare Parts & Materials Supply Chain Slice)**.

### Business Problem Solved:
In Phase 3, maintenance work orders recorded repair tasks and total parts cost numbers. However, spare parts (tyre casings, valves, rims, brake pads) were entered without itemized stock tracking, warehouse stock ledgers per workshop, requisition approvals, stock reorder point triggers, or vendor purchase orders.

Phase 4 establishes the physical material supply chain: itemizing spare parts catalogues, tracking stock on hand per workshop, issuing parts against Work Orders, auto-triggering reorder alerts when stock drops below safety thresholds, managing vendor purchase orders (`PurchaseOrder`), receiving goods, and governing inventory valuation and turnover KPIs.

---

## 2. Domain Ownership Matrix (Zero Duplicate Masters)

- **Fleet & Asset Domain** owns: `Vehicle`, `Workshop`, `VehicleDowntime`, `VehicleGroundingPolicy`, `VehicleWorkshopAssignment`.
- **Platform Foundation** owns: `Tenant`, `Organization`, `LegalEntity`, `User`, `Driver`, `AuditLog`.
- **Tyre Intelligence Domain** owns: `Tyre`, `TyrePosition`, `TyreFitment`, `TyreInspection`, `TyreDefect`, `TyreMovement`.
- **Workshop Intelligence Domain** owns: `WorkOrder`, `WorkOrderTask`, `MaintenanceSchedule`.
- **Inventory & Procurement Domain** (Phase 4) owns: `InventoryItem`, `InventoryStock`, `PartsRequisition`, `Vendor`, `PurchaseOrder`, `PurchaseOrderItem`.

---

## 3. Operational Lifecycle Design

```
Work Order Execution (Phase 3)
       ↓
Parts Requisition (PartsRequisition created for WO)
       ↓
Stock Verification & Deduction (InventoryStock onHand updated)
       ↓
Reorder Threshold Evaluation (onHand < reorderPoint)
       ↓
Auto-Reorder Alert & PO Generation (PurchaseOrder created)
       ↓
PO Approval (ApprovalWorkflowService segregation of duties)
       ↓
Vendor Fulfillment & Goods Receipt (InventoryStock incremented)
       ↓
Domain Events Emitted (inventory.issued, procurement.po_received)
       ↓
Governed KPIs & Reports (INVENTORY_TURNOVER, Universal Reports)
```

---

## 4. Proposed Data Models (Non-Destructive Schema Additions)

1. `InventoryItem` (`inventory_items` table) — Master catalogue of spare parts and tyre casings.
2. `InventoryStock` (`inventory_stocks` table) — Workshop-specific stock ledger.
3. `PartsRequisition` (`parts_requisitions` table) — Material requests issued against Work Orders.
4. `Vendor` (`vendors` table) — Approved supplier master.
5. `PurchaseOrder` (`purchase_orders` table) — Stock replenishment purchase orders.
6. `PurchaseOrderItem` (`purchase_order_items` table) — Itemized lines within a Purchase Order.

---

## 5. Proposed REST APIs

- `POST /api/v1/inventory/items` (`INVENTORY_CREATE`)
- `GET /api/v1/inventory/stock` (`INVENTORY_READ`)
- `POST /api/v1/inventory/requisitions` (`INVENTORY_UPDATE`)
- `POST /api/v1/procurement/vendors` (`PROCUREMENT_CREATE`)
- `POST /api/v1/procurement/purchase-orders` (`PROCUREMENT_CREATE`)
- `PUT /api/v1/procurement/purchase-orders/:id/receive` (`PROCUREMENT_UPDATE`)

---

## 6. Standardized 10-Field Domain Events

- `inventory.issued` (Parts issued to Work Order)
- `inventory.reorder_triggered` (Stock fell below reorder threshold)
- `procurement.po_created` (Purchase Order generated)
- `procurement.po_received` (Goods received into Workshop stock)

---

## 7. Governed KPIs & Universal Reports

- **KPIs (`KpiGovernanceService`)**: `INVENTORY_TURNOVER`, `PARTS_STOCKOUT_RATE`, `PO_FULFILLMENT_CYCLE_TIME`.
- **Reports (`UniversalReportService`)**: `INVENTORY_VALUATION_AND_STOCK_LEAKAGE_REPORT`, `PROCUREMENT_PURCHASE_ORDER_FULFILLMENT_REPORT`.

---

## 8. 7 Mandatory Release Gates for Phase 4

1. `npx prisma migrate status`
2. `npx nest build`
3. `node scratch/test-phase2-vertical-slice.js`
4. `node scratch/test-phase3-workshop-vertical-slice.js`
5. `node scratch/test-phase4-inventory-vertical-slice.js`
6. `node scratch/kpi-compliance-gate.js`
7. `node scratch/test-universal-reporting-and-tyre.js`

---

## 9. Final Implementation Readiness Decision

### **A. READY FOR IMPLEMENTATION**

*Phase 4 production implementation may begin only after the Phase 4 documentation package is reviewed and authorized.*
