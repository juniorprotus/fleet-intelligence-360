require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const assert = require('assert');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fi360-jwt-secret-key-change-in-production-2025';

function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

async function apiGet(port, path, token) {
  const res = await fetch(`http://localhost:${port}${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    // ignore
  }
  return { status: res.status, data };
}

async function apiPost(port, path, body, token) {
  const res = await fetch(`http://localhost:${port}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    // ignore
  }
  return { status: res.status, data };
}

async function main() {
  console.log('============================================================');
  console.log('STEP 6D.2 — COMMERCIAL CONTEXT HTTP/RUNTIME E2E TESTS');
  console.log('============================================================\n');

  const tenantIds = [];
  const subscriptionIds = [];
  const vehicleIds = [];

  // Setup database records
  console.log('[1] Setup: Fetching plans and versions...');
  const starterPlan = await prisma.plan.findFirst({ where: { planKey: 'STARTER' }, include: { versions: true } });
  const enterprisePlan = await prisma.plan.findFirst({ where: { planKey: 'ENTERPRISE' }, include: { versions: true } });

  assert(starterPlan && enterprisePlan, 'Plans must exist.');
  const starterVersionId = starterPlan.versions[0].id;
  const enterpriseVersionId = enterprisePlan.versions[0].id;

  console.log('[2] Setup: Creating isolated test tenants...');
  const createTenant = async (code) => {
    const t = await prisma.tenant.create({ data: { code, name: `Test ${code}` } });
    tenantIds.push(t.id);
    return t.id;
  };

  const tStarter = await createTenant('TEST_SUB_STARTER');
  const tEnterprise = await createTenant('TEST_SUB_ENT');
  const tSuspended = await createTenant('TEST_SUB_SUSP');
  const tExpired = await createTenant('TEST_SUB_EXP');
  const tCancelBefore = await createTenant('TEST_SUB_C_BEF');
  const tCancelAfter = await createTenant('TEST_SUB_C_AFT');
  const tUnknown = 'UNKNOWN_TENANT_ID_XYZ';

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
  await createSub(tEnterprise, enterpriseVersionId, 'ACTIVE', tenDaysAgo, tenDaysFuture);
  await createSub(tSuspended, enterpriseVersionId, 'SUSPENDED', tenDaysAgo, tenDaysFuture);
  await createSub(tExpired, enterpriseVersionId, 'EXPIRED', tenDaysAgo, tenDaysFuture);
  await createSub(tCancelBefore, enterpriseVersionId, 'CANCELLED', tenDaysAgo, tenDaysFuture);
  await createSub(tCancelAfter, enterpriseVersionId, 'CANCELLED', new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), tenDaysAgo);

  const tokenStarter = createToken({ sub: 10002, email: 'fleet@fi360.com', role: 'FLEET_MANAGER', permissions: ['vehicles.write'], tenantId: tStarter });
  const tokenEnterprise = createToken({ sub: 10001, email: 'admin@fi360.com', role: 'SUPER_ADMIN', permissions: ['reports.read', 'vehicles.write'], tenantId: tEnterprise });
  const tokenSuspended = createToken({ sub: 10001, email: 'admin@fi360.com', role: 'SUPER_ADMIN', permissions: ['reports.read'], tenantId: tSuspended });
  const tokenExpired = createToken({ sub: 10001, email: 'admin@fi360.com', role: 'SUPER_ADMIN', permissions: ['reports.read'], tenantId: tExpired });
  const tokenCancelBefore = createToken({ sub: 10001, email: 'admin@fi360.com', role: 'SUPER_ADMIN', permissions: ['reports.read'], tenantId: tCancelBefore });
  const tokenCancelAfter = createToken({ sub: 10001, email: 'admin@fi360.com', role: 'SUPER_ADMIN', permissions: ['reports.read'], tenantId: tCancelAfter });
  const tokenUnknown = createToken({ sub: 10001, email: 'admin@fi360.com', role: 'SUPER_ADMIN', permissions: ['reports.read'], tenantId: tUnknown });

  // Token for J: RBAC Deny (Driver has no reports.read permission)
  const tokenRbacDeny = createToken({ sub: 10004, email: 'driver@fi360.com', role: 'DRIVER', permissions: [], tenantId: tEnterprise });

  // Tokens for TEST_MODE
  const tokenTestStarter = createToken({ sub: 10002, email: 'fleet@fi360.com', role: 'FLEET_MANAGER', permissions: ['vehicles.write'], tenantId: 'TEST_TENANT_STARTER' });
  const tokenTestEnterprise = createToken({ sub: 10001, email: 'admin@fi360.com', role: 'SUPER_ADMIN', permissions: ['reports.read', 'vehicles.write'], tenantId: 'TEST_TENANT_ENTERPRISE' });

  const PORT = 3001;

  // Spawner wrapper
  const bootNest = async (testMode) => {
    process.env.TEST_MODE = testMode;
    const { NestFactory } = require('@nestjs/core');
    const { AppModule } = require('../dist/src/app.module.js');
    const { ValidationPipe } = require('@nestjs/common');
    const app = await NestFactory.create(AppModule, { logger: false });
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.listen(PORT);
    return app;
  };

  try {
    // PART 1: TEST_MODE = true
    console.log('[4] Booting Nest server in TEST_MODE = true...');
    let app = await bootNest('true');

    console.log('  - Test A: TEST_MODE=true STARTER resolves');
    const resA = await apiGet(PORT, '/api/v1/subscription/me', tokenTestStarter);
    assert.strictEqual(resA.status, 200);
    assert.strictEqual(resA.data.plan.planKey, 'STARTER');

    console.log('  - Test B: TEST_MODE=true ENTERPRISE resolves');
    const resB = await apiGet(PORT, '/api/v1/subscription/me', tokenTestEnterprise);
    assert.strictEqual(resB.status, 200);
    assert.strictEqual(resB.data.plan.planKey, 'ENTERPRISE');

    await app.close();
    console.log('[5] Nest server closed.');

    // PART 2: Production Mode (TEST_MODE = false)
    console.log('[6] Booting Nest server in production mode...');
    app = await bootNest('false');

    console.log('  - Test C: Production mode active subscription resolves');
    const resC = await apiGet(PORT, '/api/v1/subscription/status', tokenEnterprise);
    assert.strictEqual(resC.status, 200);
    assert.strictEqual(resC.data.status, 'ACTIVE');

    console.log('  - Test D: Unknown tenant fails closed (returns NO_SUBSCRIPTION status)');
    const resD = await apiGet(PORT, '/api/v1/subscription/me', tokenUnknown);
    assert.strictEqual(resD.status, 200);
    assert.strictEqual(resD.data.status, 'NO_SUBSCRIPTION');

    console.log('  - Test E: No subscription fails closed on guarded routes');
    const resE = await apiGet(PORT, '/api/v1/entitlement-test/reporting', tokenUnknown);
    assert.strictEqual(resE.status, 403);
    assert.strictEqual(resE.data.code, 'NO_SUBSCRIPTION');

    console.log('  - Test F: Suspended subscription denied feature access');
    const resF = await apiGet(PORT, '/api/v1/entitlement-test/reporting', tokenSuspended);
    assert.strictEqual(resF.status, 403);
    assert.strictEqual(resF.data.code, 'SUSPENDED');

    console.log('  - Test G: Expired subscription denied feature access');
    const resG = await apiGet(PORT, '/api/v1/entitlement-test/reporting', tokenExpired);
    assert.strictEqual(resG.status, 403);
    assert.strictEqual(resG.data.code, 'EXPIRED');

    console.log('  - Test H: Cancelled before period end allowed commercial access');
    const resH = await apiGet(PORT, '/api/v1/entitlement-test/reporting', tokenCancelBefore);
    assert.strictEqual(resH.status, 200);

    console.log('  - Test I: Cancelled after period end denied commercial access');
    const resI = await apiGet(PORT, '/api/v1/entitlement-test/reporting', tokenCancelAfter);
    assert.strictEqual(resI.status, 403);
    assert.strictEqual(resI.data.code, 'EXPIRED');

    console.log('  - Test J: RBAC check still wins over entitlement');
    const resJ = await apiGet(PORT, '/api/v1/entitlement-test/reporting', tokenRbacDeny);
    assert.strictEqual(resJ.status, 403);
    // NestJS defaults to no error code when permissions fail, checking that code is NOT commercial codes
    assert.notStrictEqual(resJ.data.code, 'FEATURE_NOT_ENTITLED');

    console.log('  - Test K: LIMIT_REACHED wins after entitlement');
    // Fetch STARTER limit value
    const maxVehicles = resA.data.limits.MAX_VEHICLES || 10;
    
    // Fill up to exactly MAX_VEHICLES
    const currentUsage = await prisma.vehicle.count({ where: { tenantId: tStarter, isActive: true } });
    const toAdd = maxVehicles - currentUsage;
    for (let i = 0; i < toAdd; i++) {
      const v = await prisma.vehicle.create({
        data: {
          tenantId: tStarter,
          organizationId: 'ORG-STARTER',
          registrationNumber: `COMM-TEST-FILL-${Date.now()}-${i}`,
          vehicleClass: 'TRUCK',
        }
      });
      vehicleIds.push(v.id);
    }

    // Try creating one more vehicle -> must fail with LIMIT_REACHED
    const resK = await apiPost(PORT, '/api/v1/vehicles', {
      registrationNumber: `COMM-TEST-OVER-${Date.now()}`,
      vehicleClass: 'TRUCK',
    }, tokenStarter);

    assert.strictEqual(resK.status, 403);
    assert.strictEqual(resK.data.code, 'LIMIT_REACHED');

    await app.close();
    console.log('[7] Nest server closed.');
    console.log('All E2E checks PASSED.');

  } catch (err) {
    console.error('Test failed:', err);
    process.exitCode = 1;
  } finally {
    console.log('[8] Cleaning up database records...');
    await prisma.vehicle.deleteMany({ where: { id: { in: vehicleIds } } });
    await prisma.subscriptionStatusHistory.deleteMany({ where: { subscriptionId: { in: subscriptionIds } } });
    await prisma.subscription.deleteMany({ where: { id: { in: subscriptionIds } } });
    await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } });
    await prisma.$disconnect();
    console.log('[9] Cleanup complete.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
