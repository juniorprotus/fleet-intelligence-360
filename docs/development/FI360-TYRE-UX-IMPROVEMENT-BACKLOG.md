# FI360 TYRE INTELLIGENCE — UX IMPROVEMENT & REDESIGN BACKLOG

**Document Reference**: `FI360-TYRE-UXB-001`  
**Assessment Date**: August 15, 2026  
**Mode**: Read-Only Forensic Assessment  

---

## 1. PURPOSE & DESIGN PRINCIPLES

This backlog outlines the prioritized UX redesign items for **Phase 5B (Tyre Intelligence Ease-of-Use & Redesign)**.

### Core Redesign Principles:
1. **Preserve Baseline Backend**: Zero changes to database schema, Prisma models, RBAC rules, or `KpiGovernanceService`.
2. **Field-First Mobile Usability**: All forms and actions must be optimized for handheld field devices (target buttons $\ge 44\text{px}$, high-contrast tread gauges).
3. **Single-Action Workspaces**: Consolidate scattered tabs into unified operational workspaces for Technicians and Supervisors.
4. **Visual Vehicle Diagrams**: Replace text input for position codes with interactive visual axle configuration maps.

---

## 2. PRIORITIZED UX BACKLOG (P0 to P3)

### P0 — CRITICAL FIELD USABILITY & SAFETY IMPROVEMENTS

| Item ID | Feature / Redesign Title | Target User | Description & Solution | User Impact | Complexity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TYR-UX-01** | **Interactive Visual Axle & Position Picker** | `TYRE_TECHNICIAN`, `TYRE_SUPERVISOR` | Replace manual text entry of position codes (`"AX1-L"`) with an interactive 2-axle / 3-axle / 4-axle truck graphic where clicking an axle position populates `positionCode`, `axle`, `side`, and `innerOuter`. | **HIGH** | **MEDIUM** |
| **TYR-UX-02** | **Combined Tread Inspection & Defect Auto-Trigger** | `TYRE_TECHNICIAN` | When entering tread measurements, if average tread is $\le 3.0\text{ mm}$ or sidewall/valve/rim condition is marked damaged, auto-expand a "Defect Log" section directly inside `modal-inspect-tyre` so the technician does not need to open a separate defect form. | **HIGH** | **LOW** |
| **TYR-UX-03** | **Field Mobile Touch Targets & High-Contrast Gauges** | `TYRE_TECHNICIAN` | Increase action button heights to $44\text{px}$ minimum on screens $\le 430\text{px}$. Add color-coded tread depth visual gauges ($>5\text{mm}$ GREEN, $3-5\text{mm}$ AMBER, $<3\text{mm}$ RED). | **HIGH** | **LOW** |

---

### P1 — MAJOR WORKFLOW SIMPLIFICATION

| Item ID | Feature / Redesign Title | Target User | Description & Solution | User Impact | Complexity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TYR-UX-04** | **Supervisor Action Center & Batch Verification** | `TYRE_SUPERVISOR` | Create a unified top "Action Required Header" on `dashboard-tyre-supervisor` showing total pending fitments and inspections. Provide a checkboxes table with a "Verify Selected Items" batch button. | **HIGH** | **MEDIUM** |
| **TYR-UX-05** | **Smart Filtered Dropdowns & Quick Search** | `TYRE_TECHNICIAN` | In `modal-fit-tyre`, filter the Tyre Select dropdown to show ONLY tyres with `currentStatus === 'IN_STOCK'`, sorted by recently registered. Include instant serial/brand stamp search input. | **MEDIUM** | **LOW** |
| **TYR-UX-06** | **Unified Technician Stream Workspace** | `TYRE_TECHNICIAN` | Replace the 5 horizontal sub-tabs in `dashboard-tyre-technician` with a streamlined 2-column view: Left Column = "Today's Work Queue & Due Inspections"; Right Column = Quick Floating Action Buttons ("+ Fit Tyre", "+ Inspect", "+ Defect"). | **HIGH** | **MEDIUM** |

---

### P2 — IMPORTANT UX & VISUAL ENHANCEMENTS

| Item ID | Feature / Redesign Title | Target User | Description & Solution | User Impact | Complexity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TYR-UX-07** | **Visual Tyre Lifecycle Timeline Component** | All Roles | In the Tyre Details modal (`openKPIDrillModal`), render an interactive horizontal timeline showing: `Purchased` $\rightarrow$ `In Stock` $\rightarrow$ `Fitted (Vehicle KB123)` $\rightarrow$ `Inspected (8.5mm)` $\rightarrow$ `Repaired` $\rightarrow$ `Retreaded` $\rightarrow$ `Scrapped`. | **MEDIUM** | **MEDIUM** |
| **TYR-UX-08** | **Executive Tyre TCO & Spend Summary Card** | `FINANCE_MANAGER`, `CEO` | Add a high-level "Tyre Total Cost of Ownership (TCO)" KPI summary card combining initial purchase cost, repair spend, retread cost, and total KM traveled. | **MEDIUM** | **LOW** |

---

### P3 — NICE-TO-HAVE ENHANCEMENTS

| Item ID | Feature / Redesign Title | Target User | Description & Solution | User Impact | Complexity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TYR-UX-09** | **Camera / Photo Evidence Capture Attachment** | `TYRE_TECHNICIAN` | Integrate client-side file upload for tread wear photos and damage evidence during inspection recording. | **LOW** | **MEDIUM** |
| **TYR-UX-10** | **Barcode / QR Code Scanner Input Helper** | `TYRE_TECHNICIAN` | Add camera QR/Barcode scanner button next to Tyre Serial input field for fast serial code scanning. | **LOW** | **HIGH** |
