# FI360 Phase 4 — REST API Contract Specification

**Document ID**: `FI360-PHASE4-API-CONTRACT-v1.0`  
**Date**: August 14, 2026  
**Status**: APPROVED SPECIFICATION  

---

## 1. Controller Routing Overview

Phase 4 introduces REST controllers under `/api/v1/inventory` and `/api/v1/procurement`. All endpoints require JWT authentication (`JwtAuthGuard`) and permission validation (`PermissionsGuard`).

---

## 2. API Endpoint Specification

### 1. `POST /api/v1/inventory/items`
- **Summary**: Register a new spare part or casing item in the master catalogue.
- **Permissions**: `INVENTORY_CREATE`
- **Request Body**:
  ```json
  {
    "partNumber": "PRT-TYR-315-80",
    "name": "Michelin 315/80 R22.5 Steer Casing",
    "category": "TYRE_CASING",
    "unitOfMeasure": "EA",
    "defaultUnitCost": 450.0
  }
  ```
- **Response (201 Created)**: Returns created `InventoryItem` record.

---

### 2. `GET /api/v1/inventory/stock`
- **Summary**: Query scoped inventory stock levels by Workshop or Depot.
- **Permissions**: `INVENTORY_READ`
- **Query Params**: `workshopId`, `category`, `belowReorderPoint` (boolean)
- **Response (200 OK)**: Array of `InventoryStock` objects with nested `item` and `workshop`.

---

### 3. `POST /api/v1/inventory/requisitions`
- **Summary**: Request and issue spare parts against a maintenance Work Order.
- **Permissions**: `INVENTORY_UPDATE`
- **Request Body**:
  ```json
  {
    "workOrderId": "wo-uuid-1",
    "itemId": "item-uuid-1",
    "quantity": 1,
    "requestedById": 5
  }
  ```
- **Execution Flow**:
  1. Verifies `InventoryStock.quantityOnHand >= quantity`.
  2. Creates `PartsRequisition` (status `ISSUED`).
  3. Deducts stock quantity and updates `WorkOrder.totalPartsCost`.
- **Response (201 Created)**: Returns `PartsRequisition` record.
- **Events Emitted**: `inventory.issued`.

---

### 4. `POST /api/v1/procurement/vendors`
- **Summary**: Register an approved supplier/vendor master.
- **Permissions**: `PROCUREMENT_CREATE`
- **Request Body**:
  ```json
  {
    "vendorCode": "VND-MICH-01",
    "name": "Michelin Kenya Ltd",
    "contactEmail": "orders@michelin.co.ke"
  }
  ```
- **Response (201 Created)**: Created `Vendor` object.

---

### 5. `POST /api/v1/procurement/purchase-orders`
- **Summary**: Create a new Purchase Order for stock replenishment.
- **Permissions**: `PROCUREMENT_CREATE`
- **Request Body**:
  ```json
  {
    "vendorId": "vnd-uuid-1",
    "workshopId": "ws-uuid-1",
    "items": [
      { "itemId": "item-uuid-1", "quantityOrdered": 10, "unitPrice": 420.0 }
    ]
  }
  ```
- **Response (201 Created)**: Created `PurchaseOrder` with `poNumber` (e.g. `PO-2026-0001`).
- **Events Emitted**: `procurement.po_created`.

---

### 6. `PUT /api/v1/procurement/purchase-orders/:id/receive`
- **Summary**: Receive delivered goods from Vendor into Workshop Inventory.
- **Permissions**: `PROCUREMENT_UPDATE`
- **Request Body**:
  ```json
  {
    "receivedItems": [
      { "poItemId": 1, "quantityReceived": 10 }
    ]
  }
  ```
- **Execution Flow**:
  1. Updates `PurchaseOrderItem.quantityReceived`.
  2. Updates `PurchaseOrder.status` to `RECEIVED`.
  3. Increments `InventoryStock.quantityOnHand` and updates unit cost.
- **Response (200 OK)**: Updated `PurchaseOrder` and `InventoryStock`.
- **Events Emitted**: `procurement.po_received`.
