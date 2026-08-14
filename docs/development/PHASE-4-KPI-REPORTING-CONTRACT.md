# FI360 Phase 4 — KPI & Reporting Contract Specification

**Document ID**: `FI360-PHASE4-KPI-REPORTING-CONTRACT-v1.0`  
**Date**: August 14, 2026  
**Status**: APPROVED SPECIFICATION  

---

## 1. Core Platform Service Consumption Mandate

In strict compliance with **FI360 Core Platform Service Consumption Standard v1.0** and **KPI Governance Standard (`AGENTS.md`)**:
- All Phase 4 Inventory & Procurement KPIs MUST process through `KpiGovernanceService` (`backend/src/kpi/kpi-governance.service.ts`).
- All Phase 4 Executive Reports MUST process through `UniversalReportService` (`backend/src/reporting/universal-report.service.ts`).

---

## 2. Governed Phase 4 Inventory & Procurement KPIs (22-Field Contract Schema)

Every Phase 4 KPI strictly conforms to the 22 required fields:
`[kpiId, name, value, displayValue, unit, formula, dataSource, measurementPeriod, dataCoverage, sampleSize, target, variance, status, trend, calculationTimestamp, lastDataTimestamp, dataQualityStatus, drillDownAvailable, definitionVersion, formulaVersion, effectiveFrom, effectiveTo]`.

### KPI 1: `INVENTORY_TURNOVER`
- **Name**: Annualized Inventory Turnover Ratio
- **Formula**: `(Total Parts Cost Consumed / Average Inventory Valuation) * 100`
- **Target**: `4.0 Turns / Year`
- **Status Rules**: `GREEN` (>= 4.0), `AMBER` (2.5–3.9), `RED` (< 2.5).

### KPI 2: `PARTS_STOCKOUT_RATE`
- **Name**: Work Order Parts Stockout Rate
- **Formula**: `(Work Orders Delayed by Stockout / Total Parts Requisitions) * 100`
- **Target**: `<= 2.0%`
- **Status Rules**: `GREEN` (<= 2.0%), `AMBER` (2.1–5.0%), `RED` (> 5.0%).

### KPI 3: `PO_FULFILLMENT_CYCLE_TIME`
- **Name**: Purchase Order Fulfillment Cycle Time
- **Formula**: `Sum(Days between PO Creation and PO Goods Receipt) / Count(Received POs)`
- **Target**: `<= 5.0 Days`
- **Status Rules**: `GREEN` (<= 5.0 days), `AMBER` (5.1–9.0 days), `RED` (> 9.0 days).

---

## 3. Phase 4 Universal Executive Reports (15 Mandatory Metadata Fields)

### Report 1: `INVENTORY_VALUATION_AND_STOCK_LEAKAGE_REPORT`
- **Report ID**: `INVENTORY_VALUATION_AND_STOCK_LEAKAGE_REPORT`
- **Category**: `ASSET_INTEGRITY`
- **Scope**: `WORKSHOP` / `REGION` / `ORGANISATION`
- **Purpose**: Comprehensive valuation report of spare parts on hand, stock turn velocity, and variance audit logs.

### Report 2: `PROCUREMENT_PURCHASE_ORDER_FULFILLMENT_REPORT`
- **Report ID**: `PROCUREMENT_PURCHASE_ORDER_FULFILLMENT_REPORT`
- **Category**: `SUPPLY_CHAIN_EFFICIENCY`
- **Scope**: `ORGANISATION` / `REGION`
- **Purpose**: Executive vendor performance and fulfillment tracking report.
