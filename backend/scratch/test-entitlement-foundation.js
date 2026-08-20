const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fi360-jwt-secret-key-change-in-production-2025';

function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

async function main() {
  console.log('============================================================');
  console.log('STEP 6B.1 — ENTITLEMENT FOUNDATION E2E TESTS');
  console.log('============================================================\n');

  const connectionString = process.env.DATABASE_URL;
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  await prisma.$connect();

  let passed = 0;
  let failed = 0;

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

  const adminToken = createToken({
    id: 10001,
    email: 'admin@fi360.com',
    role: 'SUPER_ADMIN',
    tenantId: 'TEST_TENANT_ENTERPRISE',
  });

  const driverToken = createToken({
    id: 10004,
    email: 'driver@fi360.com',
    role: 'DRIVER',
    tenantId: 'TEST_TENANT_STARTER',
  });

  const baseUrl = 'http://localhost:3000/api/v1/entitlement';

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

  // 1. Connection check
  console.log('[E2E] Checking connection to server...');
  try {
    const check = await apiGet('/features', adminToken);
    console.log(`[E2E] Connected to server successfully (Status: ${check.status})`);
  } catch (err) {
    console.error('❌ FAILED to connect to server. Ensure Nest server is running on port 3000.', err.message);
    process.exit(1);
  }

  // 2. Feature Creation & Rejection of Duplicate Feature Codes
  let testFeatureId;
  const testFeatureCode = `FEAT_E2E_TEST_${Date.now()}`;
  await runTestAsync('Feature Creation & Duplicate Rejection', async () => {
    const createRes = await apiPost('/features', {
      featureCode: testFeatureCode,
      name: 'E2E Test Feature',
      description: 'Used for E2E verification of the entitlement layer',
      category: 'TEST',
      status: 'ACTIVE',
      displayOrder: 100
    }, adminToken);

    if (createRes.status !== 201) {
      throw new Error(`Failed to create feature definition. Status: ${createRes.status}`);
    }
    testFeatureId = createRes.data.id;
    if (!testFeatureId) {
      throw new Error('Feature ID not returned in response');
    }

    // Try to create duplicate
    const dupRes = await apiPost('/features', {
      featureCode: testFeatureCode,
      name: 'Duplicate Feature',
    }, adminToken);

    if (dupRes.status !== 409) {
      throw new Error(`Expected 409 Conflict for duplicate featureCode, got ${dupRes.status}`);
    }
  });

  // 3. PlanVersion Entitlement Creation & Rejection of Duplicate Mappings
  let testEntitlementId;
  let activePlanVersionId;
  await runTestAsync('PlanVersion Entitlement Mapping & Duplicate Rejection', async () => {
    // We need a valid PlanVersion. Let's find one via Prisma
    const version = await prisma.planVersion.findFirst({
      where: { status: 'ACTIVE' }
    });
    if (!version) {
      throw new Error('No active PlanVersion found to link entitlement');
    }
    activePlanVersionId = version.id;

    // Create entitlement mapping
    const mapRes = await apiPost('/entitlements', {
      planVersionId: activePlanVersionId,
      featureId: testFeatureId,
      enabled: true
    }, adminToken);

    if (mapRes.status !== 201) {
      throw new Error(`Failed to map entitlement to plan version. Status: ${mapRes.status}`);
    }
    testEntitlementId = mapRes.data.id;

    // Try to map same feature to same plan version again (duplicate mapping constraint)
    const dupMapRes = await apiPost('/entitlements', {
      planVersionId: activePlanVersionId,
      featureId: testFeatureId,
      enabled: false
    }, adminToken);

    if (dupMapRes.status !== 409) {
      throw new Error(`Expected 409 Conflict for duplicate planVersion/feature mapping, got ${dupMapRes.status}`);
    }
  });

  // 4. Feature Enable/Disable
  await runTestAsync('Feature Enable/Disable & Updates', async () => {
    const patchRes = await apiPatch(`/entitlements/${testEntitlementId}`, {
      enabled: false
    }, adminToken);

    if (patchRes.status !== 200 || patchRes.data.enabled !== false) {
      throw new Error(`Failed to disable entitlement mapping. Status: ${patchRes.status}`);
    }

    const patchBackRes = await apiPatch(`/entitlements/${testEntitlementId}`, {
      enabled: true
    }, adminToken);

    if (patchBackRes.status !== 200 || patchBackRes.data.enabled !== true) {
      throw new Error(`Failed to enable entitlement mapping back. Status: ${patchBackRes.status}`);
    }
  });

  // 5. Feature Lookup & Version Feature Listing (using directly the prisma queries tested via EntitlementService)
  // Let's use direct service checks or direct fetch checks if there are endpoints.
  // Wait, is there a query endpoint? No, the controllers only expose GET/POST/PATCH for management.
  // The query logic is tested via Jest, but let's check it using Prisma in E2E to verify DB persistence and reconciliation.
  await runTestAsync('Feature Lookup and Plan Version Listings', async () => {
    const feature = await prisma.featureDefinition.findUnique({
      where: { featureCode: testFeatureCode }
    });
    if (!feature || feature.id !== testFeatureId) {
      throw new Error('Feature lookup by code failed');
    }

    const entitlements = await prisma.planEntitlement.findMany({
      where: { planVersionId: activePlanVersionId },
      include: { feature: true }
    });
    const found = entitlements.some(e => e.featureId === testFeatureId && e.enabled);
    if (!found) {
      throw new Error('Enabled feature listing did not contain E2E test feature');
    }
  });

  // 6. RBAC Protection Check
  await runTestAsync('RBAC Protection Check', async () => {
    // DRIVER cannot create feature
    const createRes = await apiPost('/features', {
      featureCode: 'FEAT_UNAUTHORIZED',
      name: 'Unauth Feature',
    }, driverToken);

    if (createRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for unauthorized driver on POST /features, got ${createRes.status}`);
    }

    // DRIVER can read features list (Requires PRODUCT_CATALOG_READ, which DRIVER doesn't have! Wait! Let's check roles matrix.)
    // In roles matrix: DRIVER does NOT have Permission.PRODUCT_CATALOG_READ!
    // CEO, FLEET_MANAGER, FINANCE_MANAGER, SUPER_ADMIN have Permission.PRODUCT_CATALOG_READ.
    // Let's verify DRIVER fails GET /features (should get 403)
    const readRes = await apiGet('/features', driverToken);
    if (readRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for unauthorized driver on GET /features, got ${readRes.status}`);
    }
  });

  // 7. AuditLog Verification
  await runTestAsync('AuditLog Verification', async () => {
    const logs = await prisma.auditLog.findMany({
      where: { module: 'ENTITLEMENT' },
      orderBy: { createdAt: 'desc' }
    });

    const hasCreateFeature = logs.some(l => l.action === 'FEATURE_CREATE' && l.entityId === testFeatureId);
    const hasCreateEntitlement = logs.some(l => l.action === 'PLAN_ENTITLEMENT_CREATE' && l.entityId === testEntitlementId);

    if (!hasCreateFeature || !hasCreateEntitlement) {
      throw new Error('Entitlement mutations failed to produce required AuditLogs');
    }
    console.log(`[AUDIT] Found ${logs.length} entitlement audit log entries.`);
  });

  // 8. Global Catalog Security Check (Ensure no tenantId/organizationId leaks)
  await runTestAsync('Global Catalog Security (No tenantId/organizationId fields)', async () => {
    const feat = await prisma.featureDefinition.findFirst();
    const ent = await prisma.planEntitlement.findFirst();

    if ('tenantId' in feat || 'organizationId' in feat) {
      throw new Error('FeatureDefinition table contains tenantId or organizationId (violates global catalog isolation)');
    }
    if ('tenantId' in ent || 'organizationId' in ent) {
      throw new Error('PlanEntitlement table contains tenantId or organizationId (violates global catalog isolation)');
    }
  });

  // 9. Existing Product Catalog remains unaffected
  await runTestAsync('Existing Product Catalog remains unaffected', async () => {
    const products = await prisma.product.findMany();
    const plans = await prisma.plan.findMany();
    if (products.length === 0 || plans.length === 0) {
      throw new Error('Product catalog tables are empty or corrupted');
    }
  });

  console.log('\n============================================================');
  console.log(`E2E TEST RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================');

  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
