# FI360 Phase 4 — Domain Event Contract Specification

**Document ID**: `FI360-PHASE4-EVENT-CONTRACT-v1.0`  
**Date**: August 14, 2026  
**Status**: APPROVED SPECIFICATION  

---

## 1. Event Publisher Architecture Compliance

All Phase 4 domain events strictly implement the FI360 10-field standardized domain event envelope defined by `EventPublisherService` (`backend/src/events/event-publisher.service.ts`).

---

## 2. Phase 4 Domain Event Definitions

### 1. `inventory.issued`
- **Trigger**: Issued when spare parts or tyre casings are requisitioned and issued to a Work Order.
- **Payload Schema**:
  ```json
  {
    "requisitionId": "req-uuid-1",
    "reqNumber": "REQ-2026-0001",
    "workOrderId": "wo-uuid-1",
    "itemId": "item-uuid-1",
    "quantity": 1,
    "unitCost": 450.0,
    "totalCost": 450.0,
    "workshopId": "ws-uuid-1"
  }
  ```

### 2. `inventory.reorder_triggered`
- **Trigger**: Issued automatically when `quantityOnHand` falls below `reorderPoint`.
- **Payload Schema**:
  ```json
  {
    "stockId": "stock-uuid-1",
    "workshopId": "ws-uuid-1",
    "itemId": "item-uuid-1",
    "quantityOnHand": 4,
    "reorderPoint": 10,
    "recommendedReorderQty": 20
  }
  ```

### 3. `procurement.po_created`
- **Trigger**: Issued when a Purchase Order is submitted for stock replenishment.
- **Payload Schema**:
  ```json
  {
    "poId": "po-uuid-1",
    "poNumber": "PO-2026-0001",
    "vendorId": "vnd-uuid-1",
    "workshopId": "ws-uuid-1",
    "totalAmount": 4200.0
  }
  ```

### 4. `procurement.po_received`
- **Trigger**: Issued when delivered goods are received into Workshop stock.
- **Payload Schema**:
  ```json
  {
    "poId": "po-uuid-1",
    "poNumber": "PO-2026-0001",
    "workshopId": "ws-uuid-1",
    "receivedItemsCount": 1,
    "totalValueReceived": 4200.0
  }
  ```
