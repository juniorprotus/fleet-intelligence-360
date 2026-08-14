# FI360 Phase 3 — UI/UX & Frontend Integration Contract Specification

**Document ID**: `FI360-PHASE3-UI-UX-CONTRACT-v1.0`  
**Date**: August 14, 2026  
**Status**: APPROVED SPECIFICATION  

---

## 1. Design Aesthetics & Visual Standards

Phase 3 frontend views maintain FI360's rich aesthetic design rules (vibrant color accents, glassmorphic card containers, micro-animation state transitions, and responsive dark-mode layouts).

---

## 2. Frontend Component Specifications

### Component 1: Workshop Operational Dashboard (`dashboard-workshop`)
- **Landing View**: Designed for `WORKSHOP_MANAGER` and `TYRE_SUPERVISOR`.
- **KPI Summary Cards**:
  - `Workshop Utilization` (Gauge widget with GREEN/AMBER/RED status).
  - `Mean Time to Repair` (MTTR metric in hours).
  - `Active Work Order Backlog` (Count badge with drill-down link).
  - `Grounded Vehicles Awaiting Repair` (Red alert badge).

### Component 2: Work Order Management Table (`#workorder-table-container`)
- **Columns**: Work Order #, Vehicle Reg, Workshop, Type, Priority, Status, Assigned Tech, Scheduled Start, Actions.
- **Status Badges**:
  - `DRAFT`: `<span class="badge-code text-muted">DRAFT</span>`
  - `SCHEDULED`: `<span class="badge-code text-blue">SCHEDULED</span>`
  - `IN_PROGRESS`: `<span class="badge-code text-amber">IN PROGRESS</span>`
  - `PENDING_APPROVAL`: `<span class="badge-code text-purple">PENDING APPROVAL</span>`
  - `COMPLETED`: `<span class="badge-code text-green">COMPLETED</span>`

### Component 3: Work Order Completion & Recovery Modal (`#modal-complete-workorder`)
- **Fields**: Actual Hours, Parts Cost, Labor Cost, Resolution Notes, Quality Sign-off Checkbox.
- **Workflow Trigger**: Submitting invokes `PUT /api/v1/work-orders/:id/complete`, updating the Work Order, closing the linked `VehicleDowntime` ledger, and refreshing the Vehicle status badge from `GROUNDED` → `ACTIVE`.
