# FI360 TYRE INTELLIGENCE — CURRENT STATE ASSESSMENT

**Document Reference**: `FI360-TYRE-CSA-001`  
**Assessment Date**: August 15, 2026  
**Mode**: Read-Only Forensic Assessment  
**Platform Version**: FI360 v3.0  

---

## 1. EXECUTIVE SUMMARY

The **FI360 Tyre Intelligence Module** is currently an **Operational & Governed Subsystem (Development Stage 5: Governed)** with **93 physical tyres** tracked in the database, 27 active fitments, 22 tread inspection records, 7 Prisma database models, 25 REST API endpoints, 35 granular RBAC permissions, and 15 governed KPIs evaluated through `KpiGovernanceService`.

While the underlying database models, API contracts, RBAC guards, and segregation-of-duties workflows (Technician vs. Supervisor) are architecturally sound, **the module suffers from usability friction, multi-screen navigation debt, visual table density, and non-intuitive field-level inputs**.

---

## 2. REPOSITORY DISCOVERY & FILE LOCATION MAP

The Tyre Intelligence module extends across backend, database, RBAC, reporting, frontend, and scratch test harnesses:

| Layer | File / Directory Path | Purpose |
| :--- | :--- | :--- |
| **Prisma Models** | [`backend/prisma/schema.prisma`](file:///c:/Users/josep/Downloads/fleet-intelligence-360-main/backend/prisma/schema.prisma#L229-L490) | 7 Models: `Tyre`, `TyreSupplier`, `TyreFitment`, `TyreInspection`, `TyreMovement`, `TyreAlert`, `TyreDefect` |
| **Backend Module** | [`backend/src/tyre/tyre.module.ts`](file:///c:/Users/josep/Downloads/fleet-intelligence-360-main/backend/src/tyre/tyre.module.ts) | NestJS module wiring controllers, services, and Prisma |
| **Backend Service** | [`backend/src/tyre/tyre.service.ts`](file:///c:/Users/josep/Downloads/fleet-intelligence-360-main/backend/src/tyre/tyre.service.ts) | Core business logic, lifecycle transitions, KPI evaluation, verification rules |
| **Backend Controller** | [`backend/src/tyre/tyre.controller.ts`](file:///c:/Users/josep/Downloads/fleet-intelligence-360-main/backend/src/tyre/tyre.controller.ts) | 25 REST API routes with `@UseGuards(JwtAuthGuard, PermissionsGuard)` |
| **DTOs** | [`backend/src/tyre/dto/`](file:///c:/Users/josep/Downloads/fleet-intelligence-360-main/backend/src/tyre/dto/) | `CreateTyreDto`, `UpdateTyreDto`, `CreateTyreFitmentDto`, `CreateTyreInspectionDto`, `TyreQueryDto` |
| **RBAC Permissions** | [`backend/src/auth/permissions.enum.ts`](file:///c:/Users/josep/Downloads/fleet-intelligence-360-main/backend/src/auth/permissions.enum.ts#L16-L60) | 35 Granular `TYRE_*` permission keys |
| **RBAC Matrix** | [`backend/src/auth/permissions.matrix.ts`](file:///c:/Users/josep/Downloads/fleet-intelligence-360-main/backend/src/auth/permissions.matrix.ts) | Role assignments for `TYRE_SUPERVISOR`, `TYRE_TECHNICIAN`, `FLEET_MANAGER`, etc. |
| **KPI Governance** | [`backend/src/kpi/kpi-governance.service.ts`](file:///c:/Users/josep/Downloads/fleet-intelligence-360-main/backend/src/kpi/kpi-governance.service.ts) | Central governance evaluation and 22-field KPI contract validation |
| **Frontend HTML** | [`frontend/index.html`](file:///c:/Users/josep/Downloads/fleet-intelligence-360-main/frontend/index.html#L682-L1150) | `dashboard-tyre-supervisor`, `dashboard-tyre-technician`, `fm-tyres` tab |
| **Frontend JS** | [`frontend/main.js`](file:///c:/Users/josep/Downloads/fleet-intelligence-360-main/frontend/main.js) | Renderers for Supervisor/Technician dashboards, drill-down modals, Toast alerts |
| **Universal Reports** | [`backend/src/reporting/universal-report.service.ts`](file:///c:/Users/josep/Downloads/fleet-intelligence-360-main/backend/src/reporting/universal-report.service.ts) | Tyre master, fitment history, inspection, defect reports |
| **Scratch Verification** | `scratch/audit-forensic-tyre-intelligence-assessment.js` | Read-only forensic evaluation harness |

---

## 3. DATABASE SCHEMA & DATA OWNERSHIP AUDIT

### Models & Data Ownership
- **`Tyre`** (`tyres` table): 93 records. Holds unique `tyreIdentifier` (e.g. `TYR-000001`), serial number, company brand number, brand, model, size, tread depths, pressure, retread count, repair count, current status.
- **`TyreSupplier`** (`tyre_suppliers` table): Supplier details.
- **`TyreFitment`** (`tyre_fitments` table): 27 records. Links `tyreId` to `vehicleId`, position code, odometer, fitment/removal timestamps, `fittedBy`, `supervisorVerifiedBy`, `verificationStatus` (`PENDING`, `VERIFIED`, `REJECTED`).
- **`TyreInspection`** (`tyre_inspections` table): 22 records. Multi-point tread depth (left, center, right, avg), pressure, condition, wear pattern, `inspectedBy`, `supervisorVerifiedBy`, `verificationStatus`.
- **`TyreMovement`** (`tyre_movements` table): Append-only lifecycle history.
- **`TyreAlert`** (`tyre_alerts` table): System alerts with 0-100 risk score and drill-down links.
- **`TyreDefect`** (`tyre_defects` table): Safety defects linked to `VehicleDowntime` and `WorkOrder`.

> **Data Ownership Compliance Verification**:  
> `Tyre` models reference `Vehicle` (`vehicleId`), `User` (`fittedBy`, `inspectedBy`), and `TyreSupplier` (`supplierId`) via foreign key IDs. **`Tyre` DOES NOT own `Vehicle`, `User`, `Driver`, `Workshop`, `Organization`, or `Tenant`**. Data normalization strictly complies with FI360 Platform Architecture Standards v1.0.

---

## 4. TYRE CAPABILITY DEVELOPMENT STAGE

Using the standard 0–7 maturity scale:

| Capability Domain | Development Stage (0-7) | Summary Assessment |
| :--- | :---: | :--- |
| **Tyre Master Registration** | **5 (Governed)** | Minting FI360 Tyre IDs, serials, brand stamps, spec metadata database-backed and audited. |
| **Fitment & Axle Mapping** | **5 (Governed)** | Structured position codes (`AX1-L`, `AX2-R-OUT`), odometer tracking, verification status. |
| **Tread & Pressure Inspection** | **5 (Governed)** | 3-point tread depth measurement, wear pattern classification, pressure tracking. |
| **Segregation of Duties** | **5 (Governed)** | Strict separation: `fittedBy` / `inspectedBy` (Technician) $\neq$ `supervisorVerifiedBy` (Supervisor). |
| **Defect & Safety Risk** | **5 (Governed)** | Severity scoring (`CRITICAL`, `HIGH`, `MEDIUM`), defect logging linked to vehicle downtime. |
| **Lifecycle Transitions** | **5 (Governed)** | Fitment, Removal, Repair, Rotation, Disposal, Retread append-only movement ledger. |
| **Governed KPIs & Analytics** | **5 (Governed)** | 15 Governed KPIs evaluated via `KpiGovernanceService` with 22-field contract compliance. |
| **Universal Reporting** | **4 (Integrated)** | PDF/Excel exports available via Universal Reporting engine. |
| **Mobile / Field Usability** | **3 (Operational)** | Responsive tables exist, but form inputs and navigation are not optimized for mobile touch targets. |
| **Telematics / RFID Integration** | **1 (Foundation)** | Database fields (`dotCode`, `companyBrandNumber`) exist; automated sensor stream deferred. |

---

## 5. REPOSITORY CODE QUALITY & TECHNICAL DEBT

1. **Monolithic Renderer in `frontend/main.js`**: `renderSupervisorDashboard()` and `renderTechnicianDashboard()` contain over 800 lines of inline string templates for complex tables.
2. **Duplicated Selection Logic**: Vehicle axle and tyre position dropdowns are re-created in multiple modals (`modal-fit-tyre`, `modal-inspect-tyre`, `modal-rotate-tyre`).
3. **Hardcoded Fallback Display strings**: While backend KPIs return valid governance tokens (`INSUFFICIENT_DATA`, `NOT_MONITORED`), some frontend views fallback to hardcoded string values instead of rendering governance tooltips.

---

## 6. CONCLUSION & ASSESSMENT VERDICT

The FI360 Tyre Intelligence module is **architecturally solid, fully backed by Prisma database tables, and governed by strict RBAC and KPI rules**. It does NOT require core backend refactoring or schema redesign. However, **it requires a targeted UX Redesign to streamline field operations for Technicians and Supervisors**.
