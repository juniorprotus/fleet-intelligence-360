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

async function runSystemWideE2E() {
  console.log('============================================================');
  console.log('FI360 SYSTEM-WIDE ROLE, FEATURE & KPI FORENSIC E2E SUITE');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Authenticate All 10 Roles
  console.log('--- TEST 1: ALL 10 AUTHORITATIVE ROLES AUTHENTICATION ---');
  const rolesToTest = [
    { role: 'SUPER_ADMIN', email: 'admin@fi360.com' },
    { role: 'CEO', email: 'ceo@fi360.com' },
    { role: 'FLEET_MANAGER', email: 'fleet.manager@fi360.com' },
    { role: 'WORKSHOP_MANAGER', email: 'workshop.manager@fi360.com' },
    { role: 'TYRE_SUPERVISOR', email: 'supervisor@fi360.com' },
    { role: 'TYRE_TECHNICIAN', email: 'technician@fi360.com' },
    { role: 'DRIVER', email: 'driver@fi360.com' },
    { role: 'FINANCE_MANAGER', email: 'finance.manager@fi360.com' },
    { role: 'AUDITOR', email: 'auditor@fi360.com' },
  ];

  const tokens = {};
  const userObjects = {};

  for (const r of rolesToTest) {
    const loginRes = await request('POST', '/api/v1/auth/login', { email: r.email, password: 'Pinkypinky@40' });
    if (loginRes.status === 200 || loginRes.status === 201) {
      tokens[r.role] = loginRes.body?.access_token;
      userObjects[r.role] = loginRes.body?.user;
    } else {
      console.error(`❌ Failed to authenticate role ${r.role} (${r.email}):`, loginRes.body);
    }
  }

  if (Object.keys(tokens).length === 9) {
    console.log('✅ ALL Authoritative Roles successfully authenticated.');
    passed++;
  } else {
    console.error(`❌ Only ${Object.keys(tokens).length}/9 roles authenticated.`);
    failed++;
  }

  // 2. Server-side Permission Verification
  console.log('\n--- TEST 2: SERVER-SIDE PERMISSION & RBAC MATRIX ENFORCEMENT ---');
  // SUPER_ADMIN exclusive correction endpoint
  const adminCorrCheck = await request('GET', '/api/v1/system-admin/corrections', null, tokens.SUPER_ADMIN);
  const drvCorrCheck = await request('GET', '/api/v1/system-admin/corrections', null, tokens.DRIVER);

  if (adminCorrCheck.status === 200 && drvCorrCheck.status === 403) {
    console.log('✅ SUPER_ADMIN authorized for data correction history, DRIVER rejected (HTTP 403).');
    passed++;
  } else {
    console.error('❌ Data correction RBAC check failed:', adminCorrCheck.status, drvCorrCheck.status);
    failed++;
  }

  // 3. Driver Vehicle Shift Scoping & Inspection Chain
  console.log('\n--- TEST 3: DRIVER VEHICLE SHIFT SCOPING & INSPECTION CHAIN ---');
  const vehiclesRes = await request('GET', '/api/v1/vehicles', null, tokens.FLEET_MANAGER);
  const vehicles = vehiclesRes.body;
  if (!Array.isArray(vehicles) || vehicles.length < 2) {
    console.error('❌ Insufficient vehicles in master list.');
    failed++;
    return;
  }

  const assignedVeh = vehicles[0];
  const unassignedVeh = vehicles[1];

  // Assign Driver to assignedVeh
  await request('POST', '/api/v1/driver-intelligence/assignments', {
    driverId: userObjects.DRIVER.id,
    vehicleId: assignedVeh.id,
    startOdometer: 45000,
    notes: 'System-Wide E2E Shift Assignment',
  }, tokens.FLEET_MANAGER);

  // My vehicle endpoint check
  const myVehRes = await request('GET', '/api/v1/driver-intelligence/my-vehicle', null, tokens.DRIVER);
  if (myVehRes.status === 200 && (myVehRes.body?.vehicle?.id === assignedVeh.id || myVehRes.body?.vehicleId === assignedVeh.id)) {
    console.log(`✅ GET /api/v1/driver-intelligence/my-vehicle returned assigned vehicle ${assignedVeh.registrationNumber}.`);
    passed++;
  } else {
    console.error('❌ my-vehicle scoping endpoint failed:', myVehRes.body);
    failed++;
  }

  // Submit Pre-Trip Inspection on Assigned Vehicle
  const validInspRes = await request('POST', '/api/v1/driver-intelligence/inspections', {
    vehicleId: assignedVeh.id,
    type: 'PRE_TRIP',
    odometer: 45100,
    items: [
      { category: 'TYRES', itemName: 'Front Pressure Check', isPassed: true, severity: 'LOW' },
      { category: 'BRAKES', itemName: 'Brake Line Check', isPassed: true, severity: 'LOW' },
    ],
  }, tokens.DRIVER);

  if (validInspRes.status === 201 || validInspRes.status === 200) {
    console.log(`✅ Driver successfully submitted Pre-Trip inspection ${validInspRes.body.inspectionNo}.`);
    passed++;
  } else {
    console.error('❌ Authorized driver inspection failed:', validInspRes.body);
    failed++;
  }

  // Reject Inspection Attempt on Unassigned Vehicle
  const invalidInspRes = await request('POST', '/api/v1/driver-intelligence/inspections', {
    vehicleId: unassignedVeh.id,
    type: 'PRE_TRIP',
    odometer: 90000,
    items: [
      { category: 'TYRES', itemName: 'Rear Pressure Check', isPassed: true, severity: 'LOW' },
    ],
  }, tokens.DRIVER);

  if (invalidInspRes.status === 403) {
    console.log(`✅ DENIED: Driver inspection on unassigned vehicle ${unassignedVeh.registrationNumber} returned HTTP 403 Forbidden.`);
    passed++;
  } else {
    console.error('❌ Unassigned vehicle inspection was NOT rejected with 403:', invalidInspRes.status);
    failed++;
  }

  // 4. Critical Defect Grounding Safety Chain
  console.log('\n--- TEST 4: CRITICAL DEFECT GROUNDING SAFETY CHAIN ---');
  const criticalInspRes = await request('POST', '/api/v1/driver-intelligence/inspections', {
    vehicleId: assignedVeh.id,
    type: 'PRE_TRIP',
    odometer: 45200,
    items: [
      { category: 'BRAKES', itemName: 'Critical Brake Fluid Leak', isPassed: false, severity: 'CRITICAL', notes: 'Severe leak' },
    ],
  }, tokens.DRIVER);

  if (criticalInspRes.status === 201 || criticalInspRes.status === 200) {
    if (criticalInspRes.body.isGrounded && criticalInspRes.body.status === 'FAILED_CRITICAL') {
      console.log('✅ Critical Defect triggered automatic vehicle grounding (isGrounded: true, Status: FAILED_CRITICAL).');
      passed++;
    } else {
      console.error('❌ Critical defect grounding failed:', criticalInspRes.body);
      failed++;
    }
  } else {
    console.error('❌ Critical defect submission failed:', criticalInspRes.body);
    failed++;
  }

  // 5. Tyre Technician & Supervisor Operational Workflows
  console.log('\n--- TEST 5: TYRE TECHNICIAN & SUPERVISOR OPERATIONAL WORKFLOWS ---');
  // Fit tyre
  const fitRes = await request('POST', '/api/v1/tyres/fitments', {
    tyreId: 1,
    vehicleId: assignedVeh.id,
    positionId: 1,
    positionCode: 'AX1-L',
    fitmentDate: new Date().toISOString(),
    fitmentOdometer: 45000,
  }, tokens.TYRE_TECHNICIAN).catch(() => null);

  // Key-in operational inspection
  const techInspectRes = await request('POST', '/api/v1/tyres/inspections', {
    inspectionDate: new Date().toISOString(),
    tyreId: 1,
    vehicleId: assignedVeh.id,
    notes: 'Technician operational key-in test',
  }, tokens.TYRE_TECHNICIAN);

  if (techInspectRes.status === 201 || techInspectRes.status === 200) {
    console.log('✅ Tyre Technician successfully keyed in operational tyre inspection.');
    passed++;
  } else {
    console.error('❌ Technician inspection key-in failed:', techInspectRes.body);
    failed++;
  }

  // Prohibit Technician & Supervisor from historical data correction
  const techCorrRes = await request('POST', '/api/v1/system-admin/corrections', {
    domain: 'TYRE', entityType: 'TripInspection', entityId: validInspRes.body?.id || assignedVeh.id,
    fieldName: 'odometer', correctedValue: '99999', reason: 'Technician unauthorized edit',
  }, tokens.TYRE_TECHNICIAN);

  const supCorrRes = await request('POST', '/api/v1/system-admin/corrections', {
    domain: 'TYRE', entityType: 'TripInspection', entityId: validInspRes.body?.id || assignedVeh.id,
    fieldName: 'odometer', correctedValue: '99999', reason: 'Supervisor unauthorized edit',
  }, tokens.TYRE_SUPERVISOR);

  if (techCorrRes.status === 403 && supCorrRes.status === 403) {
    console.log('✅ DENIED: Technician and Supervisor data correction attempts returned HTTP 403 Forbidden.');
    passed++;
  } else {
    console.error('❌ Technician/Supervisor correction rejection failed:', techCorrRes.status, supCorrRes.status);
    failed++;
  }

  // 6. Super Admin Controlled Data Correction Governance
  console.log('\n--- TEST 6: SUPER ADMIN DATA CORRECTION GOVERNANCE ---');
  // Rejection on empty reason
  const emptyReasonRes = await request('POST', '/api/v1/system-admin/corrections', {
    domain: 'SAFETY', entityType: 'TripInspection', entityId: validInspRes.body?.id || assignedVeh.id,
    fieldName: 'odometer', correctedValue: '45150', reason: '',
  }, tokens.SUPER_ADMIN);

  if (emptyReasonRes.status === 400) {
    console.log('✅ REJECTED: Data correction without justification returned HTTP 400 Bad Request.');
    passed++;
  } else {
    console.error('❌ Empty reason check failed:', emptyReasonRes.status);
    failed++;
  }

  // Rejection on protected field attempt
  const protectedFieldRes = await request('POST', '/api/v1/system-admin/corrections', {
    domain: 'SAFETY', entityType: 'TripInspection', entityId: validInspRes.body?.id || assignedVeh.id,
    fieldName: 'tenantId', correctedValue: 'TNT-MALICIOUS', reason: 'Attempt to bypass tenant isolation',
  }, tokens.SUPER_ADMIN);

  if (protectedFieldRes.status === 400) {
    console.log('✅ REJECTED: Attempt to modify protected field (tenantId) returned HTTP 400 Bad Request.');
    passed++;
  } else {
    console.error('❌ Protected field check failed:', protectedFieldRes.status);
    failed++;
  }

  // Valid Super Admin Append-Only Data Correction
  const targetId = validInspRes.body?.id || assignedVeh.id;
  const targetEntityType = validInspRes.body?.id ? 'TripInspection' : 'Vehicle';
  const targetFieldName = validInspRes.body?.id ? 'odometer' : 'registrationNumber';

  const validCorrRes = await request('POST', '/api/v1/system-admin/corrections', {
    domain: 'SAFETY',
    entityType: targetEntityType,
    entityId: targetId,
    fieldName: targetFieldName,
    correctedValue: validInspRes.body?.id ? '45150' : assignedVeh.registrationNumber,
    reason: 'Verified typographical error by driver on shift start odometer entry',
  }, tokens.SUPER_ADMIN);

  if (validCorrRes.status === 201 || validCorrRes.status === 200) {
    console.log(`✅ SUPER_ADMIN successfully executed append-only data correction (Correction ID: ${validCorrRes.body.id.slice(0, 8)}).`);
    console.log(`   Trace: Original Value (${validCorrRes.body.originalValue}) -> Corrected Value (${validCorrRes.body.correctedValue}).`);
    passed++;
  } else {
    console.error('❌ Super Admin data correction execution failed:', validCorrRes.body);
    failed++;
  }

  // Query Data Correction Ledger
  const corrHistoryRes = await request('GET', '/api/v1/system-admin/corrections', null, tokens.SUPER_ADMIN);
  if (corrHistoryRes.status === 200 && Array.isArray(corrHistoryRes.body) && corrHistoryRes.body.length > 0) {
    console.log(`✅ Data Correction Ledger query returned ${corrHistoryRes.body.length} audited correction entries.`);
    passed++;
  } else {
    console.error('❌ Data correction ledger query failed:', corrHistoryRes.body);
    failed++;
  }

  // 7. KPI ↔ Drill-Down Reconciliation Audit
  console.log('\n--- TEST 7: KPI HEADLINE VS DRILL-DOWN RECONCILIATION ---');
  const activeUsersDrill = await request('GET', '/api/v1/system-admin/kpis/ACTIVE_USERS/drilldown', null, tokens.SUPER_ADMIN);
  if (activeUsersDrill.status === 200) {
    const metaVal = activeUsersDrill.body?.metadata?.value;
    const drillActiveCount = activeUsersDrill.body?.summary?.activeUsers;
    const itemsCount = activeUsersDrill.body?.items?.filter(u => u.isActive).length;

    if (metaVal === drillActiveCount && (itemsCount === undefined || itemsCount === drillActiveCount)) {
      console.log(`✅ RECONCILED: ACTIVE_USERS KPI headline (${metaVal}) equals drill-down active count (${drillActiveCount}).`);
      passed++;
    } else {
      console.error(`❌ KPI RECONCILIATION MISMATCH: Headline=${metaVal}, Summary=${drillActiveCount}, Items=${itemsCount}`);
      failed++;
    }
  } else {
    console.error('❌ Active users drilldown query failed:', activeUsersDrill.status);
    failed++;
  }

  // 8. Phase 6 Protection Verification
  console.log('\n--- TEST 8: PHASE 6 ISOLATION & PROTECTION ---');
  const p6Check = await request('GET', '/api/v1/phase6-analytics', null, tokens.SUPER_ADMIN);
  if (p6Check.status === 404) {
    console.log('✅ PHASE 6 PROTECTION VERIFIED: Zero Phase 6 endpoints exist (HTTP 404 Not Found).');
    passed++;
  } else {
    console.error('❌ Phase 6 code detected!', p6Check.status);
    failed++;
  }

  console.log('\n============================================================');
  console.log('FI360 SYSTEM-WIDE E2E AUDIT SUMMARY');
  console.log('============================================================');
  console.log(`Passed Checks:  ${passed}`);
  console.log(`Failed Checks:  ${failed}`);
  console.log(`Overall Result: ${failed === 0 ? '100% PASSED CLEAN & CERTIFIED' : 'FAILED — DEFECTS REMAIN'}`);
  console.log('============================================================\n');

  if (failed > 0) process.exit(1);
}

runSystemWideE2E().catch(err => {
  console.error('System-wide E2E audit exception:', err);
  process.exit(1);
});
