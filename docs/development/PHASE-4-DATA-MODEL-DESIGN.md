# FI360 Phase 4 — Data Model & Migration Design Specification

**Document ID**: `FI360-PHASE4-DATA-MODEL-DESIGN-v2.0`  
**Date**: August 14, 2026  
**Status**: APPROVED SPECIFICATION — INVENTORY MOVEMENT LEDGER ENHANCED  

---

## 1. Overview

Phase 4 introduces 7 database entities to support Inventory Stock Control, Material Movement Ledgers, Parts Requisitions, Vendor Procurement, and Purchase Orders:
1. **`InventoryItem`** (`inventory_items` table) — Master catalogue of spare parts and tyre casings.
2. **`InventoryStock`** (`inventory_stocks` table) — Workshop-specific stock position ledger (quantity on hand, reserved, reorder point).
3. **`InventoryMovement`** (`inventory_movements` table) — Immutable material movement ledger tracking all receipts, issues, returns, transfers, and adjustments.
4. **`PartsRequisition`** (`parts_requisitions` table) — Material requests issued against Work Orders.
5. **`Vendor`** (`vendors` table) — Approved supplier master.
6. **`PurchaseOrder`** (`purchase_orders` table) — Stock replenishment purchase orders.
7. **`PurchaseOrderItem`** (`purchase_order_items` table) — Line items within a Purchase Order.

---

## 2. Detailed Entity Models (Proposed Prisma Schema)

