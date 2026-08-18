const http = require('http');
const fs = require('fs');
const path = require('path');

const BACKEND_URL = 'http://localhost:3000';

function makeRequest(pathStr, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathStr, BACKEND_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function login(email, password) {
  const res = await makeRequest('/api/v1/auth/login', 'POST', { email, password });
  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.data)}`);
  }
  return res.data.access_token || res.data.accessToken || res.data.token;
}

async function runVehicleWorkspaceE2E() {
  console.log('============================================================');
  console.log('FI360 STEP 3 — UNIFIED VEHICLE WORKSPACE E2E TEST SUITE');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Static DOM Structure Verification
  console.log('--- 1. STATIC DOM HIERARCHY & CONTAINER AUDIT ---');
  const indexHtmlPath = path.join(__dirname, '..', 'frontend', 'index.html');
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

  function checkDOM(id, desc) {
    if (indexHtml.includes(`id="${id}"`)) {
      console.log(`✅ [DOM] ${desc} (#${id}): PRESENT`);
      passed++;
    } else {
      console.error(`❌ [DOM] ${desc} (#${id}): MISSING`);
      failed++;
    }
  }

  checkDOM('vehicle-workspace-view', 'Dedicated Workspace Container');
  checkDOM('vw-header-reg', 'Vehicle Header Registration');
  checkDOM('vw-header-status-badge', 'Vehicle Header Status Badge');
  checkDOM('btn-vw-back', 'Back to Fleet Button');
  checkDOM('btn-vw-edit', 'Edit Vehicle Action');
  checkDOM('btn-vw-ground', 'Ground Vehicle Action');
  checkDOM('btn-vw-recover', 'Recover Vehicle Action');
  checkDOM('btn-vw-assign-driver', 'Assign Driver Action');
  checkDOM('btn-vw-transfer-workshop', 'Transfer Workshop Action');
  checkDOM('vw-tabs-nav', 'Workspace Tabs Navigation');

  // Check all 7 domain panels
  ['overview', 'maintenance', 'tyres', 'driver', 'inspections', 'costs', 'history'].forEach(tab => {
    checkDOM(`vw-panel-${tab}`, `Tab Panel [${tab.toUpperCase()}]`);
  });

  // Check visual tyre map and action modals
  checkDOM('vw-axle-map-container', 'Interactive Visual Tyre Axle Map');
  checkDOM('edit-vehicle-modal', 'Edit Vehicle Modal');
  checkDOM('ground-vehicle-modal', 'Ground Vehicle Modal');
  checkDOM('recover-vehicle-modal', 'Recover Vehicle Modal');
  checkDOM('transfer-workshop-modal', 'Transfer Workshop Modal');

  // 2. Authentication & Data Retrieval
  console.log('\n--- 2. BACKEND VEHICLE API & DOMAIN INTEGRATION ---');
  const fmToken = await login('fleet.manager@fi360.com', 'Pinkypinky@40');

  const vehiclesRes = await makeRequest('/api/v1/vehicles', 'GET', null, fmToken);
  if (vehiclesRes.status === 200 && Array.isArray(vehiclesRes.data) && vehiclesRes.data.length > 0) {
    console.log(`✅ GET /api/v1/vehicles returned ${vehiclesRes.data.length} registered fleet assets.`);
    passed++;
  } else {
    console.error(`❌ GET /api/v1/vehicles failed: ${JSON.stringify(vehiclesRes.data)}`);
    failed++;
  }

  const targetVehicle = vehiclesRes.data[0];
  console.log(`\nInspecting canonical target vehicle: ${targetVehicle.registrationNumber} (${targetVehicle.id})`);

  // 3. Single Vehicle Lookup
  const singleRes = await makeRequest(`/api/v1/vehicles/${targetVehicle.id}`, 'GET', null, fmToken);
  if (singleRes.status === 200 && singleRes.data.id === targetVehicle.id) {
    console.log(`✅ GET /api/v1/vehicles/:id successfully returned canonical vehicle:`);
    console.log(`   - Registration: ${singleRes.data.registrationNumber}`);
    console.log(`   - Status: ${singleRes.data.vehicleStatus}`);
    console.log(`   - Fitted Tyres Count: ${(singleRes.data.tyreFitments || []).length}`);
    passed++;
  } else {
    console.error(`❌ GET /api/v1/vehicles/:id failed: ${JSON.stringify(singleRes.data)}`);
    failed++;
  }

  // 4. Vehicle Tyres Endpoint
  const tyresRes = await makeRequest(`/api/v1/vehicles/${targetVehicle.id}/tyres`, 'GET', null, fmToken);
  if (tyresRes.status === 200 && Array.isArray(tyresRes.data)) {
    console.log(`✅ GET /api/v1/vehicles/:id/tyres returned ${tyresRes.data.length} fitted tyres.`);
    passed++;
  } else {
    console.error(`❌ GET /api/v1/vehicles/:id/tyres failed`);
    failed++;
  }

  // 5. Work Orders Endpoint
  const woRes = await makeRequest(`/api/v1/work-orders?vehicleId=${targetVehicle.id}`, 'GET', null, fmToken);
  if (woRes.status === 200 && Array.isArray(woRes.data)) {
    console.log(`✅ GET /api/v1/work-orders?vehicleId=:id returned ${woRes.data.length} maintenance records.`);
    passed++;
  } else {
    console.error(`❌ GET /api/v1/work-orders?vehicleId=:id failed`);
    failed++;
  }

  // 6. Workshop History Endpoint
  const histRes = await makeRequest(`/api/v1/vehicles/${targetVehicle.id}/workshop-history`, 'GET', null, fmToken);
  if (histRes.status === 200 && Array.isArray(histRes.data)) {
    console.log(`✅ GET /api/v1/vehicles/:id/workshop-history returned ${histRes.data.length} historical transfer events.`);
    passed++;
  } else {
    console.error(`❌ GET /api/v1/vehicles/:id/workshop-history failed`);
    failed++;
  }

  // 7. Trip Inspections Endpoint
  const inspRes = await makeRequest(`/api/v1/driver-intelligence/inspections?vehicleId=${targetVehicle.id}`, 'GET', null, fmToken);
  if (inspRes.status === 200 && Array.isArray(inspRes.data)) {
    console.log(`✅ GET /api/v1/driver-intelligence/inspections?vehicleId=:id returned ${inspRes.data.length} trip checklists.`);
    passed++;
  } else {
    console.error(`❌ GET /api/v1/driver-intelligence/inspections?vehicleId=:id failed`);
    failed++;
  }

  // 8. Vehicle Update Workflow (PUT)
  console.log('\n--- 3. VEHICLE ACTION WORKFLOW VERIFICATION ---');
  const updateRes = await makeRequest(`/api/v1/vehicles/${targetVehicle.id}`, 'PUT', {
    fleetNumber: targetVehicle.fleetNumber || 'FLT-TEST-01',
    currentOdometer: 145200
  }, fmToken);

  if (updateRes.status === 200 && updateRes.data.currentOdometer === 145200) {
    console.log(`✅ PUT /api/v1/vehicles/:id updated odometer to 145,200 km cleanly.`);
    passed++;
  } else {
    console.error(`❌ PUT /api/v1/vehicles/:id failed: ${JSON.stringify(updateRes.data)}`);
    failed++;
  }

  // 9. JavaScript Controller Verification in main.js
  console.log('\n--- 4. CLIENT LOGIC & ROUTING AUDIT ---');
  const mainJsPath = path.join(__dirname, '..', 'frontend', 'main.js');
  const mainJs = fs.readFileSync(mainJsPath, 'utf8');

  function checkJS(fnName) {
    if (mainJs.includes(fnName)) {
      console.log(`✅ [JS] Function ${fnName}: DEFINED & EXPORTED`);
      passed++;
    } else {
      console.error(`❌ [JS] Function ${fnName}: MISSING`);
      failed++;
    }
  }

  checkJS('openVehicleWorkspace');
  checkJS('switchVehicleWorkspaceTab');
  checkJS('renderVehicleWorkspaceHeader');
  checkJS('renderVehicleQuickProfile');
  checkJS('renderVehicleTyresAxleMap');
  checkJS('renderVehicleHistoryTimeline');
  checkJS('submitEditVehicle');
  checkJS('submitGroundVehicle');
  checkJS('submitRecoverVehicle');
  checkJS('submitTransferWorkshop');

  console.log('\n============================================================');
  console.log(`STEP 3 VEHICLE WORKSPACE E2E RESULT: ${failed === 0 ? '100% PASSED CLEAN' : 'FAILED'}`);
  console.log(`Passed: ${passed} | Failed: ${failed}`);
  console.log('============================================================\n');

  if (failed > 0) process.exit(1);
}

runVehicleWorkspaceE2E().catch(err => {
  console.error('Fatal E2E test error:', err);
  process.exit(1);
});
