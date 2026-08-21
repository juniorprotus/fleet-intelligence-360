# FI360-AI-AGENT-GUIDE
# MASTER AI AGENT OPERATING GUIDE

## 1. WHAT IS FI360?
FI360 (Fleet Intelligence 360) is a multi-tenant, enterprise-grade fleet and tyre management platform. It is designed with an Africa-first approach, acknowledging realities like varying bandwidth, local currencies, and payment mechanisms (e.g., M-Pesa). The platform is built around a "Standalone-But-Connectable" modular architecture, meaning each business module (like Tyre Intelligence, Vehicle Finance, Safety) operates independently but connects via strict contracts.

The overarching goal is to provide a seamless, secure, and commercially aware platform that tracks the complete lifecycle of fleet assets, budgets, limits, and subscriptions.

## 2. REPOSITORY STRUCTURE & TECHNOLOGIES
The repository is a monorepo consisting of:
- **`backend/`**: A NestJS (TypeScript) server using Prisma ORM against a PostgreSQL database. It features strict separation of domains (e.g., `audit`, `auth`, `payment`, `subscription`, `product-catalog`, `entitlement`, `tyre`, `vehicle`). Testing is done via Jest (unit) and standalone Node.js E2E scripts (`scratch/`).
- **`frontend/`**: The frontend architecture relies on Vanilla JS/HTML/CSS without heavy frameworks, prioritizing low-bandwidth efficiency and ease-of-use.
- **`docs/`**: Contains architectural markdown files (e.g., `fi360-modular-architecture.md`).
- **PDFs**: Authoritative architecture and contract specifications exist in the root (e.g., `FI360_Master_Architecture...pdf`, `FI360_Tyre_API...pdf`).

**Key Technologies:** NestJS, TypeScript, Prisma, PostgreSQL, Jest.

## 3. BACKEND MODULE MAP
- **PLATFORM**:
  - `auth`: Handles JWT strategy, Role-Based Access Control (RBAC), and Guards.
  - `audit`: Immutable transaction-bound logging (`AuditService`).
  - `events`: Domain event publication (`EventPublisherService`).
  - `crypto`: Encryption/Decryption (`CryptoService`).
- **COMMERCIAL**:
  - `product-catalog`: Plans, PlanVersions, Features, Pricing.
  - `entitlement`: Determines if a tenant has paid for a feature (`CoreEntitlementResolver`).
  - `usage`: Quantitative limit tracking and enforcement (`LimitEnforcementService`).
  - `subscription`: Lifecycle of commercial tenant agreements.
  - `payment`: Core payment abstraction, agnostic of specific providers (`PaymentService`, `IPaymentProvider`).
- **DOMAIN**:
  - `tyre`: Core module for tyre lifecycles, inspections, movements, and alerts.
  - `vehicle`: Vehicle Master data, the anchor for all fleet assets.
  - `workshop`: Physical locations, assignments, work orders.
  - `driver`, `inventory`, `procurement`, `safety`, `reporting`.

## 4. DATABASE & MULTI-TENANCY
The database (`prisma/schema.prisma`) implements a strict hierarchical model:
`Tenant` -> `Organization` -> `LegalEntity`

**Multi-Tenancy Rule**: The `tenantId` is the absolute security boundary.
- **CLIENT DATA MUST NEVER OVERRIDE SERVER TENANT CONTEXT.**
- `req.user.tenantId` is the sole source of truth for all database queries and mutations.

## 5. AUTHENTICATION, RBAC, DATASCOPE, AND ENTITLEMENTS
Do not confuse these layers. They evaluate sequentially:
1. **Authentication (Who are you?)**: Validates JWT, extracts `tenantId`, `organizationId`, and `role`.
2. **RBAC (What can your role do?)**: Evaluates the `PermissionMatrix` to ensure the user has the required action rights (e.g., `SUPER_ADMIN`, `FLEET_MANAGER`, `DRIVER`).
3. **Entitlement (Has the tenant paid for this?)**: Evaluates if the `Tenant`'s active `Subscription` grants access to the requested `FeatureDefinition`.
4. **DataScope (Which records can you see?)**: Filters the query based on the user's organizational boundary (`REGION`, `WORKSHOP`, `DEPOT`).

