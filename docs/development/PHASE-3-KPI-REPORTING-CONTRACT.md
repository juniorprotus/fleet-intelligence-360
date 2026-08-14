# FI360 Phase 3 — KPI & Reporting Contract Specification

**Document ID**: `FI360-PHASE3-KPI-REPORTING-CONTRACT-v1.0`  
**Date**: August 14, 2026  
**Status**: APPROVED SPECIFICATION  

---

## 1. Core Platform Service Consumption Mandate

In strict compliance with **FI360 Core Platform Service Consumption Standard v1.0** and **KPI Governance Standard (`AGENTS.md`)**:
- All Phase 3 Workshop KPIs MUST process through `KpiGovernanceService` (`backend/src/kpi/kpi-governance.service.ts`).
- All Phase 3 Workshop Reports MUST process through `UniversalReportService` (`backend/src/reporting/universal-report.service.ts`).
- Modules MUST NOT create parallel KPI or PDF reporting engines.

---

## 2. Governed Phase 3 Workshop KPIs (22-Field Contract Schema)

Every Phase 3 KPI strictly conforms to the 22 required fields:
`[kpiId, name, value, displayValue, unit, formula, dataSource, measurementPeriod, dataCoverage, sampleSize, target, variance, status, trend, calculationTimestamp, lastDataTimestamp, dataQualityStatus, drillDownAvailable, definitionVersion, formulaVersion, effectiveFrom, effectiveTo]`.

### KPI 1: `WORKSHOP_UTILIZATION`
- **Name**: Workshop Bay & Labor Utilization Rate
- **Formula**: `(Actual Billable Labor Hours / Available Technician Hours) * 100`
- **Target**: `85.0%`
- **Status Rules**: `GREEN` (>= 80%), `AMBER` (65–79%), `RED` (< 65%).
- **Semantic Axiom**: Denominator 0 technician hours returns `INSUFFICIENT_DATA` or `N/A`. Missing data NEVER converts to zero.

### KPI 2: `MEAN_TIME_TO_REPAIR` (MTTR)
- **Name**: Mean Time to Repair Grounded Vehicles
- **Formula**: `Sum(Work Order Labor Hours for Grounded Vehicles) / Count(Completed Grounding Work Orders)`
- **Target**: `<= 4.0 Hours`
- **Status Rules**: `GREEN` (<= 4.0 hrs), `AMBER` (4.1–6.0 hrs), `RED` (> 6.0 hrs).

### KPI 3: `WORK_ORDER_BACKLOG`
- **Name**: Open Maintenance Work Order Backlog
- **Formula**: `Count(Work Orders in DRAFT, SCHEDULED, or IN_PROGRESS state)`
- **Target**: `<= 5 Work Orders per Workshop`
- **Drill-Down**: Itemized reconciled list of open work order IDs.

---

## 3. Phase 3 Universal Executive Reports (15 Mandatory Metadata Fields)

### Report 1: `WORKSHOP_MAINTENANCE_SUMMARY_REPORT`
- **Report ID**: `WORKSHOP_MAINTENANCE_SUMMARY_REPORT`
- **Category**: `OPERATIONAL_EXCELLENCE`
- **Scope**: `WORKSHOP` / `REGION` / `ORGANISATION`
- **15 Metadata Fields**: Defined in catalogue, supporting PDF/Excel/CSV exports.

### Report 2: `PREVENTATIVE_MAINTENANCE_COMPLIANCE_REPORT`
- **Report ID**: `PREVENTATIVE_MAINTENANCE_COMPLIANCE_REPORT`
- **Category**: `ASSET_INTEGRITY`
- **Scope**: `ORGANISATION` / `REGION`
- **Purpose**: Executive compliance report tracking PM schedule adherence vs overdue services across fleet vehicles.
