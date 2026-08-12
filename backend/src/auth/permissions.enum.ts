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

  // ── Driver ───────────────────────────────────
  DRIVER_READ              = 'driver.read',
  DRIVER_DEFECT_CREATE     = 'driver.defect.create',

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

  // ── Administration ───────────────────────────
  ADMIN_SYSTEM             = 'admin.system',
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
