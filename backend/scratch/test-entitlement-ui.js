const http = require('http');

async function apiFetch(path, token) {
  return new Promise((resolve, reject) => {
    const req = http.request(`http://localhost:3000${path}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(data); } catch(e){}
        resolve({ status: res.statusCode, data: parsed });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fi360-jwt-secret-change-in-production';

function createTestJwt(tenantId, role = 'SUPER_ADMIN') {
  const payload = {
    sub: 999,
    email: `test@${tenantId}.local`,
    role: role,
    tenantId: tenantId,
    permissions: role === 'SUPER_ADMIN' ? ['reports.read', 'catalog.manage'] : []
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

async function run() {
  console.log("=========================================");
  console.log("STEP 6B.3: UI ENTITLEMENT VERIFICATION");
  console.log("=========================================\n");

  const tests = [
    { name: "Enterprise entitlement → enabled UI", tenant: "TEST_TENANT_ENTERPRISE", expectedFeature: true, expectedStatus: 200 },
    { name: "Starter without feature → locked UI", tenant: "TEST_TENANT_STARTER", expectedFeature: false, expectedStatus: 200 },
    { name: "Missing entitlement context → NOT CONFIGURED", tenant: "MISSING_TENANT", expectedFeature: false, expectedStatus: 200 },
    { name: "RBAC denial → remains denied", tenant: "TEST_TENANT_ENTERPRISE", role: "DRIVER", url: '/api/v1/entitlement-test/reporting', expectedStatus: 403 }
  ];

  let passed = 0;

  for (const t of tests) {
    const token = createTestJwt(t.tenant, t.role || 'SUPER_ADMIN');
    
    // Simulate EntitlementClient.load()
    let featureList = [];
    if (!t.url) {
      const res = await apiFetch('/api/v1/entitlement/my-features', token);
      
      let hasFeature = false;
      if (res.status === 200 && Array.isArray(res.data)) {
        hasFeature = res.data.includes('REPORTING');
      } else {
        console.log(`[HTTP ${res.status}] ${JSON.stringify(res.data)}`);
      }

      if (hasFeature === t.expectedFeature) {
        console.log(`[PASS] ${t.name}`);
        passed++;
      } else {
        console.log(`[FAIL] ${t.name}. Expected feature: ${t.expectedFeature}, got: ${hasFeature}`);
      }
    } else {
      // Simulate direct URL access / API call
      const res = await apiFetch(t.url, token);
      if (res.status === t.expectedStatus) {
        console.log(`[PASS] ${t.name} -> HTTP ${res.status}`);
        passed++;
      } else {
        console.log(`[FAIL] ${t.name} -> expected HTTP ${t.expectedStatus}, got ${res.status}`);
      }
    }
  }

  console.log(`\nResults: ${passed}/${tests.length} PASS`);
  if (passed === tests.length) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

run().catch(console.error);
