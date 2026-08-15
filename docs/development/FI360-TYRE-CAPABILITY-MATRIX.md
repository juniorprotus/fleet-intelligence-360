# FI360 TYRE INTELLIGENCE — CAPABILITY INVENTORY & STATUS MATRIX

**Document Reference**: `FI360-TYRE-CSM-001`  
**Assessment Date**: August 15, 2026  
**Mode**: Read-Only Forensic Assessment  

---

## 1. CAPABILITY STATUS MATRIX

The matrix below documents every Tyre capability across Backend, Database, API, Frontend, Role Access, End-to-End Status, and Integration points.

| Capability Domain | Backend Service | Database Table | REST API Endpoint | Frontend UI | Allowed Roles | End-to-End Status | KPI / Report Integration | Status Token |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Tyre Registration** | `TyreService.create` | `tyres` | `POST /api/v1/tyres/register` | Modal `modal-register-tyre` | `TYRE_SUPERVISOR`, `TYRE_TECHNICIAN`, `FLEET_MANAGER` | YES | Governed KPI `TYRE_REGISTRATION_ACCURACY` | `COMPLETE + UX ISSUE` |
| **FI360 Tyre ID Minting** | `TyreService.mintTyreIdentifier` | `tyres.tyre_identifier` | Auto-generated during register | Displayed in tables | All Roles | YES | Master Tyre Inventory | `COMPLETE` |
| **Tyre Master Query** | `TyreService.findAll` / `findOne` | `tyres` | `GET /api/v1/tyres`, `GET /api/v1/tyres/:id` | Tables in Sup/Tech/FM dashboards | All Roles | YES | Master Ledger Report | `COMPLETE` |
| **Tyre Fitment** | `TyreService.fitTyre` | `tyre_fitments` | `POST /api/v1/tyres/fitments` | Modal `modal-fit-tyre` | `TYRE_TECHNICIAN`, `TYRE_SUPERVISOR` | YES | Fitment Ledger & Rotation Compliance KPI | `COMPLETE + UX ISSUE` |
| **Tyre Removal** | `TyreService.removeTyre` | `tyre_fitments` | `PUT /api/v1/tyres/fitments/:id/remove` | Action button in Fitment Table | `TYRE_TECHNICIAN`, `TYRE_SUPERVISOR` | YES | Removal Reason Ledger | `COMPLETE` |
| **Position & Axle Mapping** | `TyreService.fitTyre` | `tyre_fitments` | Included in fitment DTO | Manual text input | `TYRE_TECHNICIAN`, `TYRE_SUPERVISOR` | YES | Axle Position Ledger | `COMPLETE + UX ISSUE` |
| **Tread & Pressure Inspection** | `TyreService.createInspection` | `tyre_inspections` | `POST /api/v1/tyres/inspections` | Modal `modal-inspect-tyre` | `TYRE_TECHNICIAN`, `TYRE_SUPERVISOR` | YES | Inspection Compliance KPI & Pressure KPI | `COMPLETE + UX ISSUE` |
| **7-Day Inspection Schedule** | `TyreService.getWeeklyInspectionSchedule` | `tyres`, `tyre_inspections` | `GET /api/v1/tyres/weekly-schedule` | Tab in Tech/Sup dashboards | `TYRE_SUPERVISOR`, `TYRE_TECHNICIAN` | YES | Weekly Schedule Queue | `COMPLETE` |
| **Mechanic Work Queue** | `TyreService.getMechanicWorkQueue` | `tyre_fitments`, `tyre_inspections` | `GET /api/v1/tyres/mechanic-work-queue` | Tab `tech-fitments` / `tech-schedule` | `TYRE_TECHNICIAN` | YES | Technician Work Queue | `COMPLETE` |
| **Supervisor Work Queue** | `TyreService.getSupervisorWorkQueue` | `tyre_fitments`, `tyre_inspections` | `GET /api/v1/tyres/supervisor-work-queue` | Tab `sup-tab-verify-fitments` | `TYRE_SUPERVISOR` | YES | Work Sign-off Completion KPI | `COMPLETE + UX ISSUE` |
| **Supervisor Fitment Verify** | `TyreService.verifyFitment` | `tyre_fitments` | `PUT /api/v1/tyres/fitments/:id/verify` | Action button in Sup Table | `TYRE_SUPERVISOR` | YES | Segregation of Duties Audit Log | `COMPLETE` |
| **Supervisor Inspection Verify** | `TyreService.verifyInspection` | `tyre_inspections` | `PUT /api/v1/tyres/inspections/:id/verify` | Action button in Sup Table | `TYRE_SUPERVISOR` | YES | Segregation of Duties Audit Log | `COMPLETE` |
| **Tyre Defect Reporting** | `TyreService.createDefect` | `tyre_defects` | `POST /api/v1/safety/incidents` | Pre-trip inspection / Defect Modal | Drivers, Techs, Supervisors | YES | Safety Critical Tyres KPI (`RED` alert) | `COMPLETE` |
| **Tyre Movement Ledger** | `TyreService.getMovementHistory` | `tyre_movements` | `GET /api/v1/tyres/:id/movements` | Movement History Modal | All Roles | YES | Append-only Audit History | `COMPLETE` |
| **Tyre Rotation** | `TyreService.rotateTyre` | `tyre_movements`, `tyre_fitments` | `POST /api/v1/tyres/rotate` | Modal `modal-rotate-tyre` | `TYRE_TECHNICIAN`, `TYRE_SUPERVISOR` | YES | Rotation Compliance KPI | `COMPLETE` |
| **Tyre Repair** | `TyreService.repairTyre` | `tyre_movements`, `tyres` | `POST /api/v1/tyres/repair` | Modal `modal-repair-tyre` | `TYRE_TECHNICIAN`, `TYRE_SUPERVISOR` | YES | Repair Count & Maintenance Spend | `COMPLETE` |
| **Tyre Retread Tracking** | `TyreService.update` | `tyres.retread_count` | `PUT /api/v1/tyres/:id` | Status dropdown in Tyre Master | `TYRE_SUPERVISOR` | YES | Retread Ratio KPI | `COMPLETE` |
| **Tyre Disposal / Scrap** | `TyreService.disposeTyre` | `tyre_movements`, `tyres` | `POST /api/v1/tyres/:id/dispose` | Modal `modal-dispose-tyre` | `TYRE_SUPERVISOR` | YES | Scrap Rate KPI | `COMPLETE` |
| **Tyre Stock & Inventory** | `TyreService.getSummary` | `tyres` | `GET /api/v1/tyres/summary` | Stock Ledger Tab | `INVENTORY_MANAGER`, `TYRE_SUPERVISOR` | YES | Stock Accuracy KPI | `COMPLETE` |
| **Governed Supervisor KPIs** | `TyreService.getSupervisorKPIs` | All Tyre tables | `GET /api/v1/tyres/supervisor-kpis` | 15 KPI Cards on Sup Dashboard | `TYRE_SUPERVISOR` | YES | `KpiGovernanceService` contract | `COMPLETE` |
| **Universal Tyre Reports** | `UniversalReportService` | All Tyre tables | `POST /api/v1/reports/generate` | Universal Reporting Modal | All Roles | YES | PDF / Excel Tyre Reports | `COMPLETE` |
| **Interactive Axle Diagram** | N/A | N/A | N/A | Text input only | `TYRE_TECHNICIAN` | NO | None | `MISSING` |
| **Batch Supervisor Verification** | N/A | N/A | N/A | Single record verify | `TYRE_SUPERVISOR` | NO | None | `MISSING` |
| **Automated RFID / Sensor Stream**| N/A | N/A | N/A | N/A | Future Scope | NO | None | `DEFERRED` |

---

## 2. STATUS LEGEND & SUMMARY
- **COMPLETE**: 13 Capabilities
- **COMPLETE + UX ISSUE**: 5 Capabilities (Registration, Fitment, Position Mapping, Inspection, Supervisor Work Queue)
- **MISSING**: 2 Capabilities (Interactive Axle Diagram, Batch Verification)
- **DEFERRED**: 1 Capability (Automated RFID Stream)
