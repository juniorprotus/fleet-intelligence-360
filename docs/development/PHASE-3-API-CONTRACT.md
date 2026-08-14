# FI360 Phase 3 — REST API Contract Specification

**Document ID**: `FI360-PHASE3-API-CONTRACT-v1.0`  
**Date**: August 14, 2026  
**Status**: APPROVED SPECIFICATION  

---

## 1. Controller Routing Overview

All Phase 3 REST endpoints will be exposed under the `WorkshopController` (`/api/v1/work-orders` and `/api/v1/maintenance-schedules`). All endpoints require valid JWT authentication (`JwtAuthGuard`) and permission guards (`PermissionsGuard`).

---

## 2. API Endpoint Specification

### 1. `POST /api/v1/work-orders`
- **Summary**: Create a new Workshop Work Order.
- **Permissions**: `WORKSHOP_UPDATE`
- **Request Body**:
  ```json
  {
    "vehicleId": "427eb45c-eab7-4907-b4a7-f61cdccb066e",
    "workshopId": "a2a40432-ddd2-4918-ba63-b6c46bcc4e0e",
    "title": "Replace Steer Tyre & Align Axle 1",
    "maintenanceType": "CORRECTIVE",
    "priority": "HIGH",
    "downtimeId": "25a19b88-b9aa-4305-b0df-4b01e615d1b9",
    "defectId": 8,
    "assignedTechId": 5,
    "estimatedHours": 2.5
  }
  ```
- **Response (201 Created)**: Returns full `WorkOrder` object with `workOrderNumber` (e.g. `WO-2026-0001`).
- **Events Emitted**: `workorder.created`.

---

### 2. `GET /api/v1/work-orders`
- **Summary**: List all Work Orders with hierarchical data-scope filtering (`region`, `depot`, `status`, `vehicleId`).
- **Permissions**: `WORKSHOP_READ`
- **Response (200 OK)**: Array of `WorkOrder` records with nested `vehicle`, `workshop`, and `tasks`.

---

### 3. `GET /api/v1/work-orders/:id`
- **Summary**: Get detailed Work Order by ID.
- **Permissions**: `WORKSHOP_READ`
- **Response (200 OK)**: Full `WorkOrder` with task breakdown, linked defect, and downtime ledger status.

---

### 4. `POST /api/v1/work-orders/:id/tasks`
- **Summary**: Add an itemized maintenance task to a Work Order.
- **Permissions**: `WORKSHOP_UPDATE`
- **Request Body**:
  ```json
  {
    "taskName": "Mount New Michelin Casing SN-NEW-01",
    "assignedToId": 5,
    "estimatedMin": 45
  }
  ```
- **Response (201 Created)**: Created `WorkOrderTask` record.

---

### 5. `PUT /api/v1/work-orders/:id/complete`
- **Summary**: Complete Work Order, execute quality sign-off, and trigger vehicle recovery.
- **Permissions**: `WORKSHOP_UPDATE`
- **Request Body**:
  ```json
  {
    "actualHours": 2.0,
    "totalLaborCost": 150.0,
    "totalPartsCost": 450.0,
    "notes": "Quality inspection verified. Tyre pressure set to 110 PSI."
  }
  ```
- **Execution Flow**:
  1. Validates segregation of duties via `ApprovalWorkflowService.validateSegregationOfDuties(techId, supervisorId)`.
  2. Updates `WorkOrder.status` to `COMPLETED` and sets `completedAt = now()`.
  3. If linked to an open `VehicleDowntime`, invokes `VehicleService.recoverVehicle(vehicleId, supervisorId)`.
- **Response (200 OK)**:
  ```json
  {
    "message": "Work Order WO-2026-0001 completed successfully.",
    "workOrder": { "id": "wo-1", "status": "COMPLETED" },
    "vehicle": { "id": "v-1", "vehicleStatus": "ACTIVE" },
    "downtime": { "id": "dt-1", "durationMinutes": 120, "recoveredAt": "2026-08-14T10:00:00Z" }
  }
  ```
- **Events Emitted**: `workorder.completed`, `vehicle.recovered`.

---

### 6. `GET /api/v1/maintenance-schedules`
- **Summary**: Query active PM schedules by vehicle class.
- **Permissions**: `WORKSHOP_READ`
- **Response (200 OK)**: List of active PM rules.
