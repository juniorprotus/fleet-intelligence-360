# FI360 Phase 4 — Domain Boundary & Integration Contract Specification

**Document ID**: `FI360-PHASE4-DOMAIN-BOUNDARY-CONTRACT-v1.0`  
**Date**: August 14, 2026  
**Status**: APPROVED SPECIFICATION  

---

## 1. Domain Boundary & Ownership Matrix

Phase 4 defines the **Inventory & Procurement Intelligence Domain** boundaries within the FI360 modular monolith architecture:

| Bounded Context | Domain Owner | Primary Entities Owned | Allowed Inbound Invocation | Forbidden Cross-Boundary Action |
| :--- | :--- | :--- | :--- | :--- |
| **Platform Core** | Platform | `Tenant`, `Organization`, `LegalEntity`, `User`, `Driver` | Auth, Scope, Audit, Approval, Events | Modules creating custom User or Tenant tables |
| **Fleet & Asset** | Fleet Master | `Vehicle`, `Workshop`, `VehicleDowntime`, `VehicleGroundingPolicy` | Vehicle & Workshop references | Modifying Vehicle or Workshop schemas |
| **Workshop Ops** | Workshop Ops | `WorkOrder`, `WorkOrderTask`, `MaintenanceSchedule` | Requisition parts against Work Orders | Mutating Work Order status from Inventory module |
| **Inventory & Procurement** (PHASE 4) | Supply Chain | `InventoryItem`, `InventoryStock`, `PartsRequisition`, `Vendor`, `PurchaseOrder`, `PurchaseOrderItem` | Requisitioning, stock querying, PO fulfillment | Mutating Vehicle status or Tyre fitments directly |

---

## 2. Cross-Domain Operational Integration Contracts

### Contract 1: Work Order Execution → Parts Requisition → Stock Deduction
```mermaid
sequenceDiagram
    autonumber
    participant Tech as Technician / Workshop
    participant Inv as Inventory Service
    participant WO as Workshop Service
    participant Events as Event Publisher

    Tech->>Inv: 1. Request Parts Requisition (WO ID: WO-693866, Part: Michelin Casing, Qty: 1)
    Inv->>Inv: 2. Check InventoryStock (onHand >= qty)
    Inv->>Inv: 3. Create PartsRequisition (status: ISSUED) & Deduct Stock Quantity
    Inv->>WO: 4. Update WorkOrder.totalPartsCost += (unitCost * qty)
    Inv->>Events: 5. Emit inventory.issued event
```

### Contract 2: Low Stock Threshold → Automated Reorder Trigger → Purchase Order Generation
```mermaid
sequenceDiagram
    autonumber
    participant Inv as Inventory Service
    participant Proc as Procurement Service
    participant Approver as Supervisor / Fleet Mgr
    participant Events as Event Publisher

    Inv->>Inv: 1. Stock quantity falls below reorderPoint (e.g. 8 <= 10)
    Inv->>Events: 2. Emit inventory.reorder_triggered
    Events->>Proc: 3. Handle reorder event & Auto-create Purchase Order (DRAFT)
    Proc->>Approver: 4. Submit PO for Approval (if > $1,000) via ApprovalWorkflowService
    Approver-->>Proc: 5. PO Approved -> Status SUBMITTED to Vendor
    Proc->>Inv: 6. Receive Goods -> Increment InventoryStock onHand quantity & Update unitCost
    Proc->>Events: 7. Emit procurement.po_received event
```

---

## 3. Foreign Key Constraints & Data Integrity Rules

1. **`InventoryStock.workshopId`**: Foreign key to `workshops.id` (Fleet Domain).
2. **`InventoryStock.itemId`**: Foreign key to `inventory_items.id`.
3. **`PartsRequisition.workOrderId`**: Foreign key to `work_orders.id` (Workshop Domain).
4. **`PartsRequisition.requestedById`**: Foreign key to `users.id` (Platform Core).
5. **`PurchaseOrder.vendorId`**: Foreign key to `vendors.id`.
6. **`PurchaseOrder.approvedById`**: Foreign key to `users.id` (Platform Core).
