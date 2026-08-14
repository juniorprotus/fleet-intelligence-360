/**
 * FI360 Granular Permission Constants
 *
 * These tokens represent atomic actions within the platform.
 * Roles are collections of permissions — controllers check
 * permission tokens, NOT role strings.
 */
export enum Permission {
  // ── Vehicle ──────────────────────────────────
  VEHICLE_READ             = 'vehicle.read',
  VEHICLE_CREATE           = 'vehicle.create',
  VEHICLE_UPDATE           = 'vehicle.update',
  VEHICLE_DELETE           = 'vehicle.delete',

  // ── Tyre Master & Basic Actions ───────────────
  TYRE_READ                = 'tyre.read',
  TYRE_INSPECT             = 'tyre.inspect',
  TYRE_CREATE              = 'tyre.create',
  TYRE_UPDATE              = 'tyre.update',
  TYRE_REPLACE             = 'tyre.replace',
  TYRE_RETREAD             = 'tyre.retread',
  TYRE_VERIFY              = 'tyre.verify',

  // ── Tyre Lifecycle Workflows ─────────────────
  TYRE_REGISTER            = 'tyre.register',
  TYRE_FIT                 = 'tyre.fit',
  TYRE_REMOVE              = 'tyre.remove',
  TYRE_ROTATE              = 'tyre.rotate',
  TYRE_REPAIR              = 'tyre.repair',
  TYRE_REPLACE_REQUEST     = 'tyre.replace.request',
  TYRE_DISPOSE             = 'tyre.dispose',

  // ── Tyre Inventory Management ────────────────
  TYRE_STOCK_READ          = 'tyre.stock.read',
  TYRE_STOCK_RECEIVE       = 'tyre.stock.receive',
  TYRE_STOCK_ISSUE         = 'tyre.stock.issue',
  TYRE_STOCK_TRANSFER      = 'tyre.stock.transfer',
  TYRE_STOCK_RECONCILE     = 'tyre.stock.reconcile',

  // ── Tyre Operations & Job Orders ─────────────
  TYRE_JOB_CREATE          = 'tyre.job.create',
  TYRE_JOB_ASSIGN          = 'tyre.job.assign',
  TYRE_JOB_APPROVE         = 'tyre.job.approve',
  TYRE_JOB_REJECT          = 'tyre.job.reject',
  TYRE_JOB_COMPLETE        = 'tyre.job.complete',

  // ── Tyre Defect Management ───────────────────
  TYRE_DEFECT_READ         = 'tyre.defect.read',
  TYRE_DEFECT_CREATE       = 'tyre.defect.create',
  TYRE_DEFECT_ASSIGN       = 'tyre.defect.assign',
  TYRE_DEFECT_ESCALATE     = 'tyre.defect.escalate',
  TYRE_DEFECT_CLOSE        = 'tyre.defect.close',

  // ── Tyre Intelligence & Analytics ────────────
  TYRE_KPI_READ            = 'tyre.kpi.read',
  TYRE_REPORT_READ         = 'tyre.report.read',
  TYRE_REPORT_EXPORT       = 'tyre.report.export',
  TYRE_FAILURE_INVESTIGATE = 'tyre.failure.investigate',
  TYRE_ANALYTICS_READ      = 'tyre.analytics.read',
  TYRE_AUDIT_READ          = 'tyre.audit.read',

  // ── Workshop ─────────────────────────────────
  WORKSHOP_READ            = 'workshop.read',
  WORKSHOP_CREATE          = 'workshop.create',
  WORKSHOP_UPDATE          = 'workshop.update',
  WORKSHOP_DELETE          = 'workshop.delete',

  // ── Inventory ────────────────────────────────
  INVENTORY_READ           = 'inventory.read',
  INVENTORY_CREATE         = 'inventory.create',
  INVENTORY_UPDATE         = 'inventory.update',
  INVENTORY_DELETE         = 'inventory.delete',

  // ── Procurement ──────────────────────────────
  PROCUREMENT_READ         = 'procurement.read',
  PROCUREMENT_CREATE       = 'procurement.create',
  PROCUREMENT_UPDATE       = 'procurement.update',
  PROCUREMENT_DELETE       = 'procurement.delete',

  // ── Fuel ─────────────────────────────────────
  FUEL_READ                = 'fuel.read',
  FUEL_CREATE              = 'fuel.create',
  FUEL_UPDATE              = 'fuel.update',

  // ── Finance ──────────────────────────────────
  FINANCE_READ             = 'finance.read',
  FINANCE_CREATE           = 'finance.create',
  FINANCE_UPDATE           = 'finance.update',

  // ── Budget ───────────────────────────────────
  BUDGET_READ              = 'budget.read',
  BUDGET_CREATE            = 'budget.create',
  BUDGET_UPDATE            = 'budget.update',

  // ── Driver & Safety ──────────────────────────
  DRIVER_READ              = 'driver.read',
  DRIVER_DEFECT_CREATE     = 'driver.defect.create',
  DRIVER_INSPECTION_CREATE = 'driver.inspection.create',
  DRIVER_INSPECTION_VIEW_OWN = 'driver.inspection.view_own',
  DRIVER_SAFETY_VIEW_OWN   = 'driver.safety.view_own',
  SAFETY_READ              = 'safety.read',
  SAFETY_CREATE            = 'safety.create',

