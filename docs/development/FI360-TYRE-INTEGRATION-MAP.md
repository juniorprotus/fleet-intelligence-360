# FI360 TYRE INTELLIGENCE — SYSTEM INTEGRATION MAP

**Document Reference**: `FI360-TYRE-INT-001`  
**Assessment Date**: August 15, 2026  
**Mode**: Read-Only Forensic Assessment  

---

## 1. CROSS-DOMAIN INTEGRATION ARCHITECTURE

The Tyre Intelligence module integrates with 11 core FI360 platform services and business domains in strict compliance with the **FI360 Core Platform Service Consumption Standard v1.0**.

```
                           ┌─────────────────────────────────────────┐
                           │          FI360 PLATFORM CORE            │
                           │  - Auth Engine (JWT & RBAC Guards)      │
                           │  - Data Scope Engine (Workshop/Region)  │
                           │  - KPI Governance Engine               │
                           │  - Universal Reporting Engine           │
                           │  - Audit & Compliance Interceptor       │
                           └────────────────────┬────────────────────┘
                                                │
                                                ▼
┌──────────────────────┐               ┌──────────────────┐               ┌──────────────────────┐
│  VEHICLE MASTER      │◄─────────────►│ TYRE INTELLIGENCE│◄─────────────►│ WORKSHOP OPERATIONS  │
│  - Fitment position  │               │   MODULE (v3.0)  │               │  - Work orders       │
│  - Odometer tracking │               └────────┬─────────┘               │  - Downtime recovery │
└──────────────────────┘                        │                         └──────────────────────┘
                                                │
       ┌────────────────────────────────────────┼────────────────────────────────────────┐
       ▼                                        ▼                                        ▼
┌──────────────┐                       ┌──────────────────┐                     ┌──────────────────┐
│ INVENTORY    │                       │ DRIVER SAFETY    │                     │ EXECUTIVE / CEO  │
│ - Tyre stock │                       │ - Pre-trip tyres │                     │ - Fleet health   │
│ - Requisition│                       │ - Safety defects │                     │ - Tyre KPIs      │
└──────────────┘                       └──────────────────┘                     └──────────────────┘
```

---

## 2. INTEGRATION MATRIX BY DOMAIN

| Integrated Domain | Integration Mechanism | Data Shared / Events Exchanged | Platform Service Used | Integration Status |
| :--- | :--- | :--- | :--- | :--- |
| **Vehicle Master** | Prisma FK `vehicleId` & REST API `GET /api/v1/vehicles` | Vehicle registration, current odometer, workshop assignment, fitted tyres | Data Scope Engine | **COMPLETE** |
| **Workshop Operations** | Prisma FK `workOrders` on `TyreDefect` | Work order creation for critical tyre defects, maintenance scheduling | RACI / Accountability Engine | **COMPLETE** |
| **Vehicle Downtime** | Prisma FK `downtimes` on `TyreDefect` | Vehicle grounding when tyre defect severity is `CRITICAL` | Alert & Notification Engine | **COMPLETE** |
| **Inventory & Spare Parts** | Prisma FK `supplierId` & `currentStatus` | In-stock tyre tracking, spare tyre count, physical stock reconciliation | Audit & Compliance Engine | **COMPLETE** |
| **Procurement** | `purchaseOrderNumber`, `supplierId` | Tyre purchase order reference, vendor cataloguing | Audit Engine | **COMPLETE** |
| **Driver & Pre-Trip Safety** | `POST /api/v1/safety/incidents` | Driver-reported tyre defects during pre-trip inspection | RACI Engine | **COMPLETE** |
| **KPI Governance Engine** | `KpiGovernanceService` integration | 15 Governed Tyre KPIs evaluated against 22-field contract schema | KPI Governance Engine | **COMPLETE** |
| **Universal Reporting** | `UniversalReportService` | Master Tyre Inventory, Fitment Ledger, Tread Inspection, Defect exports | Universal Reporting Engine | **COMPLETE** |
| **Audit & Compliance** | Append-only `TyreMovement` table & Audit Log Interceptor | Immutable trail of fitments, removals, inspections, approvals | Audit & Compliance Engine | **COMPLETE** |
| **AI & Intelligence Engine** | Machine learning feature input vectors | Tread wear rate, remaining useful life estimate, replacement forecasting | AI & Intelligence Engine | **PARTIAL (Data Vectors Ready)** |
| **Telematics / Sensors** | Database fields (`dotCode`, `companyBrandNumber`) | Automated pressure/tread wireless telemetry stream | N/A | **DEFERRED** |
