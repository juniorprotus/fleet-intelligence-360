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
  console.log('STEP 6C.4 — QUANTITATIVE LIMIT ENFORCEMENT E2E TESTS');
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

  const unknownToken = createToken({
    id: 99999,
    email: 'unknown@fi360.com',
    role: 'FLEET_MANAGER',
    tenantId: 'UNKNOWN_TENANT',
    organizationId: 'UNKNOWN_ORG',
  });

  const rbacToken = createToken({
    id: 10004,
    email: 'driver@fi360.com',
    role: 'DRIVER', // Driver cannot create vehicles
    tenantId: 'TEST_TENANT_STARTER',
    organizationId: 'ORG-STARTER',
  });

  const baseUrl = 'http://localhost:3000/api/v1/vehicles';

  const apiPost = async (token, body) => {
    const res = await fetch(baseUrl, {
      method: 'POST',
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
    const check = await fetch('http://localhost:3000/api/v1/usage/summary', {
      headers: { Authorization: `Bearer ${starterToken}` }
    });
    console.log(`[E2E] Connected to server successfully (Status: ${check.status})`);
  } catch (err) {
    console.error('❌ FAILED to connect to server. Ensure Nest server is running on port 3000.', err.message);
    process.exit(1);
  }

  // Cleanup any left over data from previous runs
  await prisma.vehicle.deleteMany({
    where: { registrationNumber: { startsWith: 'LIMIT-TEST-' } }
  });

  // Fetch current limit for STARTER
  const starterPlan = await prisma.planVersion.findFirst({
    where: { plan: { planKey: 'STARTER' }, status: 'ACTIVE' },
    include: { limitConfigurations: { include: { limitDefinition: true } } }
  });
  const maxVehiclesLimit = starterPlan.limitConfigurations.find(l => l.limitDefinition.limitCode === 'MAX_VEHICLES').limitValue;

  const currentStarterUsage = await prisma.vehicle.count({
    where: { tenantId: 'TEST_TENANT_STARTER', isActive: true }
  });

  console.log(`[E2E] STARTER Current Usage: ${currentStarterUsage} / ${maxVehiclesLimit}`);

  // Test A: Below MAX_VEHICLES -> success
  const testRegA = `LIMIT-TEST-A-${Date.now()}`;
  await runTestAsync('A. TEST_TENANT_STARTER: Usage below MAX_VEHICLES -> create succeeds', async () => {
    if (currentStarterUsage >= maxVehiclesLimit) {
      throw new Error('Test precondition failed: Current usage is already at or above limit.');
    }
    const res = await apiPost(starterToken, { registrationNumber: testRegA, vehicleClass: 'TRUCK' });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}: ${JSON.stringify(res.data)}`);
  });

  // Fill up to exactly MAX_VEHICLES
  let currentUsage = await prisma.vehicle.count({ where: { tenantId: 'TEST_TENANT_STARTER', isActive: true } });
  const toAdd = maxVehiclesLimit - currentUsage;
  for (let i = 0; i < toAdd; i++) {
    await prisma.vehicle.create({
      data: {
        tenantId: 'TEST_TENANT_STARTER',
        organizationId: 'ORG-STARTER',
        registrationNumber: `LIMIT-TEST-FILL-${Date.now()}-${i}`,
        vehicleClass: 'TRUCK',
      }
    });
  }

  // Test B: Exactly at MAX_VEHICLES -> 403 LIMIT_REACHED
  const testRegB = `LIMIT-TEST-B-${Date.now()}`;
  await runTestAsync('B. TEST_TENANT_STARTER: Usage exactly at MAX_VEHICLES -> 403 LIMIT_REACHED', async () => {
    const res = await apiPost(starterToken, { registrationNumber: testRegB, vehicleClass: 'TRUCK' });
    if (res.status !== 403 || res.data?.code !== 'LIMIT_REACHED') {
      throw new Error(`Expected 403 LIMIT_REACHED, got ${res.status}: ${JSON.stringify(res.data)}`);
    }
  });

  // Push one over limit manually via DB
  await prisma.vehicle.create({
    data: {
      tenantId: 'TEST_TENANT_STARTER',
      organizationId: 'ORG-STARTER',
      registrationNumber: `LIMIT-TEST-OVER-${Date.now()}`,
      vehicleClass: 'TRUCK',
    }
  });

  // Test C: Over MAX_VEHICLES -> remains blocked
  const testRegC = `LIMIT-TEST-C-${Date.now()}`;
  await runTestAsync('C. TEST_TENANT_STARTER: Usage over MAX_VEHICLES -> remains blocked', async () => {
    const res = await apiPost(starterToken, { registrationNumber: testRegC, vehicleClass: 'TRUCK' });
    if (res.status !== 403 || res.data?.code !== 'LIMIT_REACHED') {
      throw new Error(`Expected 403 LIMIT_REACHED, got ${res.status}: ${JSON.stringify(res.data)}`);
    }
  });

  // Test D: Enterprise unlimited -> creation succeeds
  const testRegD = `LIMIT-TEST-D-${Date.now()}`;
  await runTestAsync('D. TEST_TENANT_ENTERPRISE: MAX_VEHICLES unlimited -> creation succeeds', async () => {
    const res = await apiPost(enterpriseToken, { registrationNumber: testRegD, vehicleClass: 'TRUCK' });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}: ${JSON.stringify(res.data)}`);
  });

  // Test E: Missing/unknown tenant -> fail closed
  const testRegE = `LIMIT-TEST-E-${Date.now()}`;
  await runTestAsync('E. Missing/unknown tenant -> fail closed', async () => {
    const res = await apiPost(unknownToken, { registrationNumber: testRegE, vehicleClass: 'TRUCK' });
    if (res.status !== 403 || res.data?.code !== 'LIMIT_NOT_CONFIGURED') {
      throw new Error(`Expected 403 LIMIT_NOT_CONFIGURED, got ${res.status}: ${JSON.stringify(res.data)}`);
    }
  });

  // Test F: RBAC denied
  const testRegF = `LIMIT-TEST-F-${Date.now()}`;
  await runTestAsync('F. RBAC denied -> RBAC 403 (NOT LIMIT_REACHED)', async () => {
    const res = await apiPost(rbacToken, { registrationNumber: testRegF, vehicleClass: 'TRUCK' });
    // RBAC throws 403 with standard NestJS Forbidden message or custom RBAC message, but definitely not LIMIT_REACHED
    if (res.status !== 403 || res.data?.code === 'LIMIT_REACHED') {
      throw new Error(`Expected 403 RBAC failure (not LIMIT_REACHED), got ${res.status}: ${JSON.stringify(res.data)}`);
    }
  });

  // Test G: Event safety - DB checks
  await runTestAsync('G. Event safety -> blocked creation emits no vehicle', async () => {
    const vehB = await prisma.vehicle.findFirst({ where: { registrationNumber: testRegB } });
    const vehC = await prisma.vehicle.findFirst({ where: { registrationNumber: testRegC } });
    const vehE = await prisma.vehicle.findFirst({ where: { registrationNumber: testRegE } });
    const vehF = await prisma.vehicle.findFirst({ where: { registrationNumber: testRegF } });
    if (vehB || vehC || vehE || vehF) {
      throw new Error('Vehicles created despite limit/RBAC rejection! Database safety compromised.');
    }
  });

  // H. Cleanup
  console.log('[E2E] H. Cleaning up temporary test records...');
  await prisma.vehicle.deleteMany({
    where: { registrationNumber: { startsWith: 'LIMIT-TEST-' } }
  });
  console.log('[E2E] Cleanup complete.');

  console.log('============================================================');
  console.log(`E2E TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================');

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main();
