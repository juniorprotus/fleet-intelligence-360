# FI360 Phase 4 — Architecture Discovery & Baseline Assessment

**Document ID**: `FI360-PHASE4-ARCHITECTURE-DISCOVERY-v1.0`  
**Date**: August 14, 2026  
**Status**: APPROVED SPECIFICATION — DISCOVERY COMPLETE  

---

## 1. Existing Infrastructure Audit & Reusability Map

An architectural audit of the codebase was conducted to determine how Phase 4 (Inventory & Procurement Intelligence) will integrate with certified Phase 1–3 capabilities:

| Certified Capability | Source File / Location | Phase 4 Reusability Plan |
| :--- | :--- | :--- |
| **Multi-Tenant Architecture** | `schema.prisma` (`Tenant`, `Organization`) | All Phase 4 inventory and PO tables contain `tenantId` & `organizationId` fields with composite indexes. |
| **Workshop Master** | `schema.prisma` (`Workshop`) | Stock ledgers (`InventoryStock`) link directly to `workshops.id`. Zero duplicate workshop tables. |
| **Work Order Master** | `schema.prisma` (`WorkOrder`) | Parts requisitions (`PartsRequisition`) reference `work_orders.id` to track material costs per WO. |
| **User Identity** | `schema.prisma` (`User`) | Requisitioners and PO approvers reference `users.id`. Zero duplicate user/employee tables. |
| **Approval Workflow Engine** | `ApprovalWorkflowService` | High-value parts requisitions and Purchase Orders utilize `ApprovalWorkflowService` for segregation of duties. |
| **Event Publisher Engine** | `EventPublisherService` | Emits standardized 10-field domain event envelopes (`inventory.issued`, `procurement.po_created`). |
| **Central Audit Logging** | `AuditInterceptor` & `audit_logs` | Automatically logs all inventory stock adjustments, requisitions, and PO status changes. |
| **KPI Governance Engine** | `KpiGovernanceService` | Evaluates Phase 4 KPIs (`INVENTORY_TURNOVER`, `PARTS_STOCKOUT_RATE`, `PO_FULFILLMENT_CYCLE_TIME`). |
| **Universal Reporting Engine** | `UniversalReportService` | Generates Inventory Valuation and Parts Consumption executive reports. |

---

## 2. Platform Entity Hierarchy Map for Phase 4

```
Tenant (TNT-DEFAULT)
  │
  ├── Organization (ORG-DEFAULT)
  │     │
  │     ├── Legal Entity (LEG-DEFAULT)
  │     │
  │     ├── Workshop (Workshop Entity: WS-NBI-01)
  │     │     │
  │     │     ├── InventoryStock (Stock Ledger: 45 Michelin Casings, Reorder Pt: 10)
  │     │     │     │
  │     │     │     └── PartsRequisition (Requisition #REQ-2026-001 for WO-693866)
  │     │     │
  │     │     └── WorkOrder (Phase 3 Work Order Master: WO-693866)
  │     │
  │     └── Vendor (Vendor Master: Michelin Kenya Ltd)
  │           │
  │           └── PurchaseOrder (Purchase Order #PO-2026-010)
```

---

## 3. Core Architecture Rules & Guardrails

1. **Zero Duplicate Master Entities**: No parallel `Vehicle`, `Workshop`, `User`, `Driver`, or `Tyre` tables may be introduced.
2. **Read-Only Cross-Boundary References**: `PartsRequisition` references `WorkOrder.id` via foreign key without mutating `WorkOrder` schema structure.
3. **Database Migration Safety**: Phase 4 migration (`20260816000000_phase4_inventory_procurement`) must be 100% version-controlled, reproducible, and additive.
4. **Mandatory Regression Gates**: All 6 Phase 3 release gates must pass alongside new Phase 4 test suites.
