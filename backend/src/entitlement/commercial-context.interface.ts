/**
 * CommercialContext — Runtime DTO describing the resolved commercial state for a tenant.
 *
 * This is a pure domain interface. It must NOT contain HTTP transport semantics.
 * Guards and controllers translate this into HTTP responses (403, etc.).
 *
 * Lifecycle states:
 *  VALID          — subscription is active and within the current period
 *  NO_SUBSCRIPTION — tenant has no subscription record
 *  SUSPENDED      — subscription exists but is administratively suspended
 *  EXPIRED        — subscription period has ended or record is in EXPIRED state
 *  NOT_CONFIGURED — resolver could not determine context (missing tenantId, config error)
 */
export interface CommercialContext {
  /**
   * The authoritative commercial decision for the tenant.
   */
  status:
    | 'VALID'
    | 'NO_SUBSCRIPTION'
    | 'SUSPENDED'
    | 'EXPIRED'
    | 'NOT_CONFIGURED';

  /**
   * Machine-readable code for the specific condition within the status.
   * Maps 1:1 to error codes surfaced to API consumers.
   */
  code:
    | 'VALID'
    | 'NO_SUBSCRIPTION'
    | 'SUSPENDED'
    | 'EXPIRED'
    | 'NO_ENTITLEMENT_CONTEXT';

  /**
   * The effective PlanVersion ID. Present only when status === 'VALID'.
   */
  planVersionId?: string;

  /**
   * The underlying subscription ID. Present when a subscription was found.
   */
  subscriptionId?: string;

  /**
   * The subscription lifecycle status as persisted in the DB.
   */
  subscriptionStatus?: string;

  /**
   * The Plan ID (from the PlanVersion's parent Plan).
   */
  planId?: string;

  /**
   * The Plan key (e.g., 'STARTER', 'PROFESSIONAL', 'ENTERPRISE').
   */
  planKey?: string;

  /**
   * The effective commercial period start.
   */
  currentPeriodStart?: Date;

  /**
   * The effective commercial period end.
   */
  currentPeriodEnd?: Date;

  /**
   * Human-readable reason for denials or informational context.
   */
  reason?: string;
}