## 6. QUANTITATIVE LIMITS
Managed by `LimitEnforcementService`.
- Checks if a tenant has exceeded their allowed capacity (e.g., `MAX_VEHICLES`).
- States: `NOT_CONFIGURED`, `UNLIMITED`, or numeric limits.
- If limits are reached, creation requests fail closed with a `403 LIMIT_REACHED` error without publishing side-effect events.

## 7. SUBSCRIPTIONS & PAYMENT CORE
- **Subscriptions**: Bound to tenants, managed through states (`TRIAL`, `ACTIVE`, `PAST_DUE`, `SUSPENDED`, `CANCELLED`, `EXPIRED`).
- **Payment Core (6E.1)**: A provider-agnostic infrastructure. It manages `PaymentTransaction`, `PaymentAttempt` (enforcing strict tenant-scoped `idempotencyKey`), and `PaymentStatusHistory`.
- **CRITICAL NOTE**: Payment Core (6E.1) is NOT M-Pesa. M-Pesa will be built as an adapter (6E.2) plugging into `IPaymentProvider`.

## 8. SECURITY & TEST BOUNDARIES
- **Development / Test Mode**:
  - `TEST_MODE=true` environment variable replaces the production entitlement engine with a `DevelopmentEntitlementContextResolver` allowing local testing of commercial boundaries.
  - **Rule**: NEVER bypass security in production.
- **Port Management**:
  - Standard E2E HTTP regressions use port `3000`.
  - Subscription/Commercial E2E tests often boot their own isolated server on port `3001`.
  - Always clean up and terminate owned processes.

## 9. MIGRATION RULES
- **Additive Migrations Only**: Prefer creating new migration files (`npx prisma migrate dev --create-only`).
- **Never Modify History**: Do not alter applied migrations.
- **No Destructive Commands**: NEVER use `prisma migrate reset` or `prisma db push` to resolve drift. Use idempotent SQL.

## 10. AI CODE CHANGE RULES (SURGICAL PROTOCOL)
If you are instructed to modify this repository:
1. **Make the smallest possible change**.
2. **Inspect first**: Never blindly overwrite files.
3. **Preserve unrelated behavior**: Do not refactor code outside the immediate scope.
4. **Reuse**: Rely on existing `AuditService`, `EventPublisherService`, `DataScope`, etc. Do NOT build parallel infrastructure.
5. **Protect 6A-6D**: Treat Catalog, Entitlement, Usage, Subscription, Payment, RBAC, and DataScope as highly protected. If a change forces you to alter them, STOP and report.
6. **No Silent Drift**: If documented architecture differs from code, DO NOT silently rewrite the code. Code is runtime truth; docs are intended truth. Report the conflict and stop.

## 11. TESTING & CERTIFICATION
When certifying a task:
- Never report `PASS` unless the script actually ran successfully.
- Run targeted Jest unit tests (`npm test -- path/to/file.spec.ts`).
- Run relevant E2E scripts from `scratch/`.
- Ensure the backend compiles (`npx nest build`).
- Verify `git diff` to ensure no `.env` or historical migrations leaked.

## 12. CURRENT ROADMAP STATUS (As verified by AI Agent)
- [PASS] 6A Product Catalog
- [PASS] 6B Entitlement
- [PASS] 6C Quantitative Limits
- [PASS] 6D Subscription
- [PASS] 6E.0 Payment Discovery
- [PASS] 6E.1 Payment Core
- [PENDING] 6E.2 M-Pesa Adapter
- [PENDING] 6E.3 Billing
- [PENDING] 6E.4 Ledger
- [PENDING] 6E.5 Reconciliation

## 13. HOW AN AI AGENT SHOULD START A NEW TASK
1. Read this guide (`FI360-AI-AGENT-GUIDE.md`).
2. Run `git status` to verify repository cleanliness.
3. Check the current roadmap above.
4. Read specific architecture documents related to the requested domain.
5. Inspect the current `schema.prisma` and implementation.
6. Define a targeted Change Budget and seek approval if touching protected domains.
7. Execute surgically, test, and provide a Final Report.
