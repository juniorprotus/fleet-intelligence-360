# FI360 Phase 4 — UI/UX & Frontend Integration Contract Specification

**Document ID**: `FI360-PHASE4-UI-UX-CONTRACT-v1.0`  
**Date**: August 14, 2026  
**Status**: APPROVED SPECIFICATION  

---

## 1. Design Aesthetics & Visual Standards

Phase 4 views strictly maintain FI360's rich aesthetic design rules (vibrant color accents, glassmorphic card containers, micro-animation state transitions, and responsive dark-mode layouts).

---

## 2. Frontend Component Specifications

### Component 1: Inventory & Stock Control Dashboard (`dashboard-inventory`)
- **Landing View**: Designed for `WORKSHOP_MANAGER`, `FLEET_MANAGER`, and `TYRE_SUPERVISOR`.
- **KPI Summary Cards**:
  - `Inventory Turnover Ratio` (Gauge widget).
  - `Parts Stockout Rate` (Percentage card).
  - `Purchase Order Fulfillment Time` (Metric in days).
  - `Stock Below Reorder Level` (Red alert badge).

### Component 2: Spare Parts Stock Master Table (`#inventory-stock-table`)
- **Columns**: Part #, Name, Category, Workshop, Stock on Hand, Reserved, Reorder Level, Unit Cost, Status Badge.

### Component 3: Parts Requisition Modal (`#modal-parts-requisition`)
- **Fields**: Work Order #, Spare Part Selector, Quantity Required, Technician Notes.
- **Action**: Issues part, deducts workshop stock, and updates Work Order parts cost.
