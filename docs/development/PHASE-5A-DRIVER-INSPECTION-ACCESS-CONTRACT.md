# FI360 Phase 5A — Driver Vehicle Inspection Access Contract

## Document Control
- **Document ID**: `FI360-PHASE-5A-DRIVER-ACCESS-CONTRACT-v1.0`
- **Status**: `CERTIFIED`

---

## Driver Vehicle Scoping Architecture

### 1. Authorization Chain
```
Authenticated User -> Driver Identity (userId) -> Active DriverAssignment (status='ACTIVE') -> Assigned Vehicle -> Inspection Permitted
```

### 2. Strict Server-Side Validation Logic
- When `submitTripInspection(dto)` is invoked:
  - If authenticated user role is `DRIVER`:
    - Query `driverAssignment` where `driverId = user.userId`, `vehicleId = dto.vehicleId`, and `status = 'ACTIVE'`.
    - If no active shift assignment exists for that driver and vehicle:
      1. Emit domain event `security.unauthorized_inspection_attempt`.
      2. Log warning: `SECURITY VIOLATION: Driver #X attempted inspection on unassigned vehicle #Y`.
      3. Throw `ForbiddenException("Access Denied: Vehicle X is not assigned to your active shift.")`.

### 3. Endpoints
- `GET /api/v1/driver-intelligence/my-vehicle`:
  - Returns currently active shift assignment and vehicle details for the authenticated driver.
- `GET /api/v1/driver-intelligence/my-inspections`:
  - Returns array of submitted pre-trip and post-trip inspection records for the authenticated driver.
- `POST /api/v1/driver-intelligence/inspections`:
  - Submits digital inspection checklist. Enforces server-side scoping check.

---

## Safety Chain Trigger Verification
- Critical defect (`isPassed = false`, `severity = 'CRITICAL'`) triggers:
  1. Inspection status set to `FAILED_CRITICAL`.
  2. Vehicle grounded (`VehicleStatus.GROUNDED`) via `VehicleService.groundVehicle()`.
  3. Vehicle downtime record created (`VehicleDowntime`).
  4. Automatic Workshop Work Order created (`WO-...`).
