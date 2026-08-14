# FI360 Permanent Platform Architecture Standards

## Core Platform Service Consumption Standard v1.0

### Protected Shared Platform Services:
1. **Authentication Engine**: JWT authentication, session tokens & auth strategies.
2. **RBAC & Permission Matrix Engine**: Granular permissions & roles (`backend/src/auth/roles.guard.ts` & `permissions.matrix.ts`).
3. **Data Scope Engine**: Organizational scope level filtering (`SYSTEM`, `ORGANISATION`, `REGION`, `WORKSHOP`, `DEPOT`).
4. **RACI / Responsibility Engine**: Operational accountability assignment & escalation rules.
5. **KPI Governance Engine**: Centralized KPI evaluation, validation & status engine (`backend/src/kpi/kpi-governance.service.ts`).
6. **Universal Drill-Down Engine**: Mathematically reconciled itemized record drill-downs.
7. **Audit & Compliance Engine**: Centralized audit log interceptor & `audit_logs` table.
8. **Reporting Engine**: Spreadsheet (CSV/Excel) & executive PDF generator.
9. **Alert & Notification Engine**: Anomaly detection & threshold notification relay.
10. **File & Attachment Storage Service**: Document & inspection photo asset storage.
11. **AI & Intelligence Engine**: Inference telemetry & prediction model governance.

---

### Core Principle
> **"BUILD THE BUSINESS CAPABILITY, REUSE THE PLATFORM."**  
> Do not rebuild platform infrastructure inside individual FI360 modules.

---

### Consumption Mandate for All Business Modules
Applicable to all current and future modules (`Fuel Intelligence`, `Workshop Intelligence`, `Driver Intelligence`, `Financial Intelligence`, `Asset Lifecycle Intelligence`, `Sustainability Intelligence`, `Executive Intelligence`, `Procurement Intelligence`, `Inventory Intelligence`, `Compliance Intelligence`):

**MODULES MUST NOT CREATE PARALLEL IMPLEMENTATIONS OF:**
- Authentication & Session logic
- Permission logic & Role guards
- Data-scope filtering & Region/Workshop access queries
- KPI evaluation & KPI status calculation
- Drill-down logic & reconciliation wrappers
- Audit logging & activity history trackers
- Report generation & file formatting logic
- Alert management & notification dispatchers
- File storage handlers
- AI orchestration engines

---

### Architecture Change Control Workflow
If a module requirement cannot be satisfied using an existing core service:
1. Do NOT create a parallel service.
2. Document the exact requirement.
3. Determine whether the existing core service can be extended.
4. Raise an architectural change request.
5. Obtain architecture approval.
6. Extend the shared platform service if approved.
7. Update the platform documentation and automated tests.

---

## KPI & Analytics Governance Standard — FREEZE & CHANGE CONTROL

The following semantic KPI rule is a permanent FI360 platform architecture standard and applies to EVERY module and EVERY role (`CEO`, `FLEET_MANAGER`, `WORKSHOP_MANAGER`, `TYRE_SUPERVISOR`, `TYRE_TECHNICIAN`, `FINANCE_MANAGER`, `DRIVER`, `SUPER_ADMIN`, `AUDITOR`):

```
CONFIGURED ≠ MONITORED
MONITORED ≠ MEASURED
MEASURED ≠ HEALTHY
HEALTHY ≠ COMPLIANT
NO DATA ≠ ZERO
ZERO ≠ NOT MONITORED
```

### Freeze & Protected Service Policy
`KpiGovernanceService` (`backend/src/kpi/kpi-governance.service.ts`) is a **protected FI360 core platform service**.
- Do NOT create module-specific KPI governance engines or parallel frameworks.
- Do NOT bypass, modify, duplicate, or weaken `KpiGovernanceService`.
- Any change to the core KPI contract or semantic rules requires explicit architecture review before implementation.

### Mandatory Architectural Standards:
1. **Central Engine Mandate**: Every KPI MUST use `KpiGovernanceService` (`backend/src/kpi/kpi-governance.service.ts`).
2. **22-Field Contract**: Every KPI MUST conform to the 22-field KPI contract schema.
3. **Complete Metadata**: Every KPI MUST define dataSource, formula, measurementPeriod, dataCoverage, sampleSize, target, variance, status, trend, calculationTimestamp, lastDataTimestamp, dataQualityStatus, drillDownAvailable, definitionVersion, formulaVersion, effectiveFrom, and effectiveTo.
4. **No Hard-coded Production Values**: Values MUST be calculated from real data or return appropriate N/A status tokens.
5. **No Missing-Data Conversion**: Missing data MUST NEVER be converted into zero or zero percent.
6. **No Denominator-Zero Misleading Results**: Denominator zero MUST return `INSUFFICIENT_DATA` or `N/A`.
7. **No Unsupported Status Tokens**: No KPI may return `GREEN`, `AMBER`, or `RED` without verified measured data.
8. **Reconciliation Guarantee**: KPI drill-downs MUST mathematically reconcile with headline KPI values.
9. **Failure Isolation**: A single KPI calculation failure MUST return `CALCULATION_UNAVAILABLE` and NEVER crash a dashboard.
10. **RBAC & Scope Respect**: KPI calculations MUST strictly filter underlying records according to the user's role and scope.
11. **Definition Versioning**: All KPI definitions MUST be versioned (`definitionVersion`, `formulaVersion`, `effectiveFrom`, `effectiveTo`).
12. **Automated Release Gate**: Every release MUST pass the compliance gate: `node scratch/kpi-compliance-gate.js`.

### Automated Release Gate Command:
```bash
node scratch/kpi-compliance-gate.js
```
A KPI failing governance compliance blocks the build and release pipeline.
