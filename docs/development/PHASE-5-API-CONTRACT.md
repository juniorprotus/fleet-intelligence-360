# FI360 Phase 5 — REST API Contract Specification

**Document ID**: `FI360-PHASE5-API-CONTRACT-v1.0`  
**Date**: August 14, 2026  
**Status**: APPROVED SPECIFICATION  

---

## 1. Controller Routing Overview

Phase 5 introduces REST controllers under `/api/v1/driver-intelligence` and `/api/v1/safety`. All endpoints require JWT authentication (`JwtAuthGuard`) and permission validation (`PermissionsGuard`).

---

## 2. API Endpoint Specification

### 1. `POST /api/v1/driver-intelligence/assignments`
- **Summary**: Assign a driver to a vehicle shift (`ACTIVE`).
- **Permissions**: `DRIVER_READ` / `VEHICLE_UPDATE`
- **Request Body**:
  ```json
  {
    "driverId": 5,
    "vehicleId": "veh-uuid-1",
    "startOdometer": 145000,
    "notes": "Morning logistics dispatch shift"
  }
  ```
- **Response (201 Created)**: Returns `DriverAssignment` record.
- **Events Emitted**: `driver.assigned`.

---

### 2. `PUT /api/v1/driver-intelligence/assignments/:id/complete`
- **Summary**: Complete a driver shift assignment (`COMPLETED`).
- **Permissions**: `DRIVER_READ` / `VEHICLE_UPDATE`
- **Request Body**:
  ```json
  {
    "endOdometer": 145320
  }
  ```
- **Response (200 OK)**: Updated `DriverAssignment` record.

---

### 3. `POST /api/v1/driver-intelligence/inspections`
- **Summary**: Submit a digital Pre-Trip or Post-Trip Vehicle Inspection form.
- **Permissions**: `DRIVER_READ`
- **Request Body**:
  ```json
  {
    "vehicleId": "veh-uuid-1",
    "type": "PRE_TRIP",
    "odometer": 145000,
    "items": [
      { "category": "TYRES", "itemName": "Steer Tyre Tread Depth", "isPassed": false, "severity": "CRITICAL", "notes": "Deep sidewall cut" },
      { "category": "BRAKES", "itemName": "Air Pressure & Pedal Pressure", "isPassed": true }
    ]
  }
  ```
- **Execution Flow**:
  1. Saves `TripInspection` and `InspectionItemResult` records.
  2. If any item has `isPassed: false` and `severity: CRITICAL`, sets `isGrounded: true` and invokes `VehicleService.groundVehicle()`.
  3. Grounding creates `VehicleDowntime` and auto-triggers a Workshop `WorkOrder`.
- **Response (201 Created)**: Created `TripInspection` record with `isGrounded` status.
- **Events Emitted**: `inspection.completed` (and `vehicle.grounded` if failed).

---

### 4. `POST /api/v1/safety/incidents`
- **Summary**: Log a driver safety incident or violation.
- **Permissions**: `SAFETY_CREATE`
- **Request Body**:
  ```json
  {
    "driverId": 5,
    "vehicleId": "veh-uuid-1",
    "incidentType": "HARSH_BRAKING",
    "severity": "MEDIUM",
    "description": "Harsh braking event detected at 85 km/h",
    "occurredAt": "2026-08-14T10:00:00Z"
  }
  ```
- **Response (201 Created)**: Created `SafetyIncident` record.
- **Events Emitted**: `safety.incident_logged`.

---

### 5. `GET /api/v1/safety/scores/:driverId`
- **Summary**: Retrieve a driver's monthly rolling safety score.
- **Permissions**: `SAFETY_READ`
- **Response (200 OK)**: `DriverSafetyScore` object.
