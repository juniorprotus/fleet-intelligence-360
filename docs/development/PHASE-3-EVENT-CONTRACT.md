# FI360 Phase 3 — Domain Event Contract Specification

**Document ID**: `FI360-PHASE3-EVENT-CONTRACT-v1.0`  
**Date**: August 14, 2026  
**Status**: APPROVED SPECIFICATION  

---

## 1. Event Publisher Architecture Compliance

All Phase 3 domain events strictly implement the FI360 10-field standardized domain event envelope defined by `EventPublisherService` (`backend/src/events/event-publisher.service.ts`).

### Standardized 10-Field Event Envelope Schema:
```typescript
export interface DomainEvent<T = any> {
  eventId: string;          // UUID v4
  eventType: string;        // e.g. "workorder.created"
  eventVersion: string;     // e.g. "1.0"
  tenantId: string;         // e.g. "TNT-DEFAULT"
  organizationId: string;   // e.g. "ORG-DEFAULT"
  entityId: string;         // Primary ID of target entity
  entityType: string;       // e.g. "WorkOrder"
  occurredAt: string;       // ISO 8601 Timestamp
  actorId?: string;         // User email or system identifier
  payload: T;               // Strongly typed payload object
}
```

---

## 2. Phase 3 Domain Event Definitions

### 1. `workorder.created`
- **Trigger**: Issued when a Work Order is manually created or auto-generated from a grounding event.
- **Payload Schema**:
  ```json
  {
    "workOrderId": "wo-uuid-1",
    "workOrderNumber": "WO-2026-0001",
    "vehicleId": "v-uuid-1",
    "workshopId": "ws-uuid-1",
    "maintenanceType": "SAFETY_GROUNDING",
    "priority": "HIGH",
    "defectId": 8,
    "downtimeId": "dt-uuid-1"
  }
  ```

### 2. `workorder.assigned`
- **Trigger**: Issued when a Work Order or task is assigned to a technician.
- **Payload Schema**:
  ```json
  {
    "workOrderId": "wo-uuid-1",
    "workOrderNumber": "WO-2026-0001",
    "assignedTechId": 5,
    "assignedTechName": "John Technician"
  }
  ```

### 3. `workorder.completed`
- **Trigger**: Issued when a Work Order is signed off as completed.
- **Payload Schema**:
  ```json
  {
    "workOrderId": "wo-uuid-1",
    "workOrderNumber": "WO-2026-0001",
    "vehicleId": "v-uuid-1",
    "workshopId": "ws-uuid-1",
    "actualHours": 2.0,
    "totalLaborCost": 150.0,
    "totalPartsCost": 450.0,
    "approvedBy": "supervisor@fi360.com"
  }
  ```

### 4. `maintenance.scheduled`
- **Trigger**: Issued when a preventative maintenance schedule is due for a vehicle based on odometer or time.
- **Payload Schema**:
  ```json
  {
    "scheduleId": "sched-uuid-1",
    "vehicleId": "v-uuid-1",
    "serviceName": "A-Service 10K Odometer",
    "currentOdometer": 135000,
    "dueOdometer": 135000
  }
  ```
