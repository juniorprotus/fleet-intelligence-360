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
  console.log('STEP 6C.4 — USAGE MEASUREMENT E2E TESTS');
  console.log('============================================================\n');

  const { PrismaPg } = require('@prisma/adapter-pg');
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

  const starterToken = createToken({
    id: 10002,
    email: 'fleet@fi360.com',
    role: 'FLEET_MANAGER',
    tenantId: 'TEST_TENANT_STARTER',
    organizationId: 'ORG-STARTER',
  });

  const enterpriseToken = createToken({
    id: 10001,
    email: 'admin@fi360.com',
    role: 'FLEET_MANAGER',
    tenantId: 'TEST_TENANT_ENTERPRISE',
    organizationId: 'ORG-ENTERPRISE',
  });

  const baseUrl = 'http://localhost:3000/api/v1/usage/summary';

  const apiGet = async (token) => {
    const res = await fetch(baseUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return { status: res.status, data: await res.json() };
  };

  // 1. Connection check
  console.log('[E2E] Checking connection to server...');
  try {
    const check = await apiGet(starterToken);
    console.log(`[E2E] Connected to server successfully (Status: ${check.status})`);
  } catch (err) {
    console.error('❌ FAILED to connect to server. Ensure Nest server is running on port 3000.', err.message);
    process.exit(1);
  }

  // Verify Starter
  await runTestAsync('Verify Starter MAX_VEHICLES = 10, others NOT_CONFIGURED', async () => {
    const res = await apiGet(starterToken);
    if (res.status !== 200) throw new Error(`Failed to get usage summary: ${res.status}`);
    
    const usage = res.data;
    const maxVehicles = usage.find(u => u.limitCode === 'MAX_VEHICLES');
    if (!maxVehicles || maxVehicles.configuredLimit !== 10) {
      throw new Error(`Starter MAX_VEHICLES is not 10. Data: ${JSON.stringify(maxVehicles)}`);
    }

    const maxUsers = usage.find(u => u.limitCode === 'MAX_USERS');
    if (maxUsers.status !== 'NOT_CONFIGURED') {
      throw new Error(`Starter MAX_USERS should be NOT_CONFIGURED. Data: ${JSON.stringify(maxUsers)}`);
    }

    const maxWorkshops = usage.find(u => u.limitCode === 'MAX_WORKSHOPS');
    if (maxWorkshops.status !== 'NOT_CONFIGURED') {
      throw new Error(`Starter MAX_WORKSHOPS should be NOT_CONFIGURED. Data: ${JSON.stringify(maxWorkshops)}`);
    }
  });

  // Verify Enterprise
  await runTestAsync('Verify Enterprise MAX_VEHICLES = UNLIMITED', async () => {
    const res = await apiGet(enterpriseToken);
    if (res.status !== 200) throw new Error(`Failed to get usage summary: ${res.status}`);
    
    const usage = res.data;
    const maxVehicles = usage.find(u => u.limitCode === 'MAX_VEHICLES');
    if (!maxVehicles || maxVehicles.isUnlimited !== true || maxVehicles.status !== 'UNLIMITED') {
      throw new Error(`Enterprise MAX_VEHICLES is not unlimited. Data: ${JSON.stringify(maxVehicles)}`);
    }
  });

  console.log('============================================================');
  console.log(`E2E TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================');

  await prisma.$disconnect();
  await new Promise(r => setTimeout(r, 500));
  process.exit(failed > 0 ? 1 : 0);
}

main();
