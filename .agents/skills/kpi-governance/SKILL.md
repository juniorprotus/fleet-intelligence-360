---
name: kpi-governance
description: FI360 Permanent KPI Governance Standard (CONFIGURED ≠ MONITORED, MONITORED ≠ MEASURED, MEASURED ≠ HEALTHY, HEALTHY ≠ COMPLIANT, NO DATA ≠ ZERO, ZERO ≠ NOT MONITORED)
---

# FI360 Permanent Platform Architecture & Service Consumption Standard v1.0

This architectural standard applies to EVERY module and EVERY role across FI360:
`CEO`, `FLEET_MANAGER`, `WORKSHOP_MANAGER`, `TYRE_SUPERVISOR`, `TYRE_TECHNICIAN`, `FINANCE_MANAGER`, `DRIVER`, `SUPER_ADMIN`, `AUDITOR`.

## Core Principle
> **"BUILD THE BUSINESS CAPABILITY, REUSE THE PLATFORM."**

## 11 Protected Shared Platform Services
1. Authentication
2. RBAC / Permission Matrix
3. Data Scope Engine
4. RACI / Responsibility Engine
5. KPI Governance Engine (`KpiGovernanceService`)
6. Universal Drill-Down Engine
7. Audit & Compliance Engine
8. Reporting Engine
9. Alert / Notification Engine
10. File / Attachment Storage Service
11. AI / Intelligence Engine

## Core Semantic Axioms
1. **CONFIGURED ≠ MONITORED**: System configuration does NOT imply active monitoring telemetry.
2. **MONITORED ≠ MEASURED**: Monitoring existing does NOT imply numerical measurements exist.
3. **MEASURED ≠ HEALTHY**: Measured values do NOT imply target compliance.
4. **HEALTHY ≠ COMPLIANT**: Basic status probes do NOT imply complete operational compliance.
5. **NO DATA ≠ ZERO**: Missing telemetry MUST return `INSUFFICIENT_DATA` or `NOT_MONITORED`, NEVER false `0` or `0%`.
6. **ZERO ≠ NOT MONITORED**: Genuine zero results return `0` with explicit data coverage metadata.

## Change Control Procedure
If a module requirement cannot be satisfied using an existing core service:
1. Do NOT create a parallel service.
2. Document the requirement.
3. Determine whether the existing service can be extended.
4. Raise an architectural change request.
5. Obtain architecture approval.
6. Extend the shared service if approved.
7. Update platform documentation and tests.

## Release Gate Command
```bash
node scratch/kpi-compliance-gate.js
```
Any non-compliant KPI or duplicate service implementation blocks release.
