import { UserRole } from '@prisma/client';
import { Permission, ScopeLevel, DashboardId } from './permissions.enum';

/**
 * FI360 Role Configuration Matrix
 *
 * Maps each platform role to:
 *  1. Default granular permissions
 *  2. Default data-scope level
 *  3. Landing dashboard ID
 *
 * Roles are *collections* of permissions. The guard checks permission
 * tokens, not role strings — so two different roles that share a
 * permission will both pass the same guard.
 */

export interface RoleConfig {
  permissions: Permission[];
  scopeLevel: ScopeLevel;
  dashboard: DashboardId;
  label: string;
  description: string;
}

export const ROLE_MATRIX: Record<UserRole, RoleConfig> = {

  // ────────────────────────────────────────────────────────────────
  // SUPER_ADMIN — Platform administration only
  // ────────────────────────────────────────────────────────────────
  [UserRole.SUPER_ADMIN]: {
    label: 'System Administrator',
    description: 'User management, system config, integrations, audit',
    scopeLevel: ScopeLevel.SYSTEM,
    dashboard: DashboardId.ADMIN_DASHBOARD,
    permissions: [
      Permission.USERS_READ,
      Permission.USERS_CREATE,
      Permission.USERS_UPDATE,
      Permission.USERS_DISABLE,
      Permission.AUDIT_READ,
      Permission.ADMIN_SYSTEM,
      Permission.VEHICLE_READ,       // read-only data view for config
      Permission.TYRE_READ,
      Permission.REPORTS_READ,
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // CEO — Executive Intelligence (read / drill-down / export)
  // ────────────────────────────────────────────────────────────────
  [UserRole.CEO]: {
    label: 'Chief Executive Officer',
    description: 'Executive intelligence, KPIs, drill-down, forecasts',
    scopeLevel: ScopeLevel.ORGANISATION,
    dashboard: DashboardId.EXECUTIVE_DASHBOARD,
    permissions: [
      Permission.VEHICLE_READ,
      Permission.TYRE_READ,
      Permission.WORKSHOP_READ,
      Permission.FUEL_READ,
      Permission.FINANCE_READ,
      Permission.BUDGET_READ,
      Permission.DRIVER_READ,
      Permission.REPORTS_READ,
      Permission.REPORTS_EXPORT,
      Permission.AUDIT_READ,
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // FLEET_MANAGER — Fleet Operations
  // ────────────────────────────────────────────────────────────────
  [UserRole.FLEET_MANAGER]: {
    label: 'Fleet Manager',
    description: 'Vehicle master, fleet ops, tyre/workshop/fuel intel',
    scopeLevel: ScopeLevel.REGION,
    dashboard: DashboardId.FLEET_OPS_DASHBOARD,
    permissions: [
      Permission.VEHICLE_READ,
      Permission.VEHICLE_CREATE,
      Permission.VEHICLE_UPDATE,
      Permission.VEHICLE_DELETE,
      Permission.TYRE_READ,
      Permission.TYRE_CREATE,
      Permission.TYRE_REGISTER,
      Permission.TYRE_UPDATE,
      Permission.TYRE_INSPECT,
      Permission.TYRE_REPLACE,
      Permission.TYRE_RETREAD,
      Permission.WORKSHOP_READ,
      Permission.WORKSHOP_CREATE,
      Permission.WORKSHOP_UPDATE,
      Permission.FUEL_READ,
      Permission.FINANCE_READ,
      Permission.BUDGET_READ,
      Permission.DRIVER_READ,
      Permission.DRIVER_DEFECT_CREATE,
      Permission.REPORTS_READ,
      Permission.REPORTS_EXPORT,
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // WORKSHOP_MANAGER — Placeholder role configuration (Hierarchy Tier 4)
  // Reserved for future operational management extension above Tyre Supervisor
  // ────────────────────────────────────────────────────────────────
  [UserRole.WORKSHOP_MANAGER]: {
    label: 'Workshop Manager',
    description: 'Workshop operations, maintenance schedules, technician oversight',
    scopeLevel: ScopeLevel.WORKSHOP,
    dashboard: DashboardId.FLEET_OPS_DASHBOARD,
    permissions: [
      Permission.VEHICLE_READ,
      Permission.WORKSHOP_READ,
      Permission.WORKSHOP_UPDATE,
      Permission.TYRE_READ,
      Permission.REPORTS_READ,
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // TYRE_SUPERVISOR — Operational Control Point for Tyres
  // Primary operational role for tyre lifecycle, stock & verification
  // ────────────────────────────────────────────────────────────────
  [UserRole.TYRE_SUPERVISOR]: {
    label: 'Tyre Supervisor',
    description: 'Day-to-day operational control, registration, movement tracking, inspections & verification',
    scopeLevel: ScopeLevel.WORKSHOP,
    dashboard: DashboardId.SUPERVISOR_DASHBOARD,
    permissions: [
      // Vehicle visibility
      Permission.VEHICLE_READ,
      Permission.WORKSHOP_READ,

      // Tyre Master & Lifecycle
      Permission.TYRE_READ,
      Permission.TYRE_CREATE,
      Permission.TYRE_UPDATE,
      Permission.TYRE_VERIFY,
      Permission.TYRE_REGISTER,
      Permission.TYRE_FIT,
      Permission.TYRE_REMOVE,
      Permission.TYRE_ROTATE,
      Permission.TYRE_REPAIR,
      Permission.TYRE_INSPECT,
      Permission.TYRE_REPLACE_REQUEST,
      Permission.TYRE_RETREAD,
      Permission.TYRE_DISPOSE,

      // Tyre Inventory
      Permission.TYRE_STOCK_READ,
      Permission.TYRE_STOCK_RECEIVE,
      Permission.TYRE_STOCK_ISSUE,
      Permission.TYRE_STOCK_TRANSFER,
      Permission.TYRE_STOCK_RECONCILE,

      // Tyre Operations & Jobs
      Permission.TYRE_JOB_CREATE,
      Permission.TYRE_JOB_ASSIGN,
      Permission.TYRE_JOB_APPROVE,
      Permission.TYRE_JOB_REJECT,
      Permission.TYRE_JOB_COMPLETE,

      // Tyre Defects
      Permission.TYRE_DEFECT_READ,
      Permission.TYRE_DEFECT_CREATE,
      Permission.TYRE_DEFECT_ASSIGN,
      Permission.TYRE_DEFECT_ESCALATE,
      Permission.TYRE_DEFECT_CLOSE,

      // Tyre Analytics & Reports
      Permission.TYRE_KPI_READ,
      Permission.TYRE_REPORT_READ,
      Permission.TYRE_REPORT_EXPORT,
      Permission.TYRE_FAILURE_INVESTIGATE,
      Permission.TYRE_ANALYTICS_READ,
      Permission.TYRE_AUDIT_READ,
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // TYRE_TECHNICIAN — Tyre workshop focused
  // ────────────────────────────────────────────────────────────────
  [UserRole.TYRE_TECHNICIAN]: {
    label: 'Tyre Technician',
    description: 'Inspections, fitment, retread/repair, tyre alerts',
    scopeLevel: ScopeLevel.WORKSHOP,
    dashboard: DashboardId.TECHNICIAN_DASHBOARD,
    permissions: [
      Permission.VEHICLE_READ,
      Permission.TYRE_READ,
      Permission.TYRE_INSPECT,
      Permission.TYRE_CREATE,
      Permission.TYRE_UPDATE,
      Permission.TYRE_REPLACE,
      Permission.TYRE_RETREAD,
      Permission.TYRE_FIT,
      Permission.TYRE_REMOVE,
      Permission.TYRE_ROTATE,
      Permission.TYRE_REPAIR,
      Permission.DRIVER_DEFECT_CREATE,
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // FINANCE_MANAGER — Financial Intelligence
  // ────────────────────────────────────────────────────────────────
  [UserRole.FINANCE_MANAGER]: {
    label: 'Finance Manager',
    description: 'Expenditure, budgets, cost/KM, forecasts, suppliers',
    scopeLevel: ScopeLevel.ORGANISATION,
    dashboard: DashboardId.FINANCE_DASHBOARD,
    permissions: [
      Permission.FINANCE_READ,
      Permission.FINANCE_CREATE,
      Permission.FINANCE_UPDATE,
      Permission.BUDGET_READ,
      Permission.BUDGET_CREATE,
      Permission.BUDGET_UPDATE,
      Permission.VEHICLE_READ,
      Permission.TYRE_READ,
      Permission.FUEL_READ,
      Permission.WORKSHOP_READ,
      Permission.REPORTS_READ,
      Permission.REPORTS_EXPORT,
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // DRIVER — Personal vehicle & defect reporting
  // ────────────────────────────────────────────────────────────────
  [UserRole.DRIVER]: {
    label: 'Driver',
    description: 'My vehicle, tyre condition, defect reporting',
    scopeLevel: ScopeLevel.VEHICLE,
    dashboard: DashboardId.DRIVER_DASHBOARD,
    permissions: [
      Permission.VEHICLE_READ,
      Permission.TYRE_READ,
      Permission.DRIVER_DEFECT_CREATE,
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // AUDITOR — Compliance & audit trail (broad read-only)
  // ────────────────────────────────────────────────────────────────
  [UserRole.AUDITOR]: {
    label: 'Auditor',
    description: 'Audit logs, user activity, compliance, historical data',
    scopeLevel: ScopeLevel.ORGANISATION,
    dashboard: DashboardId.AUDITOR_DASHBOARD,
    permissions: [
      Permission.AUDIT_READ,
      Permission.USERS_READ,
      Permission.VEHICLE_READ,
      Permission.TYRE_READ,
      Permission.FINANCE_READ,
      Permission.BUDGET_READ,
      Permission.REPORTS_READ,
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // READ_ONLY — Kept for backward compat; minimal read access
  // ────────────────────────────────────────────────────────────────
  [UserRole.READ_ONLY]: {
    label: 'Read Only',
    description: 'Minimal read-only access',
    scopeLevel: ScopeLevel.ORGANISATION,
    dashboard: DashboardId.AUDITOR_DASHBOARD,
    permissions: [
      Permission.VEHICLE_READ,
      Permission.TYRE_READ,
      Permission.REPORTS_READ,
    ],
  },
};

/**
 * Helper: resolve the permission set for a given role.
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_MATRIX[role]?.permissions ?? [];
}

/**
 * Helper: resolve the data-scope level for a given role.
 */
export function getScopeLevelForRole(role: UserRole): ScopeLevel {
  return ROLE_MATRIX[role]?.scopeLevel ?? ScopeLevel.VEHICLE;
}

/**
 * Helper: resolve the landing dashboard ID for a given role.
 */
export function getDashboardForRole(role: UserRole): DashboardId {
  return ROLE_MATRIX[role]?.dashboard ?? DashboardId.DRIVER_DASHBOARD;
}
