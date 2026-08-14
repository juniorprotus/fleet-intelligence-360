# FI360 Phase 5A — Driver Vehicle Scoping & Digital Inspection Specification

**Document ID**: `FI360-PHASE5A-DRIVER-INSPECTION-SPECIFICATION-v1.0`  
**Date**: August 14, 2026  
**Status**: APPROVED SPECIFICATION  
**Scope**: Driver Vehicle Shift Scoping, Digital Pre-Trip / Post-Trip Checklists, and Safety Grounding Integration

---

## 1. Overview & Architectural Directives

1. **Strict Vehicle Scoping**: A `DRIVER` user is strictly prohibited from submitting digital inspections against any vehicle that is not actively assigned to them via an active `DriverAssignment` record (`status = 'ACTIVE'`).
2. **Backend Validation Only**: Authorization decisions must be enforced in the backend (`DriverController` / `DriverService`). Frontend hiding or auto-filling `vehicleId` is NOT accepted as security.
3. **Safety Grounding Chain Preservation**: Failed critical inspection items automatically invoke `VehicleService.groundVehicle()`, transition `VehicleStatus` to `GROUNDED`, open a `VehicleDowntime` record, and auto-create a Workshop `WorkOrder`.

---

## 2. Driver Vehicle Assignment & Scoping Logic

### Backend Verification Algorithm (`submitTripInspection`):
```typescript
async submitTripInspection(dto: { vehicleId: string; driverId: number; ... }) {
  // 1. Verify Driver User exists
  const driver = await this.prisma.user.findUnique({ where: { id: dto.driverId } });
  if (!driver) throw new NotFoundException(`Driver User #${dto.driverId} not found`);

  // 2. STRICT SCOPING CHECK: Verify active DriverAssignment for this vehicle
  if (driver.role === 'DRIVER') {
    const activeAssignment = await this.prisma.driverAssignment.findFirst({
      where: {
        driverId: dto.driverId,
        vehicleId: dto.vehicleId,
        status: 'ACTIVE',
      },
    });

    if (!activeAssignment) {
      // Audit Security Violation Event
      await this.auditService.logSecurityEvent({
        action: 'SECURITY_UNAUTHORIZED_VEHICLE_INSPECTION_ATTEMPT',
        actorEmail: driver.email,
        details: `Driver #${dto.driverId} attempted to submit inspection for unassigned vehicle #${dto.vehicleId}`,
      });

      throw new ForbiddenException(`Access Denied: Vehicle #${dto.vehicleId} is not assigned to your active shift.`);
    }
  }

  // 3. Proceed with inspection submission, defect checking, and grounding policy evaluation...
}
```

---

## 3. Pre-Trip / Post-Trip Digital Checklist Workflow

```
                             Driver Dashboard (Mobile/Desktop)
                                            │
                                            ▼
                          GET /api/v1/driver-intelligence/my-vehicle
                                            │
                     ┌──────────────────────┴──────────────────────┐
                     │ Active Vehicle Assignment Exists?           │
                     └──────────┬──────────────────────┬───────────┘
                                │ YES                  │ NO
                                ▼                      ▼
                      Display Vehicle Reg        Display "No Active Shift"
                      Enable "Start Pre-Trip"    Disable Inspection Form
                                │
                                ▼
                       Fill Digital Checklist
                      (Lights, Brakes, Tyres...)
                                │
                                ▼
                   POST /api/v1/driver-intelligence/inspections
                                │
                     ┌──────────┴──────────────────────────────────┐
                     │ Backend Driver Vehicle Scoping Check        │
                     └──────────┬──────────────────────┬───────────┘
                                │ PASSED               │ FAILED
                                ▼                      ▼
                      Process Inspection         Return HTTP 403
                                │                Log Security Event
                     ┌──────────┴──────────────────────────────────┐
                     │ Critical Item Failed?                       │
                     └──────────┬──────────────────────┬───────────┘
                                │ YES                  │ NO
                                ▼                      ▼
                      Ground Vehicle (GROUNDED)  Inspection PASSED
                      Open VehicleDowntime       Vehicle ACTIVE
                      Auto-Create Work Order
```

---

## 4. Safety Chain Integration & Audit Trail

1. **Pre-Trip Inspection Creation**: Immutable `TripInspection` record created with `InspectionItemResult` list.
2. **Critical Grounding Chain**: If a critical item (e.g. Steering, Brake failure, Tyre blowout risk) fails, `isGrounded` is set to `true`, `Vehicle` status transitions to `GROUNDED`, `VehicleDowntime` is created, and Workshop `WorkOrder` is auto-generated.
3. **Audit Trail**: Every inspection submission and grounding event is published to `EventPublisherService` and logged in `audit_logs`.
