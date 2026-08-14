# FI360 Phase 4 — Scope & Objectives Specification

**Document ID**: `FI360-PHASE4-SCOPE-AND-OBJECTIVES-v1.0`  
**Phase Target**: Phase 4 — Inventory & Procurement Intelligence (Spare Parts & Materials Supply Chain Slice)  
**Date**: August 14, 2026  
**Status**: APPROVED SPECIFICATION — DISCOVERY COMPLETE  

---

## 1. Executive Summary & Business Context

With Phase 1 (Platform Foundation), Phase 2 (Fleet & Asset + Tyre Vertical Slice), and Phase 3 (Workshop Intelligence & Preventative Maintenance Scheduling) fully closed and certified, **Phase 4 introduces Inventory & Procurement Intelligence**.

In Phase 3, maintenance work orders (`WorkOrder`) record repair tasks, labor hours, parts costs, and quality sign-offs. However, spare parts (tyre casings, rims, valves, brake pads, filters) were recorded as aggregate cost totals without itemized stock tracking, warehouse location ledgers, requisition approvals, or procurement reorder triggers.

Phase 4 establishes the **Workshop Inventory & Procurement Supply Chain Engine**:
1. Workshops and Depots maintain structured stock ledgers for spare parts and tyre casings (`InventoryItem` / `InventoryStock`).
2. Technicians issue parts to active Work Orders via **Parts Requisitions** (`PartsRequisition`), reserving and deducting quantity from the workshop store stock.
3. When stock levels fall below defined safety thresholds, the system automatically triggers **Procurement Reorder Alerts** (`ReorderAlert`) and generates **Purchase Orders** (`PurchaseOrder`).
4. Receiving new parts or retreaded tyre casings updates stock ledgers with unit costs and updates inventory valuation.
5. All inventory movements emit domain events and integrate with `KpiGovernanceService` (`INVENTORY_TURNOVER`, `PARTS_STOCKOUT_RATE`, `PO_FULFILLMENT_CYCLE_TIME`) and `UniversalReportService`.

---

## 2. Logical Progression from Phases 1–3

```
PHASE 1 FOUNDATION
[Tenants, Orgs, Drivers, Events, Workflow, Audit, DataScope]
       ↓
PHASE 2 FLEET & ASSET VERTICAL SLICE
[Fleet Vehicle Master, Grounding Policy Engine, VehicleDowntime Ledger, GROUNDED Status]
       ↓
PHASE 3 WORKSHOP INTELLIGENCE
[Work Orders, Maintenance Schedules, Technician Tasks, Quality Sign-off, Recovery Integration]
       ↓
PHASE 4 INVENTORY & PROCUREMENT INTELLIGENCE (THIS PHASE)
[Inventory Stock Ledgers, Parts Requisitions, Purchase Orders, Reorder Triggers, Stock Valuation]
```

Phase 4 is the mandatory operational bridge between maintenance execution (Workshop) and material supply chain governance (Inventory & Procurement).

---

## 3. Explicit In-Scope Capabilities

1. **Workshop Inventory Stock Management (`InventoryItem` & `InventoryStock`)**:
   - Item catalogue (part numbers, descriptions, categories: `TYRE_CASING`, `VALVE`, `RIM`, `BRAKE_PAD`, `FILTER`, `FLUID`).
   - Stock ledgers per Workshop/Depot (quantity on hand, reserved quantity, reorder point, unit cost).
2. **Parts Requisition & Work Order Issuance (`PartsRequisition`)**:
   - Requisitioning parts for specific `WorkOrder` IDs.
   - Reserving stock and issuing parts, calculating actual parts cost on the `WorkOrder`.
   - Supervisor approval for high-value parts requisitions via `ApprovalWorkflowService`.
3. **Automated Reorder Triggers & Stock Alerting**:
   - Monitoring stock on hand vs `reorderPoint`.
   - Emitting `inventory.reorder_triggered` when stock falls below safety levels.
4. **Procurement & Purchase Order Management (`PurchaseOrder` & `PurchaseOrderItem`)**:
   - Reordering parts from approved Vendors (`Vendor`).
   - PO approval lifecycle (`DRAFT` → `SUBMITTED` → `APPROVED` → `RECEIVED` → `CLOSED`).
   - Receiving goods into Workshop Inventory stock ledgers.
5. **Shared Platform Capability Consumption**:
   - **Event Publisher**: Emitting `inventory.issued`, `inventory.reorder_triggered`, `procurement.po_created`, `procurement.po_received`.
   - **KPI Governance**: Governing `INVENTORY_TURNOVER`, `PARTS_STOCKOUT_RATE`, `PO_FULFILLMENT_CYCLE_TIME`.
   - **Universal Reporting**: Generating Inventory Valuation & Parts Consumption executive PDF/CSV reports.

---

## 4. Explicit Out-of-Scope Capabilities (Deferred to Later Phases)

- ❌ Automated CAN-bus telematics fuel sensor integration (Fuel & Safety Intelligence domain).
- ❌ Driver behavior safety scoring & telematics video analytics (Safety Intelligence domain).
- ❌ External ERP general ledger double-entry journal postings (Financial Intelligence domain).

---

## 5. Master Data Ownership & Boundaries

- **Domain Owner**: **Inventory & Procurement Intelligence Domain** (`backend/src/inventory/` & `backend/src/procurement/`).
- **Master Data Ownership**:
  - `Vehicle`, `Workshop`: Owned 100% by **Fleet & Asset Domain**.
  - `User`, `Driver`: Owned 100% by **Platform Core Foundation**.
  - `Tyre`, `TyreDefect`: Owned 100% by **Tyre Intelligence Domain**.
  - `WorkOrder`, `WorkOrderTask`: Owned 100% by **Workshop Intelligence Domain**.
  - `InventoryItem`, `InventoryStock`, `PartsRequisition`, `PurchaseOrder`, `Vendor`: Owned 100% by **Inventory & Procurement Intelligence Domain**.
