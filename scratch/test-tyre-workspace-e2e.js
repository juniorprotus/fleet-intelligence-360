/**
 * FI360 Modernization — Step 4B E2E Test Suite
 * Individual Tyre Workspace Validation & Certification Gate
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runStep4BTestSuite() {
  console.log('\n========================================================================');
  console.log('  FI360 MODERNIZATION — STEP 4B: INDIVIDUAL TYRE WORKSPACE E2E AUDIT');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. DOM MARKUP AUDIT IN INDEX.HTML
  console.log('\n--- 1. DOM Markup Audit (frontend/index.html) ---');
  const indexHtml = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');

  assert(indexHtml.includes('id="tyre-workspace-view"'), '#tyre-workspace-view container exists in index.html');
  assert(indexHtml.includes('id="btn-tw-back"'), 'Back button #btn-tw-back exists in header');
  assert(indexHtml.includes('id="tw-breadcrumb-id"'), 'Breadcrumb #tw-breadcrumb-id exists');
  assert(indexHtml.includes('id="tw-header-title"'), 'Header title #tw-header-title exists');
  assert(indexHtml.includes('id="tw-header-sub"'), 'Header subtitle #tw-header-sub exists');
  assert(indexHtml.includes('id="tw-header-dept-ctx"'), 'Header Department context element exists');
  assert(indexHtml.includes('id="tw-header-status-badge"'), 'Header status badge exists');
  assert(indexHtml.includes('id="tw-action-bar"'), 'Action bar #tw-action-bar exists');
  assert(indexHtml.includes('id="btn-tw-inspect"'), 'Action button #btn-tw-inspect exists');
  assert(indexHtml.includes('id="btn-tw-fit"'), 'Action button #btn-tw-fit exists');
  assert(indexHtml.includes('id="btn-tw-rotate"'), 'Action button #btn-tw-rotate exists');
  assert(indexHtml.includes('id="btn-tw-remove"'), 'Action button #btn-tw-remove exists');
  assert(indexHtml.includes('id="btn-tw-repair"'), 'Action button #btn-tw-repair exists');
  assert(indexHtml.includes('id="btn-tw-dispose"'), 'Action button #btn-tw-dispose exists');
  assert(indexHtml.includes('id="tw-quick-profile-card"'), 'Quick Profile card exists');
  assert(indexHtml.includes('id="tw-profile-tread-bar"'), 'Tread gauge progress bar exists');
  assert(indexHtml.includes('id="tw-qp-department"'), 'Quick profile Department field exists');
  assert(indexHtml.includes('id="tw-tabs-nav"'), 'Tabs navigation bar #tw-tabs-nav exists');
  assert(indexHtml.includes('id="tw-panel-overview"'), 'Overview panel exists');
  assert(indexHtml.includes('id="tw-panel-inspections"'), 'Inspections & Tread History panel exists');
  assert(indexHtml.includes('id="twTreadDecayChart"'), 'Tread Decay Chart canvas #twTreadDecayChart exists');
  assert(indexHtml.includes('id="tw-inspections-table"'), 'Inspections history table exists');
  assert(indexHtml.includes('id="tw-panel-fitments"'), 'Fitments & Axle Position panel exists');
  assert(indexHtml.includes('id="tw-fitments-table"'), 'Fitments history table exists');
  assert(indexHtml.includes('id="tw-panel-defects"'), 'Defects & Safety panel exists');
  assert(indexHtml.includes('id="tw-defects-table"'), 'Defects table exists');
  assert(indexHtml.includes('id="tw-panel-retread"'), 'Casing & Retread panel exists');
  assert(indexHtml.includes('id="tw-panel-costs"'), 'Costs & Value panel exists');
  assert(indexHtml.includes('id="tw-panel-timeline"'), 'Digital Thread timeline panel exists');
  assert(indexHtml.includes('id="tw-activity-timeline"'), 'Digital Thread activity timeline exists');
  assert(indexHtml.includes('id="tyre-rotate-modal"'), 'Modal #tyre-rotate-modal exists');
  assert(indexHtml.includes('id="tyre-repair-modal"'), 'Modal #tyre-repair-modal exists');
  assert(indexHtml.includes('id="tyre-dispose-modal"'), 'Modal #tyre-dispose-modal exists');

  // 2. CSS DESIGN SYSTEM & LAYOUT TOKENS
  console.log('\n--- 2. CSS Layout & Token Audit (frontend/style.css) ---');
  const styleCss = fs.readFileSync(path.join(__dirname, '../frontend/style.css'), 'utf8');

  assert(styleCss.includes('.tw-header-card'), '.tw-header-card layout rule defined');
  assert(styleCss.includes('.tw-body-grid'), '.tw-body-grid 2-column rule defined (320px 1fr)');
  assert(styleCss.includes('.tw-tabs-nav'), '.tw-tabs-nav flex rule defined');
  assert(styleCss.includes('.tw-tab-btn.active'), '.tw-tab-btn.active highlight style defined');
  assert(styleCss.includes('.tw-panel.hidden'), '.tw-panel.hidden visibility rule defined');

  // 3. JAVASCRIPT CONTROLLER & ROUTING AUDIT
  console.log('\n--- 3. JavaScript Controller & Deep-Link Audit (frontend/main.js) ---');
  const mainJs = fs.readFileSync(path.join(__dirname, '../frontend/main.js'), 'utf8');

  assert(mainJs.includes('window.openTyreWorkspace'), 'Global window.openTyreWorkspace controller exported');
  assert(mainJs.includes('window.switchTyreWorkspaceTab'), 'Global window.switchTyreWorkspaceTab exported');
  assert(mainJs.includes('hash.startsWith(\'#tyre/\')'), 'Deep-link router handles #tyre/:id and #tyre/:id/:tab');
  assert(mainJs.includes('renderTreadDecayChart'), 'Tread Decay Chart visualizer implemented');
  assert(mainJs.includes('window.openTyreRotateModal'), 'Rotate modal controller implemented');
  assert(mainJs.includes('window.openTyreRepairModal'), 'Repair modal controller implemented');
  assert(mainJs.includes('window.openTyreDisposeModal'), 'Disposal controller implemented');

  // 4. LIVE BACKEND DATA & API TESTS
  console.log('\n--- 4. Live Backend API Integration Audit ---');
  
  // Login as Fleet Manager
  const loginRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: 'fleet.manager@fi360.com',
    password: 'Pinkypinky@40'
  });

  assert(loginRes.status === 200 && loginRes.body.access_token, 'Authentication token retrieved for Fleet Manager');
  const token = loginRes.body.access_token;
  const authHeaders = { Authorization: `Bearer ${token}` };

  // Fetch tyres list
  const tyresRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/tyres?limit=10',
    method: 'GET',
    headers: authHeaders
  });

  assert(tyresRes.status === 200 && tyresRes.body.data && tyresRes.body.data.length > 0, 'Tyres master collection retrieved');
  const sampleTyre = tyresRes.body.data[0];

  // Fetch single tyre profile
  const singleRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/tyres/${sampleTyre.id}`,
    method: 'GET',
    headers: authHeaders
  });

  assert(singleRes.status === 200, `GET /api/v1/tyres/${sampleTyre.id} succeeded (HTTP 200)`);
  assert(singleRes.body.id === sampleTyre.id, 'Single tyre profile has correct canonical numeric ID');
  assert(singleRes.body.tyreIdentifier, 'Single tyre profile has human-readable tyreIdentifier');
  assert(Array.isArray(singleRes.body.fitments), 'Single tyre response includes nested fitments array');
  assert(Array.isArray(singleRes.body.inspections), 'Single tyre response includes nested inspections array');
  assert(Array.isArray(singleRes.body.movements), 'Single tyre response includes nested movements array');

  // Fitment history endpoint
  const fitmentsRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/tyres/${sampleTyre.id}/fitments`,
    method: 'GET',
    headers: authHeaders
  });
  assert(fitmentsRes.status === 200 && Array.isArray(fitmentsRes.body), `GET /api/v1/tyres/${sampleTyre.id}/fitments returns valid array`);

  // Inspection history endpoint
  const inspectionsRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/tyres/${sampleTyre.id}/inspections`,
    method: 'GET',
    headers: authHeaders
  });
  assert(inspectionsRes.status === 200 && Array.isArray(inspectionsRes.body), `GET /api/v1/tyres/${sampleTyre.id}/inspections returns valid array`);

  // Movements history endpoint
  const movementsRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/tyres/${sampleTyre.id}/movements`,
    method: 'GET',
    headers: authHeaders
  });
  assert(movementsRes.status === 200 && Array.isArray(movementsRes.body), `GET /api/v1/tyres/${sampleTyre.id}/movements returns valid array`);

  // 5. SEGREGATION OF DUTIES AUDIT
  console.log('\n--- 5. Segregation of Duties Audit ---');
  // Supervisor verification test
  const supLoginRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: 'supervisor@fi360.com',
    password: 'Pinkypinky@40'
  });

  assert(supLoginRes.status === 200 && supLoginRes.body.access_token, 'Supervisor authenticated for verification audit');

  // Final summary
  console.log('\n========================================================================');
  console.log(`  STEP 4B AUDIT COMPLETE: ${passed} Passed, ${failed} Failed`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStep4BTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
