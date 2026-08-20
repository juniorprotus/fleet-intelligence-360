require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const jwt = require('jsonwebtoken');

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const JWT_SECRET = process.env.JWT_SECRET || 'fi360-jwt-secret-key-change-in-production-2025';

function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

async function runSecurityTests() {
  console.log('============================================================');
  console.log('STEP 5A — TENANT SECURITY & IDENTITY ISOLATION TEST SUITE');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  const testTenantB = 'TNT-SEC-TEST-B';
  const testOrgB = 'ORG-SEC-TEST-B';
  const testRegB = 'KBZ-TEST-999';
  const testRegA = 'KCA-TEST-AAA';

  // Cleanup past test artifacts
  await prisma.vehicle.deleteMany({
    where: { registrationNumber: { in: [testRegB, testRegA, 'KBZ-TEST-DUP'] } }
  });

  // 1. Create a test vehicle in Tenant B
  const vehicleB = await prisma.vehicle.create({
    data: {
      registrationNumber: testRegB,
      tenantId: testTenantB,
      organizationId: testOrgB,
      vehicleClass: 'Heavy Truck',
      vehicleStatus: 'ACTIVE',
      region: 'Coast',
      depot: 'Mombasa Depot'
    }
  });
  console.log(`[SETUP] Created isolated vehicle in Tenant B (${testTenantB}): ID=${vehicleB.id}, Reg=${vehicleB.registrationNumber}`);

  // Test 1: Tenant A cannot list Tenant B vehicles via scoped API
  try {
    const userA = {
      id: 9991,
      email: 'fleet.manager@fi360.com',
      role: 'FLEET_MANAGER',
      tenantId: 'TNT-DEFAULT',
      organizationId: 'ORG-DEFAULT',
      region: 'Nairobi',
      depot: 'Nairobi Depot'
    };
    const tokenA = createToken(userA);

    const res = await fetch('http://localhost:3000/api/v1/vehicles', {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const vehiclesA = await res.json();
    const leaked = vehiclesA.some(v => v.tenantId === testTenantB || v.id === vehicleB.id);

    if (!leaked && vehiclesA.length > 0) {
      console.log('✅ TEST 1 PASSED: Tenant A cannot list Tenant B vehicles (Zero Cross-Tenant Leakage)');
      passed++;
    } else {
      console.error('❌ TEST 1 FAILED: Tenant B vehicle leaked to Tenant A list query!');
      failed++;
    }
  } catch (err) {
    console.error('❌ TEST 1 ERROR:', err.message);
    failed++;
  }

  // Test 2A: Client cannot supply tenantId during creation (Strict DTO validation rejects it)
  try {
    const userA = {
      id: 9991,
      email: 'fleet.manager@fi360.com',
      role: 'FLEET_MANAGER',
      tenantId: 'TNT-DEFAULT',
      organizationId: 'ORG-DEFAULT'
    };
    const tokenA = createToken(userA);

    const resBad = await fetch('http://localhost:3000/api/v1/vehicles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        registrationNumber: testRegA,
        fleetNumber: 'FLT-SEC-01',
        vehicleClass: 'Rigid Truck',
        tenantId: testTenantB // Malicious client injection
      })
    });
    
    if (resBad.status === 400) {
      console.log('✅ TEST 2A PASSED: Client attempt to inject tenantId rejected with 400 Bad Request');
      passed++;
    } else {
      console.error('❌ TEST 2A FAILED: Injection not rejected with 400:', resBad.status);
      failed++;
    }
  } catch (err) {
    console.error('❌ TEST 2A ERROR:', err.message);
    failed++;
  }

  // Test 2B: Legitimate creation automatically receives authenticated tenant context
  try {
    const userA = {
      id: 9991,
      email: 'fleet.manager@fi360.com',
      role: 'FLEET_MANAGER',
      tenantId: 'TEST_TENANT_ENTERPRISE',
      organizationId: 'ORG-ENTERPRISE'
    };
    const tokenA = createToken(userA);

    const resGood = await fetch('http://localhost:3000/api/v1/vehicles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        registrationNumber: testRegA,
        fleetNumber: 'FLT-SEC-01',
        vehicleClass: 'Rigid Truck'
      })
    });
    
    const created = await resGood.json();
    if (resGood.status !== 201) {
      console.error('❌ TEST 2B API FAILED:', resGood.status, created);
    }
    const dbVehicle = await prisma.vehicle.findFirst({ where: { registrationNumber: testRegA } });
    if (dbVehicle && dbVehicle.tenantId === 'TEST_TENANT_ENTERPRISE' && dbVehicle.organizationId === 'ORG-DEFAULT') {
      console.log(`✅ TEST 2B PASSED: Vehicle created with authenticated tenant=${dbVehicle.tenantId}, org=${dbVehicle.organizationId}`);
      passed++;
    } else {
      console.error('❌ TEST 2B FAILED: Vehicle did not receive authenticated tenant context!', dbVehicle);
      failed++;
    }
  } catch (err) {
    console.error('❌ TEST 2B ERROR:', err.message);
    failed++;
  }

  // Test 3A: Client cannot modify tenantId during update (Strict DTO validation rejects it)
  try {
    const userA = {
      id: 9991,
      email: 'fleet.manager@fi360.com',
      role: 'FLEET_MANAGER',
      tenantId: 'TNT-DEFAULT',
      organizationId: 'ORG-DEFAULT'
    };
    const tokenA = createToken(userA);

    const dbVehicle = await prisma.vehicle.findFirst({ where: { registrationNumber: testRegA } });
    
    const resBadUpdate = await fetch(`http://localhost:3000/api/v1/vehicles/${dbVehicle.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        tenantId: testTenantB // Malicious tenant change attempt
      })
    });
    
    if (resBadUpdate.status === 400) {
      console.log('✅ TEST 3A PASSED: Client attempt to update tenantId rejected with 400 Bad Request');
      passed++;
    } else {
      console.error('❌ TEST 3A FAILED: Update tenantId not rejected with 400:', resBadUpdate.status);
      failed++;
    }
  } catch (err) {
    console.error('❌ TEST 3A ERROR:', err.message);
    failed++;
  }

  // Test 3B: Legitimate update preserves immutable tenantId
  try {
    const userA = {
      id: 9991,
      email: 'fleet.manager@fi360.com',
      role: 'FLEET_MANAGER',
      tenantId: 'TNT-DEFAULT',
      organizationId: 'ORG-DEFAULT'
    };
    const tokenA = createToken(userA);

    const dbVehicle = await prisma.vehicle.findFirst({ where: { registrationNumber: testRegA } });
    
    const resGoodUpdate = await fetch(`http://localhost:3000/api/v1/vehicles/${dbVehicle.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        vehicleClass: 'Heavy Truck'
      })
    });
    
    const reFetched = await prisma.vehicle.findUnique({ where: { id: dbVehicle.id } });
    if (reFetched.tenantId === 'TEST_TENANT_ENTERPRISE' && reFetched.vehicleClass === 'Heavy Truck') {
      console.log('✅ TEST 3B PASSED: Normal vehicle update preserves immutable tenantId');
      passed++;
    } else {
      console.error('❌ TEST 3B FAILED: Immutable tenantId altered during update!', reFetched);
      failed++;
    }
  } catch (err) {
    console.error('❌ TEST 3B ERROR:', err.message);
    failed++;
  }

  // Test 4: Compound Uniqueness — Same registration in Tenant A and Tenant B is ALLOWED; Duplicate in SAME Tenant is REJECTED
  try {
    // 1. Create KBZ-TEST-999 in Tenant A (Tenant B already has KBZ-TEST-999)
    const vehicleA_sameReg = await prisma.vehicle.create({
      data: {
        registrationNumber: testRegB,
        tenantId: 'TNT-DEFAULT',
        organizationId: 'ORG-DEFAULT',
        vehicleClass: 'Rigid Truck'
      }
    });

    // 2. Attempt to create a 2nd KBZ-TEST-999 in Tenant A (should reject with unique constraint violation)
    let duplicateRejected = false;
    try {
      await prisma.vehicle.create({
        data: {
          registrationNumber: testRegB,
          tenantId: 'TNT-DEFAULT',
          organizationId: 'ORG-DEFAULT',
          vehicleClass: 'Rigid Truck'
        }
      });
    } catch (dbErr) {
      duplicateRejected = true;
    }

    if (vehicleA_sameReg && duplicateRejected) {
      console.log('✅ TEST 4 PASSED: Compound uniqueness [tenantId, registrationNumber] strictly enforced in DB');
      passed++;
    } else {
      console.error('❌ TEST 4 FAILED: Compound uniqueness failed!');
      failed++;
    }

    // Cleanup
    await prisma.vehicle.delete({ where: { id: vehicleA_sameReg.id } });
  } catch (err) {
    console.error('❌ TEST 4 ERROR:', err.message);
    failed++;
  }

  // Cleanup test vehicles
  await prisma.vehicle.deleteMany({
    where: { registrationNumber: { in: [testRegB, testRegA] } }
  });

  console.log('\n============================================================');
  console.log(`SECURITY TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================');

  if (failed === 0) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runSecurityTests()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
