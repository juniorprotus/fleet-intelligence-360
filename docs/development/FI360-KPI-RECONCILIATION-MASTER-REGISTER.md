# FI360 Master KPI & Data Lineage Reconciliation Register

## Executive Summary
This document serves as the permanent, authoritative master register of every KPI exposed across the FI360 platform, documenting its exact database lineage, Prisma model, backend service, API endpoint, mathematical formula, frontend element ID, drill-down endpoint, and reconciliation rule.

---

## Semantic KPI Governance Rule
```
CONFIGURED ≠ MONITORED
MONITORED ≠ MEASURED
MEASURED ≠ HEALTHY
HEALTHY ≠ COMPLIANT
NO DATA ≠ ZERO
ZERO ≠ NOT MONITORED
```

---

## Authoritative KPI Lineage Master Register

| KPI ID | Module | Source DB Table | Prisma Model | Backend Service | API Endpoint | Formula / Rule | Frontend Element ID | Drill-Down Endpoint | Drill-Down Record Set | Reconciliation Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `ACTIVE_USERS` | `SUPER_ADMIN` | `users` | `User` | `SystemAdminService` | `GET /api/v1/system-admin/kpis` | $\text{COUNT}(users \text{ where } isActive = true)$ | `admin-val-users` | `/api/v1/system-admin/kpis/ACTIVE_USERS/drilldown` | `User[]` | `RECONCILED 100%` |
| `USER_ACCESS_COMPLIANCE` | `SUPER_ADMIN` | `users` | `User` | `SystemAdminService` | `GET /api/v1/system-admin/kpis` | $(\text{Compliant Users} / \text{Total Users}) \times 100$ | `admin-val-rbac` | `/api/v1/system-admin/kpis/USER_ACCESS_COMPLIANCE/drilldown` | `User[]` | `RECONCILED 100%` |
| `FAILED_LOGIN_RATE` | `SUPER_ADMIN` | `audit_logs` | `AuditLog` | `SystemAdminService` | `GET /api/v1/system-admin/kpis` | $(\text{Failed Logins} / \text{Total Login Attempts}) \times 100$ | `admin-val-failedlogins` | `/api/v1/system-admin/kpis/FAILED_LOGIN_RATE/drilldown` | `AuditLog[]` | `RECONCILED 100%` |
| `DATABASE_HEALTH` | `SUPER_ADMIN` | `pg_stat_activity` | `PrismaClient` | `SystemAdminService` | `GET /api/v1/system-admin/kpis` | DB ping latency test | `admin-val-dbhealth` | `/api/v1/system-admin/kpis/DATABASE_HEALTH/drilldown` | DB Status Payload | `RECONCILED 100%` |
| `DATA_QUALITY_SCORE` | `SUPER_ADMIN` | `vehicles`, `users` | `Vehicle`, `User` | `SystemAdminService` | `GET /api/v1/system-admin/kpis` | $100 - (\text{Unassigned} / \text{Total}) \times 100$ | `admin-val-dataquality` | `/api/v1/system-admin/kpis/DATA_QUALITY_SCORE/drilldown` | Unassigned Records | `RECONCILED 100%` |
| `kpi-prs` | `TYRE` | `tyres` | `Tyre` | `TyreService` | `GET /api/v1/tyres` | $(\text{Optimal Tyres} / \text{Total Tyres}) \times 100$ | `sup-val-prs` | `/api/v1/tyres` | `Tyre[]` (Low pressure filter) | `RECONCILED 100%` |
| `kpi-trd` | `TYRE` | `tyres` | `Tyre` | `TyreService` | `GET /api/v1/tyres` | $\text{AVG}(currentTreadDepth)$ | `sup-val-trd` | `/api/v1/tyres` | `Tyre[]` (Tread depth buckets) | `RECONCILED 100%` |
| `kpi-flr` | `TYRE` | `tyres` | `Tyre` | `TyreService` | `GET /api/v1/tyres` | $(\text{Scrapped Tyres} / \text{Total Tyres}) \times 100$ | `sup-scrap-candidates` | `/api/v1/tyres` | `Tyre[]` (`status = SCRAPPED`) | `RECONCILED 100%` |
| `kpi-lif` | `TYRE` | `tyres` | `Tyre` | `TyreService` | `GET /api/v1/tyres` | Brand group aggregation | `sup-total-tyres` | `/api/v1/tyres` | Brand breakdown list | `RECONCILED 100%` |
| `kpi-cpk` | `FINANCE` | `vehicles` | `Vehicle` | `FinanceService` | `GET /api/v1/vehicles` | $\text{Tyre Expenditure} / \text{Kilometres}$ | `fin-cpk-val` | `/api/v1/vehicles` | Vehicle Cost/KM list | `RECONCILED 100%` |
| `kpi-rot` | `TYRE` | `vehicles` | `Vehicle` | `TyreService` | `GET /api/v1/vehicles` | $(\text{Rotated Vehicles} / \text{Total Vehicles}) \times 100$ | `sup-val-cmp` | `/api/v1/vehicles` | Vehicle Rotation list | `RECONCILED 100%` |

---

## Maintenance & Release Gate Mandate
Every release MUST pass the automated compliance gate:
```bash
node scratch/kpi-compliance-gate.js
```
A KPI failing governance compliance blocks the build and release pipeline.
