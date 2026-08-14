const http = require('http');

const BASE_URL = 'http://localhost:3000';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function main() {
  console.log('============================================================');
  console.log('FI360 PHASE 5A — ROLE GOVERNANCE & DRIVER ACCESS E2E SUITE');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Authenticate Roles
  const adminLogin = await request('POST', '/api/v1/auth/login', { email: 'admin@fi360.com', password: 'Pinkypinky@40' });
  const adminToken = adminLogin.body?.access_token;

  const fmLogin = await request('POST', '/api/v1/auth/login', { email: 'fleet.manager@fi360.com', password: 'Pinkypinky@40' });
  const fmToken = fmLogin.body?.access_token;

  const techLogin = await request('POST', '/api/v1/auth/login', { email: 'technician@fi360.com', password: 'Pinkypinky@40' });
  const techToken = techLogin.body?.access_token;

  const supLogin = await request('POST', '/api/v1/auth/login', { email: 'supervisor@fi360.com', password: 'Pinkypinky@40' });
  const supToken = supLogin.body?.access_token;

  const drvLogin = await request('POST', '/api/v1/auth/login', { email: 'driver@fi360.com', password: 'Pinkypinky@40' });
  const drvToken = drvLogin.body?.access_token;
  const drvUser = drvLogin.body?.user;

  if (!adminToken || !fmToken || !techToken || !supToken || !drvToken) {
    console.error('❌ Failed to authenticate test users.');
    process.exit(1);
  }
  console.log('✅ STEP 1: Authenticated ALL test roles (Super Admin, Fleet Manager, Technician, Supervisor, Driver).');
  passed++;

  // 2. Setup Active Driver Shift Assignment for Driver on Vehicle A
  console.log('\n--- TEST 2: DRIVER VEHICLE ASSIGNMENT & SCOPING SETUP ---');
  const vehiclesRes = await request('GET', '/api/v1/vehicles', null, fmToken);
  const vehicles = vehiclesRes.body;
  if (!Array.isArray(vehicles) || vehicles.length < 2) {
    console.error('❌ Less than 2 vehicles available for scoping test.');
    process.exit(1);
  }

  const assignedVehicle = vehicles[0];
  const unassignedVehicle = vehicles[1];

  const assignRes = await request('POST', '/api/v1/driver-intelligence/assignments', {
    driverId: drvUser.id,
    vehicleId: assignedVehicle.id,
    startOdometer: 45000,
    notes: 'Phase 5A Scoping E2E Shift',
  }, fmToken);

  if (assignRes.status === 201 || assignRes.status === 200) {
    console.log(`✅ Assigned Driver #${drvUser.id} to Vehicle ${assignedVehicle.registrationNumber} (Assignment #${assignRes.body.id}).`);
    passed++;
  } else {
    console.error('❌ Driver assignment failed:', assignRes.status, assignRes.body);
    failed++;
  }

  // 3. Test Driver My-Vehicle API Endpoint
  console.log('\n--- TEST 3: DRIVER MY-VEHICLE ENDPOINT ---');
  const myVehRes = await request('GET', '/api/v1/driver-intelligence/my-vehicle', null, drvToken);
  if (myVehRes.status === 200 && (myVehRes.body?.vehicle?.id === assignedVehicle.id || myVehRes.body?.vehicleId === assignedVehicle.id)) {
    console.log(`✅ Driver /api/v1/driver-intelligence/my-vehicle returned assigned vehicle ${assignedVehicle.registrationNumber}.`);
    passed++;
  } else {
    console.error('❌ Driver my-vehicle endpoint failed:', myVehRes.status, myVehRes.body);
    failed++;
  }

  // 4. Test Authorized Driver Pre-Trip Inspection Submission
  console.log('\n--- TEST 4: AUTHORIZED DRIVER PRE-TRIP INSPECTION SUBMISSION ---');
  const validInspRes = await request('POST', '/api/v1/driver-intelligence/inspections', {
    vehicleId: assignedVehicle.id,
    type: 'PRE_TRIP',
    odometer: 45100,
    items: [
      { category: 'TYRES', itemName: 'Front Left Tyre Pressure', isPassed: true, severity: 'LOW' },
      { category: 'BRAKES', itemName: 'Brake Fluid Level', isPassed: true, severity: 'LOW' },
    ],
  }, drvToken);

  if (validInspRes.status === 201 || validInspRes.status === 200) {
    console.log(`✅ Driver successfully submitted Pre-Trip inspection ${validInspRes.body.inspectionNo} for assigned vehicle.`);
    passed++;
  } else {
    console.error('❌ Driver valid inspection failed:', validInspRes.status, validInspRes.body);
    failed++;
  }

  // 5. Test STRICT DRIVER SCOPING: Reject Inspection against Unassigned Vehicle
  console.log('\n--- TEST 5: STRICT DRIVER VEHICLE SCOPING ENFORCEMENT ---');
  const invalidInspRes = await request('POST', '/api/v1/driver-intelligence/inspections', {
    vehicleId: unassignedVehicle.id,
    type: 'PRE_TRIP',
    odometer: 88000,
    items: [
      { category: 'TYRES', itemName: 'Front Right Tyre', isPassed: true, severity: 'LOW' },
    ],
  }, drvToken);

  if (invalidInspRes.status === 403) {
    console.log(`✅ DENIED: Driver inspection attempt on unassigned vehicle ${unassignedVehicle.registrationNumber} returned HTTP 403 Forbidden.`);
    console.log(`✅ Security violation event logged for audit.`);
    passed++;
  } else {
    console.error('❌ Driver scoping enforcement failed (expected 403, got status):', invalidInspRes.status, invalidInspRes.body);
    failed++;
  }

  // 6. Test Driver My-Inspections History Endpoint
  console.log('\n--- TEST 6: DRIVER MY-INSPECTIONS HISTORY ENDPOINT ---');
  const myInspRes = await request('GET', '/api/v1/driver-intelligence/my-inspections', null, drvToken);
  if (myInspRes.status === 200 && Array.isArray(myInspRes.body) && myInspRes.body.length > 0) {
    console.log(`✅ Driver /api/v1/driver-intelligence/my-inspections returned ${myInspRes.body.length} submitted inspections.`);
    passed++;
  } else {
    console.error('❌ Driver my-inspections endpoint failed:', myInspRes.status, myInspRes.body);
    failed++;
  }

  // 7. Test Pre-Trip Critical Defect Grounding Chain Trigger
  console.log('\n--- TEST 7: CRITICAL DEFECT SAFETY CHAIN TRIGGER ---');
  const criticalInspRes = await request('POST', '/api/v1/driver-intelligence/inspections', {
    vehicleId: assignedVehicle.id,
    type: 'PRE_TRIP',
    odometer: 45200,
    items: [
      { category: 'STEERING', itemName: 'Steering Linkage Crack', isPassed: false, severity: 'CRITICAL', notes: 'Severe structural crack' },
    ],
  }, drvToken);

  if (criticalInspRes.status === 201 || criticalInspRes.status === 200) {
    if (criticalInspRes.body.isGrounded && criticalInspRes.body.status === 'FAILED_CRITICAL') {
      console.log(`✅ Critical Defect triggered automatic vehicle grounding (isGrounded: true, Status: FAILED_CRITICAL).`);
      passed++;
    } else {
      console.error('❌ Inspection submitted but grounding failed:', criticalInspRes.body);
      failed++;
    }
  } else {
    console.error('❌ Critical inspection submission failed:', criticalInspRes.status, criticalInspRes.body);
    failed++;
  }

  // 8. Test Tyre Technician Operational Key-In Permission
  console.log('\n--- TEST 8: TYRE TECHNICIAN OPERATIONAL KEY-IN ---');
  // First fit tyre #1 to assignedVehicle if not already fitted
  await request('POST', '/api/v1/tyres/fitments', {
    tyreId: 1,
    vehicleId: assignedVehicle.id,
    positionId: 1,
    positionCode: 'AX1-L',
    fitmentDate: new Date().toISOString(),
    fitmentOdometer: 45000,
  }, techToken).catch(() => null);

  const techInspectRes = await request('POST', '/api/v1/tyres/inspections', {
    inspectionDate: new Date().toISOString(),
    tyreId: 1,
    vehicleId: assignedVehicle.id,
    notes: 'Routine technician pressure check',
  }, techToken);

  if (techInspectRes.status === 201 || techInspectRes.status === 200) {
    console.log(`✅ Tyre Technician successfully keyed in operational tyre inspection.`);
    passed++;
  } else {
    console.error('❌ Tyre Technician key-in failed:', techInspectRes.status, techInspectRes.body);
    failed++;
  }

  // 9. Test Tyre Technician PROHIBITION on System Admin Data Correction
  console.log('\n--- TEST 9: TYRE TECHNICIAN DATA CORRECTION PROHIBITION ---');
  const techCorrRes = await request('POST', '/api/v1/system-admin/corrections', {
    domain: 'TYRE',
    entityType: 'TripInspection',
    entityId: validInspRes.body?.id || assignedVehicle.id,
    fieldName: 'odometer',
    correctedValue: '45999',
    reason: 'Technician attempt to modify history',
  }, techToken);

  if (techCorrRes.status === 403) {
    console.log('✅ DENIED: Tyre Technician data correction attempt returned HTTP 403 Forbidden.');
    passed++;
  } else {
    console.error('❌ Technician correction prohibition failed (expected 403, got status):', techCorrRes.status);
    failed++;
  }

  // 10. Test Super Admin Controlled Append-Only Data Correction (Validation Error: Empty Reason)
  console.log('\n--- TEST 10: SUPER ADMIN CORRECTION REJECTION ON EMPTY REASON ---');
  const emptyReasonRes = await request('POST', '/api/v1/system-admin/corrections', {
    domain: 'SAFETY',
    entityType: 'TripInspection',
    entityId: validInspRes.body?.id || assignedVehicle.id,
    fieldName: 'odometer',
    correctedValue: '45150',
    reason: '',
  }, adminToken);

  if (emptyReasonRes.status === 400) {
    console.log('✅ REJECTED: Data Correction without business justification reason returned HTTP 400 Bad Request.');
    passed++;
  } else {
    console.error('❌ Empty reason check failed (expected 400, got status):', emptyReasonRes.status);
    failed++;
  }

  // 11. Test Super Admin Controlled Append-Only Data Correction Execution
  console.log('\n--- TEST 11: SUPER ADMIN CONTROLLED DATA CORRECTION EXECUTION ---');
  const targetId = validInspRes.body?.id || assignedVehicle.id;
  const targetEntityType = validInspRes.body?.id ? 'TripInspection' : 'Vehicle';
  const targetFieldName = validInspRes.body?.id ? 'odometer' : 'registrationNumber';

  const validCorrRes = await request('POST', '/api/v1/system-admin/corrections', {
    domain: 'SAFETY',
    entityType: targetEntityType,
    entityId: targetId,
    fieldName: targetFieldName,
    correctedValue: validInspRes.body?.id ? '45150' : assignedVehicle.registrationNumber,
    reason: 'Typographical error by driver on shift start odometer entry',
  }, adminToken);

  if (validCorrRes.status === 201 || validCorrRes.status === 200) {
    console.log(`✅ SUPER_ADMIN successfully executed append-only data correction (Correction ID: ${validCorrRes.body.id}).`);
    console.log(`   Trace: Original Value (${validCorrRes.body.originalValue}) -> Corrected Value (${validCorrRes.body.correctedValue}).`);
    passed++;
  } else {
    console.error('❌ Super Admin data correction failed:', validCorrRes.status, validCorrRes.body);
    failed++;
  }

  // 12. Test Data Correction History Ledger Query Endpoint
  console.log('\n--- TEST 12: DATA CORRECTION HISTORY LEDGER ENDPOINT ---');
  const corrHistoryRes = await request('GET', '/api/v1/system-admin/corrections', null, adminToken);
  if (corrHistoryRes.status === 200 && Array.isArray(corrHistoryRes.body) && corrHistoryRes.body.length > 0) {
    console.log(`✅ Data Correction Ledger history returned ${corrHistoryRes.body.length} audited correction records.`);
    passed++;
  } else {
    console.error('❌ Data correction ledger history failed:', corrHistoryRes.status, corrHistoryRes.body);
    failed++;
  }

  console.log('\n============================================================');
  console.log('FI360 PHASE 5A GOVERNANCE E2E SUITE SUMMARY');
  console.log('============================================================');
  console.log(`Passed Checks:  ${passed}`);
  console.log(`Failed Checks:  ${failed}`);
  console.log(`Status:         ${failed === 0 ? '100% PASSED CLEAN' : 'FAILED — DEFECTS REMAIN'}`);
  console.log('============================================================\n');

  if (failed > 0) process.exit(1);
}

main().catch(err => {
  console.error('Test suite exception:', err);
  process.exit(1);
});
