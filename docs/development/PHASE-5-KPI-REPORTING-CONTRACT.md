# FI360 Phase 5 — KPI & Reporting Contract Specification

**Document ID**: `FI360-PHASE5-KPI-REPORTING-CONTRACT-v1.0`  
**Date**: August 14, 2026  
**Status**: APPROVED SPECIFICATION  

---

## 1. Core Platform Service Consumption Mandate

In strict compliance with **FI360 Core Platform Service Consumption Standard v1.0** and **KPI Governance Standard (`AGENTS.md`)**:
- All Phase 5 Driver & Safety KPIs MUST process through `KpiGovernanceService` (`backend/src/kpi/kpi-governance.service.ts`).
- All Phase 5 Executive Reports MUST process through `UniversalReportService` (`backend/src/reporting/universal-report.service.ts`).

---

## 2. Governed Phase 5 Driver & Safety KPIs (22-Field Contract Schema)

Every Phase 5 KPI strictly conforms to the 22 required fields:
`[kpiId, name, value, displayValue, unit, formula, dataSource, measurementPeriod, dataCoverage, sampleSize, target, variance, status, trend, calculationTimestamp, lastDataTimestamp, dataQualityStatus, drillDownAvailable, definitionVersion, formulaVersion, effectiveFrom, effectiveTo]`.

### KPI 1: `PRE_TRIP_COMPLIANCE_RATE`
- **Name**: Driver Pre-Trip Digital Inspection Compliance
- **Formula**: `(Completed Pre-Trip Inspections / Total Dispatched Vehicle Shifts) * 100`
- **Target**: `>= 98.0%`
- **Status Rules**: `GREEN` (>= 98.0%), `AMBER` (90.0–97.9%), `RED` (< 90.0%).

### KPI 2: `DRIVER_SAFETY_SCORE_AVG`
- **Name**: Average Fleet Driver Safety Score
- **Formula**: `Sum(Driver Safety Scores) / Total Active Drivers`
- **Target**: `>= 92.0 / 100`
- **Status Rules**: `GREEN` (>= 92.0), `AMBER` (85.0–91.9), `RED` (< 85.0).

### KPI 3: `DEFECT_REPORTING_LEAD_TIME`
- **Name**: Pre-Trip Defect Reporting Lead Time
- **Formula**: `Avg(Time between Pre-Trip Inspection Defect Submission and Work Order Creation)`
- **Target**: `<= 15.0 Minutes`
- **Status Rules**: `GREEN` (<= 15.0 mins), `AMBER` (15.1–30.0 mins), `RED` (> 30.0 mins).

---

## 3. Phase 5 Universal Executive Reports (15 Mandatory Metadata Fields)

### Report 1: `DRIVER_PRE_TRIP_INSPECTION_COMPLIANCE_REPORT`
- **Report ID**: `DRIVER_PRE_TRIP_INSPECTION_COMPLIANCE_REPORT`
- **Category**: `OPERATIONAL_COMPLIANCE`
- **Scope**: `ORGANISATION` / `REGION` / `DEPOT`
- **Purpose**: Pre-trip inspection completion audits, failed items, and safety grounding records per depot.

### Report 2: `DRIVER_SAFETY_AND_INCIDENT_EXECUTIVE_SUMMARY_REPORT`
- **Report ID**: `DRIVER_SAFETY_AND_INCIDENT_EXECUTIVE_SUMMARY_REPORT`
- **Category**: `SAFETY_INTEGRITY`
- **Scope**: `ORGANISATION` / `REGION`
- **Purpose**: Executive driver safety ranking, incident breakdown, and trend analysis.
