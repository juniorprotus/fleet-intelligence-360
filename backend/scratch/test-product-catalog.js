const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const jwt = require('jsonwebtoken');
const { execSync } = require('child_process');
const dotenv = require('dotenv');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fi360-jwt-secret-key-change-in-production-2025';

function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

async function main() {
  console.log('============================================================');
  console.log('STEP 6A.2 — PRODUCT CATALOG SEED, RBAC & AUDIT E2E TESTS');
  console.log('============================================================\n');

  const connectionString = process.env.DATABASE_URL;
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  await prisma.$connect();

  let passed = 0;
  let failed = 0;

  const runTest = (name, fn) => {
    try {
      fn();
      console.log(`✅ PASSED: ${name}`);
      passed++;
    } catch (e) {
      console.error(`❌ FAILED: ${name}`);
      console.error(e);
      failed++;
    }
  };

  const runTestAsync = async (name, fn) => {
    try {
      await fn();
      console.log(`✅ PASSED: ${name}`);
      passed++;
    } catch (e) {
      console.error(`❌ FAILED: ${name}`);
      console.error(e);
      failed++;
    }
  };

  // Generate tokens
  const adminToken = createToken({
    id: 10001,
    email: 'admin@fi360.com',
    role: 'SUPER_ADMIN',
  });

  const ceoToken = createToken({
    id: 10002,
    email: 'ceo@fi360.com',
    role: 'CEO',
  });

  const fmToken = createToken({
    id: 10003,
    email: 'fm@fi360.com',
    role: 'FLEET_MANAGER',
  });

  const driverToken = createToken({
    id: 10004,
    email: 'driver@fi360.com',
    role: 'DRIVER',
  });

  const baseUrl = 'http://localhost:3000/api/v1/catalog';

  // Helper fetch calls
  const apiGet = async (url, token) => {
    const res = await fetch(baseUrl + url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return { status: res.status, data: res.status !== 204 ? await res.json() : null };
  };

  const apiPost = async (url, body, token) => {
    const res = await fetch(baseUrl + url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });
    return { status: res.status, data: await res.json() };
  };

  const apiPatch = async (url, body, token) => {
    const res = await fetch(baseUrl + url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });
    return { status: res.status, data: await res.json() };
  };

  // Let's check server connection
  console.log('[E2E] Checking connection to server...');
  try {
    const check = await apiGet('/products', adminToken);
    console.log(`[E2E] Connected to server successfully (Status: ${check.status})`);
  } catch (err) {
    console.error('❌ FAILED to connect to server. Ensure Nest server is running on port 3000.', err.message);
    process.exit(1);
  }

  // 1. Standard Catalog Exists & 2. Seed Idempotency
  await runTestAsync('Standard Catalog Exists & Seed Idempotency', async () => {
    // Check initial counts
    const pCountBefore = await prisma.product.count();
    const planCountBefore = await prisma.plan.count();
    const pvCountBefore = await prisma.planVersion.count();
    const priceCountBefore = await prisma.planPrice.count();
    
    console.log(`[SEED IDEMPOTENCY] Before run: Products=${pCountBefore}, Plans=${planCountBefore}, Versions=${pvCountBefore}, Prices=${priceCountBefore}`);

    // Re-run seed
    console.log('[SEED IDEMPOTENCY] Running seed script...');
    execSync('npx ts-node prisma/seed-product-catalog.ts');

    // Check after counts
    const pCountAfter = await prisma.product.count();
    const planCountAfter = await prisma.plan.count();
    const pvCountAfter = await prisma.planVersion.count();
    const priceCountAfter = await prisma.planPrice.count();

    console.log(`[SEED IDEMPOTENCY] After run: Products=${pCountAfter}, Plans=${planCountAfter}, Versions=${pvCountAfter}, Prices=${priceCountAfter}`);

    if (pCountBefore !== pCountAfter || planCountBefore !== planCountAfter || pvCountBefore !== pvCountAfter || priceCountBefore !== priceCountAfter) {
      throw new Error(`Idempotency violated: Counts changed! Before: ${pCountBefore}/${planCountBefore}/${pvCountBefore}/${priceCountBefore}, After: ${pCountAfter}/${planCountAfter}/${pvCountAfter}/${priceCountAfter}`);
    }
  });

  // 3. Product CRUD
  let productId;
  await runTestAsync('Product CRUD', async () => {
    const key = `PROD_CRUD_TEST_${Date.now()}`;
    const createRes = await apiPost('/products', {
      productKey: key,
      name: 'E2E Test Product',
      description: 'Used for E2E tests'
    }, adminToken);

    if (createRes.status !== 201) throw new Error(`Create product returned ${createRes.status}`);
    productId = createRes.data.id;

    // Read
    const getRes = await apiGet(`/products/${key}`, adminToken);
    if (getRes.status !== 200 || getRes.data.name !== 'E2E Test Product') {
      throw new Error('Find product failed');
    }

    // Update
    const patchRes = await apiPatch(`/products/${productId}`, {
      name: 'Updated E2E Test Product'
    }, adminToken);
    if (patchRes.status !== 200 || patchRes.data.name !== 'Updated E2E Test Product') {
      throw new Error('Update product failed');
    }

    // Archive
    const archiveRes = await apiPost(`/products/${productId}/archive`, {}, adminToken);
    if (archiveRes.status !== 201 || archiveRes.data.status !== 'ARCHIVED') {
      throw new Error('Archive product failed');
    }
  });

  // 4. Plan CRUD
  let planId;
  await runTestAsync('Plan CRUD', async () => {
    // Create new active product for plans
    const prodKey = `PROD_FOR_PLANS_${Date.now()}`;
    const prod = await prisma.product.create({
      data: { productKey: prodKey, name: 'Prod for Plans', status: 'ACTIVE' }
    });

    const key = `PLAN_E2E_${Date.now()}`;
    const createRes = await apiPost('/plans', {
      productId: prod.id,
      planKey: key,
      name: 'E2E Test Plan'
    }, adminToken);

    if (createRes.status !== 201) throw new Error(`Create plan returned ${createRes.status}`);
    planId = createRes.data.id;

    // Update
    const patchRes = await apiPatch(`/plans/${planId}`, {
      name: 'Updated E2E Test Plan'
    }, adminToken);
    if (patchRes.status !== 200 || patchRes.data.name !== 'Updated E2E Test Plan') {
      throw new Error('Update plan failed');
    }

    // Archive
    const archiveRes = await apiPost(`/plans/${planId}/archive`, {}, adminToken);
    if (archiveRes.status !== 201 || archiveRes.data.status !== 'ARCHIVED') {
      throw new Error('Archive plan failed');
    }
  });

  // 5. PlanVersion creation
  let activeProductId;
  let activePlanId;
  let versionId;
  await runTestAsync('PlanVersion Creation', async () => {
    const prodKey = `PROD_ACTIVE_${Date.now()}`;
    const prod = await prisma.product.create({
      data: { productKey: prodKey, name: 'Active Product', status: 'ACTIVE' }
    });
    activeProductId = prod.id;

    const planKey = `PLAN_ACTIVE_${Date.now()}`;
    const plan = await prisma.plan.create({
      data: { productId: prod.id, planKey, name: 'Active Plan', status: 'ACTIVE' }
    });
    activePlanId = plan.id;

    const versionRes = await apiPost(`/plans/${plan.id}/versions`, {
      versionNumber: 1,
      effectiveFrom: '2026-01-01T00:00:00Z',
    }, adminToken);

    if (versionRes.status !== 201) throw new Error(`Create PlanVersion returned ${versionRes.status}`);
    versionId = versionRes.data.id;
  });

  // 6. Version Overlap Rejection
  await runTestAsync('Version Overlap Rejection', async () => {
    // Activate versionId first
    await apiPost(`/plan-versions/${versionId}/activate`, {}, adminToken);

    // Create another version
    const versionRes2 = await apiPost(`/plans/${activePlanId}/versions`, {
      versionNumber: 2,
      effectiveFrom: '2026-06-01T00:00:00Z',
    }, adminToken);

    if (versionRes2.status !== 201) throw new Error('Create version 2 failed');

    // Attempt to activate version 2 while it overlaps with active version 1 (which has no effectiveTo, meaning Infinity)
    const activeRes = await apiPost(`/plan-versions/${versionRes2.data.id}/activate`, {}, adminToken);
    if (activeRes.status !== 400) {
      throw new Error(`Expected activation failure (400) due to overlap, but got: ${activeRes.status}`);
    }
  });

  // 7. Version Activation Rules
  await runTestAsync('Version Activation Rules (Parent Status Requirements)', async () => {
    const draftProd = await prisma.product.create({
      data: { productKey: `PROD_DRAFT_${Date.now()}`, name: 'Draft Product', status: 'DRAFT' }
    });
    const draftPlan = await prisma.plan.create({
      data: { productId: draftProd.id, planKey: 'PLAN_DRAFT', name: 'Draft Plan', status: 'DRAFT' }
    });
    const pv = await prisma.planVersion.create({
      data: { planId: draftPlan.id, versionNumber: 1, effectiveFrom: new Date('2026-01-01') }
    });

    // Try to activate
    const res = await apiPost(`/plan-versions/${pv.id}/activate`, {}, adminToken);
    if (res.status !== 400) {
      throw new Error(`Expected activation rejection because parent product is DRAFT. Got status: ${res.status}`);
    }
  });

  // 8. Pricing Validation
  await runTestAsync('Pricing Validation (Negative rejection)', async () => {
    const res = await apiPost(`/plan-versions/${versionId}/pricing`, {
      currency: 'KES',
      billingInterval: 'MONTHLY',
      amount: -100
    }, adminToken);
    if (res.status !== 400) {
      throw new Error(`Expected negative price config to be rejected. Got status: ${res.status}`);
    }
  });

  // 9. Pricing Band Overlap
  await runTestAsync('Pricing Band Overlap Rejection', async () => {
    await apiPost(`/plan-versions/${versionId}/pricing-bands`, {
      minVehicles: 1,
      maxVehicles: 100,
      currency: 'KES',
      billingInterval: 'MONTHLY',
      pricePerVehicle: 10
    }, adminToken);

    // Overlapping band [50-150]
    const res = await apiPost(`/plan-versions/${versionId}/pricing-bands`, {
      minVehicles: 50,
      maxVehicles: 150,
      currency: 'KES',
      billingInterval: 'MONTHLY',
      pricePerVehicle: 8
    }, adminToken);

    if (res.status !== 400) {
      throw new Error(`Expected overlapping band to be rejected. Got status: ${res.status}`);
    }
  });

  // 10. Open-Ended Band Validation
  await runTestAsync('Open-Ended Band Validation (Only one permitted)', async () => {
    // Add first open ended band [101-Infinity]
    await apiPost(`/plan-versions/${versionId}/pricing-bands`, {
      minVehicles: 101,
      maxVehicles: null,
      currency: 'KES',
      billingInterval: 'MONTHLY',
      pricePerVehicle: 5
    }, adminToken);

    // Attempt second open ended band [201-Infinity]
    const res = await apiPost(`/plan-versions/${versionId}/pricing-bands`, {
      minVehicles: 201,
      maxVehicles: null,
      currency: 'KES',
      billingInterval: 'MONTHLY',
      pricePerVehicle: 4
    }, adminToken);

    if (res.status !== 400) {
      throw new Error(`Expected second open-ended band to be rejected. Got status: ${res.status}`);
    }
  });

  // 11. RBAC Tests
  await runTestAsync('RBAC Restrictions', async () => {
    // 1. Read operations
    const getCeo = await apiGet('/products', ceoToken);
    const getFm = await apiGet('/products', fmToken);
    const getDriver = await apiGet('/products', driverToken);

    if (getCeo.status !== 200) throw new Error(`CEO should have read access. Got ${getCeo.status}`);
    if (getFm.status !== 200) throw new Error(`Fleet Manager should have read access. Got ${getFm.status}`);
    if (getDriver.status !== 403) throw new Error(`Driver must be denied read access. Got ${getDriver.status}`);

    // 2. Write operations
    const createCeo = await apiPost('/products', { productKey: 'CEO_BAD', name: 'Bad' }, ceoToken);
    const createFm = await apiPost('/products', { productKey: 'FM_BAD', name: 'Bad' }, fmToken);

    if (createCeo.status !== 403) throw new Error(`CEO must be denied write access. Got ${createCeo.status}`);
    if (createFm.status !== 403) throw new Error(`Fleet Manager must be denied write access. Got ${createFm.status}`);
  });

  // 12. AuditLog Verification
  await runTestAsync('AuditLog Verification', async () => {
    // Query DB audit_logs for telematics/product_catalog actions
    const log = await prisma.auditLog.findFirst({
      where: { module: 'PRODUCT_CATALOG' },
      orderBy: { createdAt: 'desc' }
    });

    if (!log) {
      throw new Error('AuditLog entry for PRODUCT_CATALOG was not created');
    }

    console.log(`[AUDITLOG] Retrieved log: Action=${log.action}, Entity=${log.entityType}, ID=${log.entityId}, UserEmail=${log.userEmail}`);
    if (!log.afterValue) {
      throw new Error('afterValue is missing from audit log');
    }
  });

  // 13. Global Catalog Security (Payload Injection)
  await runTestAsync('Global Catalog Security (Payload Injection Strip)', async () => {
    const key = `PROD_INJECT_${Date.now()}`;
    const createRes = await apiPost('/products', {
      productKey: key,
      name: 'Payload Injection Test',
      tenantId: 'TNT-MALICIOUS',
      organizationId: 'ORG-MALICIOUS'
    }, adminToken);

    if (createRes.status !== 400) {
      throw new Error(`Expected payload injection containing tenantId/organizationId to be rejected with 400 Bad Request (forbidNonWhitelisted). Got: ${createRes.status}`);
    }
  });

  console.log('\n============================================================');
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================');

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