  // ── Reports ──────────────────────────────────
  REPORTS_READ             = 'reports.read',
  REPORTS_EXPORT           = 'reports.export',

  // ── Users ────────────────────────────────────
  USERS_READ               = 'users.read',
  USERS_CREATE             = 'users.create',
  USERS_UPDATE             = 'users.update',
  USERS_DISABLE            = 'users.disable',

  // ── Audit ────────────────────────────────────
  AUDIT_READ               = 'audit.read',

  // ── Administration & Governance ──────────────
  ADMIN_SYSTEM             = 'admin.system',
  SYSTEM_READ              = 'system.read',
  SYSTEM_CONFIGURE         = 'system.configure',
  SYSTEM_HEALTH_READ       = 'system.health.read',
  SYSTEM_SETTINGS_MANAGE   = 'system.settings.manage',
  DATA_CORRECTION_CREATE   = 'data.correction.create',
  DATA_CORRECTION_EXECUTE  = 'data.correction.execute',
  DATA_CORRECTION_HISTORY_VIEW = 'data.correction.history_view',

  USER_ACTIVATE            = 'user.activate',
  USER_DEACTIVATE          = 'user.deactivate',
  USER_RESET               = 'user.reset',
  USER_ASSIGN_ROLE         = 'user.assign.role',
  USER_ASSIGN_SCOPE        = 'user.assign.scope',

  ROLE_READ                = 'role.read',
  ROLE_CREATE              = 'role.create',
  ROLE_UPDATE              = 'role.update',
  ROLE_PERMISSION_READ     = 'role.permission.read',
  ROLE_PERMISSION_ASSIGN   = 'role.permission.assign',
  PERMISSION_READ          = 'permission.read',

  ORGANIZATION_READ        = 'organization.read',
  ORGANIZATION_CREATE      = 'organization.create',
  ORGANIZATION_UPDATE      = 'organization.update',
  REGION_MANAGE            = 'region.manage',
  DEPOT_MANAGE             = 'depot.manage',
  WORKSHOP_MANAGE          = 'workshop.manage',

  MASTERDATA_READ          = 'masterdata.read',
  MASTERDATA_CONFIGURE     = 'masterdata.configure',
  VEHICLE_MASTER_CONFIGURE = 'vehicle.master.configure',
  TYRE_MASTER_CONFIGURE    = 'tyre.master.configure',

  INTEGRATION_READ         = 'integration.read',
  INTEGRATION_CONFIGURE    = 'integration.configure',
  INTEGRATION_TEST         = 'integration.test',
  INTEGRATION_HEALTH_READ  = 'integration.health.read',

  AUDIT_EXPORT             = 'audit.export',
  AUDIT_SEARCH             = 'audit.search',

  REPORT_TEMPLATE_READ     = 'report.template.read',
  REPORT_TEMPLATE_CREATE   = 'report.template.create',
  REPORT_TEMPLATE_UPDATE   = 'report.template.update',
  REPORT_TEMPLATE_ENABLE   = 'report.template.enable',
  REPORT_TEMPLATE_DISABLE  = 'report.template.disable',
  REPORT_SCHEDULE_MANAGE   = 'report.schedule.manage',
  REPORT_CONFIGURATION_MANAGE = 'report.configuration.manage',

  DATAQUALITY_READ         = 'dataquality.read',
  DATAQUALITY_MANAGE       = 'dataquality.manage',
  DUPLICATE_REVIEW         = 'duplicate.review',
  DATA_RECONCILIATION      = 'data.reconciliation',

  AI_HEALTH_READ           = 'ai.health.read',
  AI_CONFIGURATION_READ    = 'ai.configuration.read',
  AI_CONFIGURATION_MANAGE  = 'ai.configuration.manage',
  AI_MODEL_READ            = 'ai.model.read',
  AI_AUDIT_READ            = 'ai.audit.read',
}

/**
 * Data scope levels define how broadly a user sees data in the
 * Org → Region → Depot → Workshop → Vehicle hierarchy.
 */
export enum ScopeLevel {
  SYSTEM       = 'SYSTEM',        // Platform admin — no data scope filter
  ORGANISATION = 'ORGANISATION',  // Sees everything in the organisation
  REGION       = 'REGION',        // Filtered to their assigned region
  DEPOT        = 'DEPOT',         // Filtered to their assigned depot
  WORKSHOP     = 'WORKSHOP',      // Filtered to their assigned workshop
  VEHICLE      = 'VEHICLE',       // Filtered to their assigned vehicle(s)
}

/**
 * Dashboard identifiers. Each role maps to exactly one landing
 * dashboard — this is NOT just menu-visibility toggling.
 */
export enum DashboardId {
  ADMIN_DASHBOARD       = 'dashboard-super-admin',
  EXECUTIVE_DASHBOARD   = 'dashboard-ceo',
  FLEET_OPS_DASHBOARD   = 'dashboard-fleet-manager',
  SUPERVISOR_DASHBOARD  = 'dashboard-tyre-supervisor',
  TECHNICIAN_DASHBOARD  = 'dashboard-technician',
  FINANCE_DASHBOARD     = 'dashboard-finance',
  DRIVER_DASHBOARD      = 'dashboard-driver',
  AUDITOR_DASHBOARD     = 'dashboard-auditor',
}
