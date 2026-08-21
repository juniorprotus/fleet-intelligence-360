require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const assert = require('assert');
const jwt = require('jsonwebtoken');
const cp = require('child_process');
const path = require('path');
const net = require('net');

const JWT_SECRET = process.env.JWT_SECRET || 'fi360-jwt-secret-key-change-in-production-2025';

function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
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

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true); // in use
      } else {
        resolve(false);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(false); // free
    });
    server.listen(port);
  });
}

async function main() {
  console.log('============================================================');
  console.log('STEP 6D.3 — SUBSCRIPTION AUDIT, EVENTS & LIFECYCLE E2E TESTS');
  console.log('============================================================\n');

  const tenantIds = [];
  const subscriptionIds = [];

  // Pre-cleanup leftover records from previous failed runs
  console.log('[0] Pre-cleanup leftover test records...');
  await prisma.subscriptionStatusHistory.deleteMany({
    where: { subscription: { tenant: { code: { in: ['TEST_AUDIT_T1', 'TEST_AUDIT_T2'] } } } }
  });
  await prisma.subscription.deleteMany({
    where: { tenant: { code: { in: ['TEST_AUDIT_T1', 'TEST_AUDIT_T2'] } } }
  });
  await prisma.tenant.deleteMany({
    where: { code: { in: ['TEST_AUDIT_T1', 'TEST_AUDIT_T2'] } }
  });

  // Setup test records
  console.log('[1] Setup: Fetching plans and versions...');
  const starterPlan = await prisma.plan.findFirst({ where: { planKey: 'STARTER' }, include: { versions: true } });
  const enterprisePlan = await prisma.plan.findFirst({ where: { planKey: 'ENTERPRISE' }, include: { versions: true } });

  assert(starterPlan && enterprisePlan, 'Starter and Enterprise plans must exist.');
  const starterVersionId = starterPlan.versions[0].id;
  const enterpriseVersionId = enterprisePlan.versions[0].id;

  console.log('[2] Setup: Creating isolated test tenants...');
  const createTenant = async (code) => {
    const t = await prisma.tenant.create({ data: { code, name: `Test ${code}` } });
    tenantIds.push(t.id);
    return t.id;
  };

  const t1 = await createTenant('TEST_AUDIT_T1');
  const t2 = await createTenant('TEST_AUDIT_T2');

  const tokenFleet1 = createToken({
    sub: 10001,
    email: 'fleet1@fi360.com',
    role: 'FLEET_MANAGER',
    permissions: ['subscription.read', 'subscription.manage', 'subscription.cancel', 'subscription.change_plan'],
    tenantId: t1,
  });

  const tokenCeo1 = createToken({
    sub: 10002,
    email: 'ceo1@fi360.com',
    role: 'CEO',
    permissions: ['subscription.read'],
    tenantId: t1,
  });

  const tokenFleet2 = createToken({
    sub: 10003,
    email: 'fleet2@fi360.com',
    role: 'FLEET_MANAGER',
    permissions: ['subscription.read', 'subscription.manage', 'subscription.cancel', 'subscription.change_plan'],
    tenantId: t2,
  });

  const baseUrl = process.env.FI360_BASE_URL || 'http://localhost:3001';
  const urlObj = new URL(baseUrl);
  const PORT = parseInt(urlObj.port) || 3000;

  console.log(`Target port configured: ${PORT}`);

  const portInUse = await checkPort(PORT);
  if (portInUse) {
    console.error(`Port ${PORT} is already in use. Please stop the pre-running server before starting E2E.`);
    process.exit(1);
  }

  console.log('[3] Booting Nest server in TEST_MODE = false...');
  const script = `
    const { NestFactory } = require('@nestjs/core');
    const { AppModule } = require('./dist/src/app.module.js');
    const { ValidationPipe } = require('@nestjs/common');
    async function boot() {
      const app = await NestFactory.create(AppModule, { logger: ${process.env.DEBUG_SERVER ? 'true' : 'false'} });
      app.useGlobalPipes(new ValidationPipe({ transform: true }));
      
      const { EventPublisherService } = require('./dist/src/events/event-publisher.service.js');
      try {
        const publisher = app.get(EventPublisherService);
        const events = [
          'SubscriptionCreated',
          'SubscriptionActivated',
          'SubscriptionPlanChanged',
          'SubscriptionSuspended',
          'SubscriptionCancelled',
          'SubscriptionExpired',
          'SubscriptionRenewed'
        ];
        for (const eventName of events) {
          publisher.subscribe(eventName, (envelope) => {
            if (process.send) {
              process.send({ type: 'EVENT_EMITTED', event: envelope });
            }
          });
        }
      } catch (e) {
        console.error('Failed to subscribe to events in E2E wrapper:', e);
      }

      await app.listen(${PORT});
      if (process.send) {
        process.send('BOOTED');
      }
    }
    boot().catch(err => {
      console.error(err);
      process.exit(1);
    });
  `;

  const child = cp.spawn('node', ['-e', script], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      TEST_MODE: 'false',
      PORT: String(PORT),
    },
    stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
  });

  const emittedEvents = [];
  child.on('message', (msg) => {
    if (msg && msg.type === 'EVENT_EMITTED') {
      emittedEvents.push(msg.event);
    }
  });

  let serverBooted = false;
  await new Promise((resolve, reject) => {
    child.on('message', (msg) => {
      if (msg === 'BOOTED') {
        serverBooted = true;
        resolve();
      }
    });

    const timeout = setTimeout(() => {
      if (!serverBooted) {
        reject(new Error('Server failed to boot within 15 seconds'));
      }
    }, 15000);

    child.on('error', (err) => {
      reject(err);
    });

    child.on('exit', (code) => {
      if (!serverBooted) {
        reject(new Error(`Server exited early with code ${code}`));
      }
    });
  });

  console.log('Nest server booted successfully.');

  try {
    console.log('[4] Starting E2E test cases...');

    // A. Create Subscription
    console.log('  - Case A: Create Subscription...');
    const createRes = await apiPost(PORT, '/api/v1/subscription', {
      tenantId: t1,
      planVersionId: starterVersionId,
      status: 'TRIAL',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }, tokenFleet1);

    if (createRes.status !== 201) {
      console.error('Create Subscription failed. Status:', createRes.status, 'Response:', createRes.data);
    }
    assert.strictEqual(createRes.status, 201, 'Failed to create subscription');
    const subId = createRes.data.id;
    subscriptionIds.push(subId);

    // Verify event captured
    const createdEvent = emittedEvents.find(e => e.eventType === 'SubscriptionCreated');
    assert(createdEvent, 'SubscriptionCreated event was not captured');
    assert.strictEqual(createdEvent.payload.subscriptionId, subId);
    assert.strictEqual(createdEvent.payload.planVersionId, starterVersionId);
    // Verify no secret in payload
    assert.strictEqual(JSON.stringify(createdEvent).includes('password'), false);
    assert.strictEqual(JSON.stringify(createdEvent).includes('jwt'), false);

    // Verify DB history & audit log
    const auditCreated = await prisma.auditLog.findFirst({
      where: { entityId: subId, action: 'SUBSCRIPTION_CREATED' }
    });
    assert(auditCreated, 'SUBSCRIPTION_CREATED audit log not found');
    assert.strictEqual(auditCreated.userId, '10001'); // Actor ID from JWT payload

    const historyCreated = await prisma.subscriptionStatusHistory.findMany({
      where: { subscriptionId: subId }
    });
    assert.strictEqual(historyCreated.length, 1, 'Expected exactly 1 status history record');
    assert.strictEqual(historyCreated[0].newStatus, 'TRIAL');

    // B. Activate Subscription
    console.log('  - Case B: Activate Subscription...');
    const actRes = await apiPost(PORT, `/api/v1/subscription/${subId}/activate`, { reason: 'Activating trial' }, tokenFleet1);
    assert.strictEqual(actRes.status, 200);

    const actEvent = emittedEvents.find(e => e.eventType === 'SubscriptionActivated');
    assert(actEvent, 'SubscriptionActivated event not found');
    assert.strictEqual(actEvent.payload.previousStatus, 'TRIAL');
    assert.strictEqual(actEvent.payload.currentStatus, 'ACTIVE');

    const auditAct = await prisma.auditLog.findFirst({
      where: { entityId: subId, action: 'SUBSCRIPTION_ACTIVATED' }
    });
    assert(auditAct, 'SUBSCRIPTION_ACTIVATED audit log not found');

    const historyAct = await prisma.subscriptionStatusHistory.findMany({
      where: { subscriptionId: subId },
      orderBy: { changedAt: 'asc' }
    });
    assert.strictEqual(historyAct.length, 2);
    assert.strictEqual(historyAct[1].newStatus, 'ACTIVE');

    // C. Change Plan Version
    console.log('  - Case C: Change Plan Version...');
    const changeRes = await apiPost(PORT, `/api/v1/subscription/${subId}/change-plan`, { planVersionId: enterpriseVersionId, reason: 'Upgrade to Enterprise' }, tokenFleet1);
    assert.strictEqual(changeRes.status, 200);

    const changeEvent = emittedEvents.find(e => e.eventType === 'SubscriptionPlanChanged');
    assert(changeEvent, 'SubscriptionPlanChanged event not found');
    assert.strictEqual(changeEvent.payload.planVersionId, enterpriseVersionId);
    assert.strictEqual(changeEvent.payload.previousPlanVersionId, starterVersionId);

    const auditChange = await prisma.auditLog.findFirst({
      where: { entityId: subId, action: 'SUBSCRIPTION_PLAN_CHANGED' }
    });
    assert(auditChange, 'SUBSCRIPTION_PLAN_CHANGED audit log not found');

    // D. Suspend Subscription
    console.log('  - Case D: Suspend Subscription...');
    const suspRes = await apiPost(PORT, `/api/v1/subscription/${subId}/suspend`, { reason: 'Account suspension' }, tokenFleet1);
    assert.strictEqual(suspRes.status, 200);

    const suspEvent = emittedEvents.find(e => e.eventType === 'SubscriptionSuspended');
    assert(suspEvent, 'SubscriptionSuspended event not found');
    assert.strictEqual(suspEvent.payload.currentStatus, 'SUSPENDED');

    const auditSusp = await prisma.auditLog.findFirst({
      where: { entityId: subId, action: 'SUBSCRIPTION_SUSPENDED' }
    });
    assert(auditSusp, 'SUBSCRIPTION_SUSPENDED audit log not found');

    // E. Cancel Subscription
    console.log('  - Case E: Cancel Subscription...');
    const cancelRes = await apiPost(PORT, `/api/v1/subscription/${subId}/cancel`, { reason: 'Fleet manager cancelled' }, tokenFleet1);
    assert.strictEqual(cancelRes.status, 200);

    const cancelEvent = emittedEvents.find(e => e.eventType === 'SubscriptionCancelled');
    assert(cancelEvent, 'SubscriptionCancelled event not found');
    assert.strictEqual(cancelEvent.payload.currentStatus, 'CANCELLED');

    const auditCancel = await prisma.auditLog.findFirst({
      where: { entityId: subId, action: 'SUBSCRIPTION_CANCELLED' }
    });
    assert(auditCancel, 'SUBSCRIPTION_CANCELLED audit log not found');

    // F. Expire Subscription
    console.log('  - Case F: Expire Subscription...');
    const expireRes = await apiPost(PORT, `/api/v1/subscription/${subId}/expire`, { reason: 'Period expired' }, tokenFleet1);
    assert.strictEqual(expireRes.status, 200);

    const expireEvent = emittedEvents.find(e => e.eventType === 'SubscriptionExpired');
    assert(expireEvent, 'SubscriptionExpired event not found');
    assert.strictEqual(expireEvent.payload.currentStatus, 'EXPIRED');

    // G. Renew Subscription
    console.log('  - Case G: Renew Subscription...');
    const renewRes = await apiPost(PORT, `/api/v1/subscription/${subId}/renew`, {
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      reason: 'Period extended'
    }, tokenFleet1);
    assert.strictEqual(renewRes.status, 200);

    const renewEvent = emittedEvents.find(e => e.eventType === 'SubscriptionRenewed');
    assert(renewEvent, 'SubscriptionRenewed event not found');

    const auditRenew = await prisma.auditLog.findFirst({
      where: { entityId: subId, action: 'SUBSCRIPTION_RENEWED' }
    });
    assert(auditRenew, 'SUBSCRIPTION_RENEWED audit log not found');

    // H. Cross-Tenant Denial
    console.log('  - Case H: Cross-Tenant Mutation Denial...');
    const crossRes = await apiPost(PORT, `/api/v1/subscription/${subId}/cancel`, { reason: 'Illegal cancel' }, tokenFleet2);
    assert.strictEqual(crossRes.status, 403, 'Should deny cross-tenant cancellation');

    // I. RBAC Denial (CEO cannot cancel)
    console.log('  - Case I: RBAC Mutation Denial...');
    const rbacRes = await apiPost(PORT, `/api/v1/subscription/${subId}/cancel`, { reason: 'Illegal cancel' }, tokenCeo1);
    assert.strictEqual(rbacRes.status, 403, 'Should deny mutation due to lacking permission');

    // J. Verify No Event/Audit on Failure/Rollback
    console.log('  - Case J: Verify No Event/Audit on Rollback/Failure...');
    const initialAuditCount = await prisma.auditLog.count({ where: { entityId: subId } });
    const initialEventCount = emittedEvents.length;

    // Send update with invalid planVersionId to force database/service error
    const failRes = await apiPost(PORT, `/api/v1/subscription/${subId}/change-plan`, { planVersionId: 'non-existent-id' }, tokenFleet1);
    assert.strictEqual(failRes.status, 404, 'Should fail to change plan with non-existent ID');

    const postAuditCount = await prisma.auditLog.count({ where: { entityId: subId } });
    const postEventCount = emittedEvents.length;

    assert.strictEqual(postAuditCount, initialAuditCount, 'Audit log was written on failed plan change');
    assert.strictEqual(postEventCount, initialEventCount, 'Domain event was published on failed plan change');

    console.log('All E2E checks PASSED.');

  } finally {
    console.log('[5] Terminating Nest server process...');
    child.kill('SIGTERM');

    // Verify port released
    await new Promise((resolve) => {
      const check = setInterval(async () => {
        const inUse = await checkPort(PORT);
        if (!inUse) {
          clearInterval(check);
          resolve();
        }
      }, 500);
    });

    console.log('[6] Cleaning up test records from database...');
    // Delete status history
    await prisma.subscriptionStatusHistory.deleteMany({ where: { subscriptionId: { in: subscriptionIds } } });
    // Delete subscriptions
    await prisma.subscription.deleteMany({ where: { id: { in: subscriptionIds } } });
    // Delete tenants
    await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } });
    // Delete related audit logs
    await prisma.auditLog.deleteMany({ where: { entityId: { in: subscriptionIds } } });

    await prisma.$disconnect();
    // Tiny libuv exit delay for Windows reliability
    await new Promise(r => setTimeout(r, 500));
  }
}

main().catch(err => {
  console.error('E2E execution crashed:', err);
  process.exitCode = 1;
});
