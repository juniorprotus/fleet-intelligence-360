# FI360 Tyre Intelligence Domain Integration Contracts

This specification defines the future cross-domain integration contracts between the **Tyre Intelligence Bounded Domain** and upcoming FI360 business modules.

---

## 1. Fleet & Asset Master Domain
- **Purpose**: Authoritative ownership of `Vehicle` master data.
- **Data Consumed by Tyre**: `vehicle_id`, `registration_number`, `fleet_number`, `vehicle_class`, `current_odometer`.
- **Data Produced by Tyre**: `expected_tyres`, active fitted tyre list, aggregate tyre health score %.
- **Integration Mechanism**: Direct Prisma foreign key relation (`tyre_fitments.vehicle_id -> vehicles.id`).
- **Domain Event Handled**: `vehicle.created`, `vehicle.updated`, `vehicle.decommissioned`.

---

## 2. Workshop Intelligence Domain
- **Purpose**: Workshop job card management, technician scheduling, and maintenance throughput.
- **Data Consumed by Tyre**: `workshop_id`, `workshop_code`, `manager_id`, technician work shifts.
- **Data Produced by Tyre**: Pending inspection queue, pending fitment queue, unverified job cards.
- **Integration Mechanism**: Asynchronous Domain Events (`tyre.fitted`, `tyre.inspected`) & REST API `/api/v1/tyres/supervisor-work-queue`.

---

## 3. Parts & Inventory Domain
- **Purpose**: Spare parts inventory, tyre casing stock, and warehouse management.
- **Data Consumed by Tyre**: In-stock tyre inventory counts (`IN_STOCK`), warehouse location IDs.
- **Data Produced by Tyre**: Stock issues (`tyre.fitted`), stock returns (`tyre.removed`), scrap dispatches (`tyre.scrapped`).
- **Integration Mechanism**: Event publication (`tyre.fitted`, `tyre.scrapped`).

---

## 4. Procurement & Approvals Domain
- **Purpose**: Purchase order generation, supplier spend tracking, and scrap replacement approvals.
- **Data Consumed by Tyre**: `supplier_id`, purchase order numbers, purchase costs.
- **Data Produced by Tyre**: Purchase requisitions for replacement tyres, retread dispatches.
- **Integration Mechanism**: Shared `ApprovalWorkflowService` & Event publication (`tyre.scrapped`).

---

## 5. Vehicle Downtime & Availability Domain
- **Purpose**: Tracking fleet availability, vehicle grounding, and MTBF reliability.
- **Data Consumed by Tyre**: Active operational shift status.
- **Data Produced by Tyre**: Critical tyre safety alerts (Risk Score $\ge 90$), unserviceable vehicle flags.
- **Integration Mechanism**: Exception routing via `TyreAlert` (Severity: `CRITICAL`).

---

## 6. Telematics & TPMS Domain
- **Purpose**: Real-time IoT telematics ingestion for odometer mileage and pressure/temperature streams.
- **Data Consumed by Tyre**: Live odometer readings, TPMS sensor pressure readings.
- **Data Produced by Tyre**: Recommended pressure thresholds, target inspection dates.
- **Integration Mechanism**: Asynchronous Telematics Stream Subscriber.

---

## 7. AI & Executive Intelligence Domain
- **Purpose**: Strategic fleet intelligence, executive dashboards, and predictive maintenance.
- **Data Consumed by Tyre**: Strategic fleet availability targets, executive budget allocations.
- **Data Produced by Tyre**: Governed KPIs (`FLEET_TYRE_HEALTH`, `WEEKLY_TYRE_INSPECTION_COMPLIANCE`, `TYRE_COST_PER_KM`, `RETREAD_RATIO`).
- **Integration Mechanism**: `KpiGovernanceService` 22-field contract & `UniversalReportService` Level 3 Executive Summary.
