require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const assert = require('assert');

async function main() {
  console.log('--- FI360 STEP 6D.1 SUBSCRIPTION FOUNDATION E2E TEST ---');

  // Setup test environment variables for resolver check
  const originalNodeEnv = process.env.NODE_ENV;
  const originalTestMode = process.env.TEST_MODE;
  process.env.TEST_MODE = 'false'; // Ensure production resolver is used by default

  const tenantIds = [];
  const subscriptionIds = [];

  try {
    console.log('[1] Setup: Fetching plans and versions...');
    const starterPlan = await prisma.plan.findFirst({ where: { planKey: 'STARTER' }, include: { versions: true } });
    const proPlan = await prisma.plan.findFirst({ where: { planKey: 'PROFESSIONAL' }, include: { versions: true } });
    const enterprisePlan = await prisma.plan.findFirst({ where: { planKey: 'ENTERPRISE' }, include: { versions: true } });

    assert(starterPlan && proPlan && enterprisePlan, 'Plans must exist. Ensure 6A migrations are present.');
    const starterVersionId = starterPlan.versions[0].id;
    const proVersionId = proPlan.versions[0].id;
    const enterpriseVersionId = enterprisePlan.versions[0].id;

    console.log('[2] Setup: Creating isolated test tenants...');
    const createTenant = async (code) => {
      const t = await prisma.tenant.create({ data: { code, name: `Test ${code}` } });
      tenantIds.push(t.id);
      return t.id;
    };

    const tStarter = await createTenant('TEST_SUB_STARTER');
    const tPro = await createTenant('TEST_SUB_PRO');
    const tEnterprise = await createTenant('TEST_SUB_ENT');
    const tSuspended = await createTenant('TEST_SUB_SUSP');
    const tExpired = await createTenant('TEST_SUB_EXP');
    const tCancelBefore = await createTenant('TEST_SUB_C_BEF');
    const tCancelAfter = await createTenant('TEST_SUB_C_AFT');
    const tUnknown = await createTenant('TEST_SUB_UNK');

    console.log('[3] Setup: Creating subscriptions...');
    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const tenDaysFuture = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

    const createSub = async (tenantId, planVersionId, status, start, end) => {
      const sub = await prisma.subscription.create({
        data: {
          tenantId,
          planVersionId,
          status,
          currentPeriodStart: start,
          currentPeriodEnd: end,
          startedAt: start,
          statusHistory: {
            create: {
              oldStatus: status,
              newStatus: status,
              reason: 'Test init',
              changedBy: 'SYSTEM_TEST',
            },
          },
        },
      });
      subscriptionIds.push(sub.id);
      return sub;
    };

    await createSub(tStarter, starterVersionId, 'TRIAL', tenDaysAgo, tenDaysFuture);
    await createSub(tPro, proVersionId, 'ACTIVE', tenDaysAgo, tenDaysFuture);
    await createSub(tEnterprise, enterpriseVersionId, 'ACTIVE', tenDaysAgo, tenDaysFuture);
    await createSub(tSuspended, proVersionId, 'SUSPENDED', tenDaysAgo, tenDaysFuture);
    await createSub(tExpired, proVersionId, 'EXPIRED', tenDaysAgo, tenDaysFuture);
    
    // Cancelled before end: effective period still valid
    await createSub(tCancelBefore, starterVersionId, 'CANCELLED', tenDaysAgo, tenDaysFuture);
    
    // Cancelled after end: effective period ended
    await createSub(tCancelAfter, starterVersionId, 'CANCELLED', new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), tenDaysAgo);

    console.log('[4] Testing Production Resolver logic directly (via NestJS app context mocking or service instantiation)...');
    
    // Instantiate resolvers directly for isolated testing
    const { SubscriptionResolverService } = require('../dist/src/subscription/subscription-resolver.service.js');
    const { SubscriptionService } = require('../dist/src/subscription/subscription.service.js');
    const { CoreEntitlementResolver } = require('../dist/src/entitlement/core-entitlement.resolver.js');
    const { DevelopmentEntitlementContextResolver } = require('../dist/src/entitlement/development-entitlement-resolver.js');
    
    const auditServiceMock = { logAction: async () => {} };
    const prismaServiceMock = prisma; // Reuse client
    
    const devResolver = new DevelopmentEntitlementContextResolver(prismaServiceMock);
    const subService = new SubscriptionService(prismaServiceMock, auditServiceMock);
    const prodResolver = new SubscriptionResolverService(subService);
    const coreResolver = new CoreEntitlementResolver(devResolver, prodResolver);

    const check = async (tenantId, expectedStatus, expectedPlanVersionId) => {
      const decision = await prodResolver.resolvePlanVersion(tenantId);
      assert.strictEqual(decision.status, expectedStatus, `Expected ${expectedStatus} for tenant ${tenantId}, got ${decision.status} (${decision.reason})`);
      if (expectedPlanVersionId) {
        assert.strictEqual(decision.planVersionId, expectedPlanVersionId, `PlanVersion mismatch for ${tenantId}`);
      }
    };

    console.log('    - Testing STARTER -> TRIAL resolution');
    await check(tStarter, 'VALID', starterVersionId);
    
    console.log('    - Testing PROFESSIONAL -> ACTIVE resolution');
    await check(tPro, 'VALID', proVersionId);
    
    console.log('    - Testing ENTERPRISE -> ACTIVE resolution');
    await check(tEnterprise, 'VALID', enterpriseVersionId);
    
    console.log('    - Testing SUSPENDED -> denied');
    await check(tSuspended, 'SUSPENDED');
    
    console.log('    - Testing EXPIRED -> denied');
    await check(tExpired, 'EXPIRED');
    
    console.log('    - Testing CANCELLED before end -> allowed');
    await check(tCancelBefore, 'VALID', starterVersionId);
    
    console.log('    - Testing CANCELLED after end -> denied');
    await check(tCancelAfter, 'EXPIRED');
    
    console.log('    - Testing Unknown tenant -> denied');
    await check(tUnknown, 'NO_SUBSCRIPTION');

    console.log('[5] Testing Core Resolver Strategy...');
    
    // Production Mode
    console.log('    - Production Mode uses SubscriptionResolverService');
    const prodResult = await coreResolver.resolvePlanVersion(tPro);
    assert.strictEqual(prodResult, proVersionId, 'Prod resolver failed to return planVersionId');

    // Test Mode
    process.env.TEST_MODE = 'true';
    console.log('    - Development resolver explicitly selected in test mode -> still works');
    const devResult = await coreResolver.resolvePlanVersion('TEST_TENANT_PROFESSIONAL');
    assert(devResult, 'Dev resolver failed to return planVersionId in TEST_MODE');
    
    console.log('[6] Verifying Status History & Audit (Mocked audit in tests, verified DB history)...');
    const starterSub = await prisma.subscription.findFirst({ where: { tenantId: tStarter } });
    const history = await prisma.subscriptionStatusHistory.findFirst({ where: { subscriptionId: starterSub.id } });
    assert(history, 'Status history record must exist');
    assert.strictEqual(history.newStatus, 'TRIAL');

    console.log('All E2E checks PASSED.');

  } catch (err) {
    console.error('Test failed:', err);
    process.exitCode = 1;
  } finally {
    console.log('[7] Cleanup...');
    await prisma.subscriptionStatusHistory.deleteMany({ where: { subscriptionId: { in: subscriptionIds } } });
    await prisma.subscription.deleteMany({ where: { id: { in: subscriptionIds } } });
    await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } });

    process.env.NODE_ENV = originalNodeEnv;
    process.env.TEST_MODE = originalTestMode;
    await prisma.$disconnect();
  }
}

main();
