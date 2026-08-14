# FI360 Phase 5 — Domain Event Contract Specification

**Document ID**: `FI360-PHASE5-EVENT-CONTRACT-v1.0`  
**Date**: August 14, 2026  
**Status**: APPROVED SPECIFICATION  

---

## 1. Event Publisher Architecture Compliance

All Phase 5 domain events strictly implement the FI360 10-field standardized domain event envelope defined by `EventPublisherService` (`backend/src/events/event-publisher.service.ts`).

---

## 2. Phase 5 Domain Event Definitions

### 1. `driver.assigned`
- **Trigger**: Issued when a driver is assigned to a vehicle shift.
- **Payload Schema**:
  ```json
  {
    "assignmentId": "assign-uuid-1",
    "driverId": 5,
    "vehicleId": "veh-uuid-1",
    "shiftStart": "2026-08-14T06:00:00Z",
    "startOdometer": 145000
  }
  ```

### 2. `inspection.completed`
- **Trigger**: Issued when a Pre-Trip or Post-Trip Vehicle Inspection form is submitted.
- **Payload Schema**:
  ```json
  {
    "inspectionId": "insp-uuid-1",
    "inspectionNo": "INSP-2026-0001",
    "vehicleId": "veh-uuid-1",
    "driverId": 5,
    "type": "PRE_TRIP",
    "status": "FAILED_CRITICAL",
    "hasDefects": true,
    "isGrounded": true
  }
  ```

### 3. `safety.incident_logged`
- **Trigger**: Issued when a driver safety incident or violation is recorded.
- **Payload Schema**:
  ```json
  {
    "incidentId": "inc-uuid-1",
    "incidentNo": "INC-2026-0001",
    "driverId": 5,
    "vehicleId": "veh-uuid-1",
    "incidentType": "HARSH_BRAKING",
    "severity": "MEDIUM",
    "pointsDeducted": 5
  }
  ```