```prisma
// ============================================================
// PHASE 4 — INVENTORY & PROCUREMENT INTELLIGENCE
// ============================================================

enum InventoryCategory {
  TYRE_CASING
  VALVE
  RIM
  BRAKE_PAD
  FILTER
  FLUID
  GENERAL_SPARE
}

enum InventoryMovementType {
  RECEIPT
  ISSUE
  RETURN
  TRANSFER
  ADJUSTMENT
  OPENING_BALANCE
  STOCKTAKE_ADJUSTMENT
}

enum RequisitionStatus {
  PENDING
  APPROVED
  ISSUED
  REJECTED
  CANCELLED
}

enum PurchaseOrderStatus {
  DRAFT
  SUBMITTED
  APPROVED
  PARTIALLY_RECEIVED
  RECEIVED
  CANCELLED
}

/// Master catalogue of spare parts and tyre casings
model InventoryItem {
  id             String            @id @default(uuid()) @map("item_id")
  partNumber     String            @unique @map("part_number")
  tenantId       String            @default("TNT-DEFAULT") @map("tenant_id")
  organizationId String            @default("ORG-DEFAULT") @map("organization_id")
  name           String
  description    String?
  category       InventoryCategory @default(GENERAL_SPARE)
  unitOfMeasure  String            @default("EA") @map("unit_of_measure")
  defaultUnitCost Float            @default(0) @map("default_unit_cost")
  createdAt      DateTime          @default(now()) @map("created_at")
  updatedAt      DateTime          @updatedAt @map("updated_at")

  stocks         InventoryStock[]
  movements      InventoryMovement[]
  requisitions   PartsRequisition[]
  poItems        PurchaseOrderItem[]

  @@map("inventory_items")
  @@index([tenantId, organizationId])
  @@index([category])
}

/// Workshop-specific current stock position ledger
model InventoryStock {
  id             String        @id @default(uuid()) @map("stock_id")
  tenantId       String        @default("TNT-DEFAULT") @map("tenant_id")
  organizationId String        @default("ORG-DEFAULT") @map("organization_id")
  workshopId     String        @map("workshop_id")
  workshop       Workshop      @relation(fields: [workshopId], references: [id])
  itemId         String        @map("item_id")
  item           InventoryItem @relation(fields: [itemId], references: [id])
  
  quantityOnHand Int           @default(0) @map("quantity_on_hand")
  quantityReserved Int         @default(0) @map("quantity_reserved")
  reorderPoint   Int           @default(5) @map("reorder_point")
  reorderQuantity Int          @default(20) @map("reorder_quantity")
  unitCost       Float         @default(0) @map("unit_cost")
  updatedAt      DateTime      @updatedAt @map("updated_at")

  @@unique([workshopId, itemId])
  @@map("inventory_stocks")
  @@index([tenantId, organizationId])
  @@index([workshopId])
}

/// Immutable Inventory Movement Ledger
model InventoryMovement {
  id             Int                   @id @default(autoincrement())
  tenantId       String                @default("TNT-DEFAULT") @map("tenant_id")
  organizationId String                @default("ORG-DEFAULT") @map("organization_id")
  workshopId     String                @map("workshop_id")
  workshop       Workshop              @relation(fields: [workshopId], references: [id])
  itemId         String                @map("item_id")
  item           InventoryItem         @relation(fields: [itemId], references: [id])
  
  movementType   InventoryMovementType @map("movement_type")
  quantity       Int                   // positive for receipts/returns, negative for issues
  unitCost       Float                 @map("unit_cost")
  totalCost      Float                 @map("total_cost")
  balanceAfter   Int                   @map("balance_after")
  
  workOrderId    String?               @map("work_order_id")
  workOrder      WorkOrder?            @relation(fields: [workOrderId], references: [id])
  requisitionId  String?               @map("requisition_id")
  poId           String?               @map("po_id")
  reference      String?
  performedById  String?               @map("performed_by_id")
  createdAt      DateTime              @default(now()) @map("created_at")

  @@map("inventory_movements")
  @@index([tenantId, organizationId])
  @@index([workshopId])
  @@index([itemId])
  @@index([movementType])
}

/// Parts Requisition for Work Order
model PartsRequisition {
  id             String            @id @default(uuid()) @map("requisition_id")
  reqNumber      String            @unique @map("req_number")
  tenantId       String            @default("TNT-DEFAULT") @map("tenant_id")
  organizationId String            @default("ORG-DEFAULT") @map("organization_id")
  workOrderId    String            @map("work_order_id")
  workOrder      WorkOrder         @relation(fields: [workOrderId], references: [id])
  itemId         String            @map("item_id")
  item           InventoryItem     @relation(fields: [itemId], references: [id])
  
  quantity       Int               @default(1)
  unitCost       Float             @map("unit_cost")
  totalCost      Float             @map("total_cost")
  status         RequisitionStatus @default(PENDING)
  
  requestedById  Int               @map("requested_by_id")
  requestedBy    User              @relation(fields: [requestedById], references: [id])
  issuedAt       DateTime?         @map("issued_at")
  createdAt      DateTime          @default(now()) @map("created_at")

  @@map("parts_requisitions")
  @@index([tenantId, organizationId])
  @@index([workOrderId])
}

/// Vendor Master
model Vendor {
  id             String          @id @default(uuid()) @map("vendor_id")
  vendorCode     String          @unique @map("vendor_code")
  tenantId       String          @default("TNT-DEFAULT") @map("tenant_id")
  organizationId String          @default("ORG-DEFAULT") @map("organization_id")
  name           String
  contactEmail   String?         @map("contact_email")
  phone          String?
  address        String?
  isActive       Boolean         @default(true) @map("is_active")
  createdAt      DateTime        @default(now()) @map("created_at")

  purchaseOrders PurchaseOrder[]

  @@map("vendors")
  @@index([tenantId, organizationId])
}

/// Purchase Order
model PurchaseOrder {
  id             String              @id @default(uuid()) @map("po_id")
  poNumber       String              @unique @map("po_number")
  tenantId       String              @default("TNT-DEFAULT") @map("tenant_id")
  organizationId String              @default("ORG-DEFAULT") @map("organization_id")
  vendorId       String              @map("vendor_id")
  vendor         Vendor              @relation(fields: [vendorId], references: [id])
  workshopId     String              @map("workshop_id")
  workshop       Workshop            @relation(fields: [workshopId], references: [id])
  
  status         PurchaseOrderStatus @default(DRAFT)
  totalAmount    Float               @default(0) @map("total_amount")
  approvedBy     String?             @map("approved_by")
  createdAt      DateTime            @default(now()) @map("created_at")
  updatedAt      DateTime            @updatedAt @map("updated_at")

  items          PurchaseOrderItem[]

  @@map("purchase_orders")
  @@index([tenantId, organizationId])
  @@index([vendorId])
  @@index([workshopId])
}

/// Line Item within a Purchase Order
model PurchaseOrderItem {
  id             Int           @id @default(autoincrement())
  poId           String        @map("po_id")
  purchaseOrder  PurchaseOrder @relation(fields: [poId], references: [id], onDelete: Cascade)
  itemId         String        @map("item_id")
  item           InventoryItem @relation(fields: [itemId], references: [id])
  
  quantityOrdered Int          @map("quantity_ordered")
  quantityReceived Int         @default(0) @map("quantity_received")
  unitPrice      Float         @map("unit_price")
  totalPrice     Float         @map("total_price")

  @@map("purchase_order_items")
  @@index([poId])
}
```

---

## 3. Version-Controlled Migration Plan

- **Folder**: `backend/prisma/migrations/20260816000000_phase4_inventory_procurement/`
- **Execution Command**:
  ```bash
  npx prisma migrate resolve --applied 20260816000000_phase4_inventory_procurement
  npx prisma db push
  npx prisma migrate status
  npx prisma generate
  ```
