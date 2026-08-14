# FI360 Phase 5 — UI/UX & Frontend Integration Contract Specification

**Document ID**: `FI360-PHASE5-UI-UX-CONTRACT-v1.0`  
**Date**: August 14, 2026  
**Status**: APPROVED SPECIFICATION  

---

## 1. Design Aesthetics & Visual Standards

Phase 5 views strictly maintain FI360's rich aesthetic design rules (vibrant color accents, glassmorphic card containers, micro-animation state transitions, and mobile-responsive dark-mode layouts).

---

## 2. Frontend Component Specifications

### Component 1: Driver Safety & Shift Dashboard (`dashboard-driver-safety`)
- **Landing View**: Designed for `DRIVER`, `FLEET_MANAGER`, and `SUPER_ADMIN`.
- **KPI Summary Cards**:
  - `Pre-Trip Inspection Compliance` (Percentage card).
  - `Driver Safety Score` (Gauge widget: 94.5 / 100).
  - `Active Driver Shift Assignments` (Metric badge).
  - `Open Safety Incidents` (Alert badge).

### Component 2: Digital Pre-Trip Inspection Form Modal (`#modal-pretrip-inspection`)
- **Checklist Sections**:
  - Steer & Drive Tyres (Tread Depth & Pressure).
  - Air Brakes & Pedal Pressure.
  - Headlights, Indicators & Emergency Flashes.
  - Steering & Suspension.
  - Engine Oil, Coolant & Fluid Leaks.
- **Action**: Submitting a failed critical item automatically triggers grounding notification and grounds vehicle.
