# FI360 Phase 5A — Controlled Data Correction Governance Specification

**Document ID**: `FI360-PHASE5A-DATA-CORRECTION-GOVERNANCE-v1.0`  
**Date**: August 14, 2026  
**Status**: APPROVED SPECIFICATION  
**Scope**: Append-Only Historical Data Correction Architecture for System Administration

---

## 1. Governance Principles

1. **Non-Destructive Correction**: Historical operational records (`TripInspection`, `TyreInspection`, `TyreFitment`, `InventoryMovement`, `WorkOrder`) must never be silently overwritten, deleted, or removed.
2. **Append-Only Correction Ledger**: All historical data corrections are recorded in the `data_corrections` table (`DataCorrection` model).
3. **Sole Role Authorization**: Only users possessing `Role.SUPER_ADMIN` and permission `Permission.DATA_CORRECTION_EXECUTE` are authorized to execute historical data corrections.
4. **Mandatory Correction Reason**: Every correction transaction requires an explicit, non-empty business justification reason string.
5. **Original & Corrected Value Preservation**: Both original and corrected state representations are stored as JSON/text payloads alongside user identity, timestamp, and audit correlation IDs.

---

## 2. Data Correction Model Schema (`DataCorrection`)

```prisma
/// Controlled Append-Only Data Correction Governance Ledger
model DataCorrection {
  id               String   @id @default(uuid()) @map("correction_id")
  tenantId         String   @default("TNT-DEFAULT") @map("tenant_id")
  organizationId   String   @default("ORG-DEFAULT") @map("organization_id")
  domain           String   // e.g., 'TYRE', 'INVENTORY', 'WORKSHOP', 'SAFETY', 'VEHICLE'
  entityType       String   @map("entity_type") // e.g., 'TripInspection', 'TyreInspection', 'InventoryStock'
  entityId         String   @map("entity_id")
  fieldName        String   @map("field_name")
  originalValue    String   @map("original_value") // Stored as String/JSON
  correctedValue   String   @map("corrected_value") // Stored as String/JSON
  reason           String   // Mandatory business justification
  correctedById    Int      @map("corrected_by_id")
  correctedByEmail String   @map("corrected_by_email")
  createdAt        DateTime @default(now()) @map("created_at")
  correlationId    String?  @map("correlation_id")
  auditLogId       String?  @map("audit_log_id")

  @@map("data_corrections")
  @@index([tenantId, organizationId])
  @@index([domain, entityType, entityId])
  @@index([correctedById])
}
```

---

## 3. End-to-End Correction Workflow

```
                                  System Administrator
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │  Select Historical Record & Field to Correct │
                    └──────────────────────┬───────────────────────┘
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │  Input Corrected Value & Mandatory Reason    │
                    └──────────────────────┬───────────────────────┘
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │ POST /api/v1/system-admin/corrections        │
                    └──────────────────────┬───────────────────────┘
                                           │
                    ┌──────────────────────┴───────────────────────┐
                    │ Is Authenticated User SUPER_ADMIN?           │
                    └──────────┬───────────────────────┬───────────┘
                               │ YES                   │ NO
                               ▼                       ▼
                    ┌──────────────────┐    ┌──────────────────────────┐
                    │ Fetch Original   │    │ Deny HTTP 403 Forbidden  │
                    │ Record State     │    │ Log Security Audit Event │
                    └──────────┬───────┘    └──────────────────────────┘
                               │
                               ▼
                    ┌──────────────────────────────────────────────┐
                    │ Create Append-Only DataCorrection Record     │
                    │ Update Target Field in Operational Record    │
                    │ Publish Event 'data.corrected'               │
                    │ Log Central AuditLog Entry                   │
                    └──────────────────────────────────────────────┘
```

---

## 4. Security & Audit Trail Integrity

- **Unauthorized Attempt**: Any non-Super Admin role attempting to call `POST /api/v1/system-admin/corrections` is immediately denied with `HTTP 403 Forbidden` and audited under `action = 'SECURITY_DATA_CORRECTION_DENIED'`.
- **Immutable Audit Entry**: Every successful correction writes a record to `audit_logs` containing `action = 'DATA_CORRECTION_EXECUTED'`, `actor = adminEmail`, and `details = { correctionId, domain, entityType, entityId, originalValue, correctedValue, reason }`.
- **KPI Governance Impact**: If a corrected field affects a governed KPI (e.g. tread depth measurement), `KpiGovernanceService.evaluateKpi(...)` automatically recalculates headline values from the updated database record during the next evaluation cycle.
