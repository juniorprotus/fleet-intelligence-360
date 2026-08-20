const http = require('http');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fi360-jwt-secret-key-change-in-production-2025';

function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

function httpRequest(url, token) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    http.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({ status: res.statusCode, data: parsed });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  console.log('============================================================');
  console.log('STEP 6B.2 — ENTITLEMENT GUARD E2E MATRIX TESTS');
  console.log('============================================================\n');

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

  const url = 'http://localhost:3000/api/v1/entitlement-test/reporting';

  // Test Tokens mapping different roles and tenant IDs
  const adminEnterpriseToken = createToken({
    sub: 10001,
    email: 'admin@fi360.com',
    role: 'SUPER_ADMIN',
    permissions: ['reports.read', 'catalog.manage'],
    tenantId: 'TEST_TENANT_ENTERPRISE'
  });

  const adminStarterToken = createToken({
    sub: 10001,
    email: 'admin@fi360.com',
    role: 'SUPER_ADMIN',
    permissions: ['reports.read', 'catalog.manage'],
    tenantId: 'TEST_TENANT_STARTER'
  });

  const adminNoContextToken = createToken({
    sub: 10001,
    email: 'admin@fi360.com',
    role: 'SUPER_ADMIN',
    permissions: ['reports.read', 'catalog.manage'],
    tenantId: 'TNT-DEFAULT' // No mapping configured for TNT-DEFAULT, should fail closed
  });

  const driverEnterpriseToken = createToken({
    sub: 10004,
    email: 'driver@fi360.com',
    role: 'DRIVER',
    permissions: [], // Driver has no read permissions
    tenantId: 'TEST_TENANT_ENTERPRISE'
  });

  // 1. RBAC ALLOW + ENTITLEMENT ALLOW = 200
  await runTestAsync('RBAC ALLOW + ENTITLEMENT ALLOW (Enterprise Tenant)', async () => {
    const res = await httpRequest(url, adminEnterpriseToken);
    if (res.status !== 200) {
      throw new Error(`Expected status 200, got ${res.status}. Body: ${JSON.stringify(res.data)}`);
    }
  });

  // 2. RBAC ALLOW + ENTITLEMENT DENY = 403 FEATURE_NOT_ENTITLED
  await runTestAsync('RBAC ALLOW + ENTITLEMENT DENY (Starter Tenant lacks REPORTING)', async () => {
    const res = await httpRequest(url, adminStarterToken);
    if (res.status !== 403) {
      throw new Error(`Expected status 403, got ${res.status}. Body: ${JSON.stringify(res.data)}`);
    }
    if (res.data.code !== 'FEATURE_NOT_ENTITLED') {
      throw new Error(`Expected error code FEATURE_NOT_ENTITLED, got ${res.data.code}`);
    }
    if (res.data.featureCode !== 'REPORTING') {
      throw new Error(`Expected featureCode REPORTING, got ${res.data.featureCode}`);
    }
  });

  // 3. RBAC ALLOW + NO ENTITLEMENT CONTEXT = 403 NO_ENTITLEMENT_CONTEXT
  await runTestAsync('RBAC ALLOW + NO ENTITLEMENT CONTEXT (TNT-DEFAULT fails closed)', async () => {
    const res = await httpRequest(url, adminNoContextToken);
    if (res.status !== 403) {
      throw new Error(`Expected status 403, got ${res.status}. Body: ${JSON.stringify(res.data)}`);
    }
    if (res.data.code !== 'NO_ENTITLEMENT_CONTEXT') {
      throw new Error(`Expected error code NO_ENTITLEMENT_CONTEXT, got ${res.data.code}`);
    }
  });

  // 4. RBAC DENY + ENTITLEMENT ALLOW = 403 Forbidden (RBAC level rejection)
  await runTestAsync('RBAC DENY + ENTITLEMENT ALLOW (Driver lacks reports.read permission)', async () => {
    const res = await httpRequest(url, driverEnterpriseToken);
    if (res.status !== 403) {
      throw new Error(`Expected status 403, got ${res.status}. Body: ${JSON.stringify(res.data)}`);
    }
    // NestJS default ForbiddenException returns "Forbidden" message for RBAC check
    if (res.data.code === 'FEATURE_NOT_ENTITLED' || res.data.code === 'NO_ENTITLEMENT_CONTEXT') {
      throw new Error(`Expected standard RBAC rejection, but got entitlement code ${res.data.code}`);
    }
  });

  console.log('\n============================================================');
  console.log(`E2E GUARD TEST RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================');

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
