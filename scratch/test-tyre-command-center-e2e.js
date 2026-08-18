/**
 * FI360 STEP 4A — TYRE INTELLIGENCE COMMAND CENTER E2E VERIFICATION SUITE
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

function fetchApi(pathStr, token) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: pathStr,
      method: 'GET',
      headers,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function postApi(pathStr, body) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: pathStr,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('============================================================');
  console.log('FI360 STEP 4A — TYRE INTELLIGENCE COMMAND CENTER E2E TEST');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;
  function assert(condition, message) {
    if (condition) {
      console.log(`✅ ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. DOM HIERARCHY AUDIT
  console.log('--- 1. STATIC DOM HIERARCHY AUDIT (index.html) ---');
  const indexHtml = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');

  assert(indexHtml.includes('id="fm-tyres"'), '[DOM] Primary Tyre Command Center Container (#fm-tyres): PRESENT');
  assert(indexHtml.includes('id="fm-tyre-search"'), '[DOM] Global Search Input (#fm-tyre-search): PRESENT');
  assert(indexHtml.includes('id="fm-tyre-filter-status"'), '[DOM] Status Filter Dropdown (#fm-tyre-filter-status): PRESENT');
  assert(indexHtml.includes('id="fm-tyre-filter-brand"'), '[DOM] Brand Filter Dropdown (#fm-tyre-filter-brand): PRESENT');
  assert(indexHtml.includes('id="fm-tyre-filter-size"'), '[DOM] Size Filter Dropdown (#fm-tyre-filter-size): PRESENT');

  assert(indexHtml.includes('id="fm-tyre-kpi-health"'), '[DOM] KPI Card: Fleet Tyre Health (#fm-tyre-kpi-health): PRESENT');
  assert(indexHtml.includes('id="fm-tyre-kpi-compliance"'), '[DOM] KPI Card: Inspection Compliance (#fm-tyre-kpi-compliance): PRESENT');
  assert(indexHtml.includes('id="fm-tyre-kpi-attention"'), '[DOM] KPI Card: Attention Required (#fm-tyre-kpi-attention): PRESENT');
  assert(indexHtml.includes('id="fm-tyre-kpi-retread"'), '[DOM] KPI Card: Retread Ratio (#fm-tyre-kpi-retread): PRESENT');
  assert(indexHtml.includes('id="fm-tyre-kpi-cost"'), '[DOM] KPI Card: Tyre Cost/km (#fm-tyre-kpi-cost): PRESENT');

  assert(indexHtml.includes('id="fm-tyre-action-cards-grid"'), '[DOM] Tyre Action Center Queue Grid (#fm-tyre-action-cards-grid): PRESENT');
  assert(indexHtml.includes('id="bar-stock"') && indexHtml.includes('id="bar-fitted"'), '[DOM] Inventory Position Segmented Bar: PRESENT');
  assert(indexHtml.includes('id="stat-instock"') && indexHtml.includes('id="stat-fitted"'), '[DOM] Inventory Stat Chips: PRESENT');

  assert(indexHtml.includes('id="fm-tyre-risk-vehicles-table"'), '[DOM] Vehicles with Tyre Exceptions Table (#fm-tyre-risk-vehicles-table): PRESENT');
  assert(indexHtml.includes('id="fm-tyres-table"'), '[DOM] Master Tyre Ledger Table (#fm-tyres-table): PRESENT');
  assert(indexHtml.includes('id="fm-tyres-table-body"'), '[DOM] Master Tyre Ledger Body (#fm-tyres-table-body): PRESENT');
  assert(indexHtml.includes('id="btn-tyre-prev-page"') && indexHtml.includes('id="btn-tyre-next-page"'), '[DOM] Pagination Controls: PRESENT');

  // 2. BACKEND API AUDIT
  console.log('\n--- 2. BACKEND TYRE API SURFACE & GOVERNANCE AUDIT ---');
  const loginRes = await postApi('/api/v1/auth/login', {
    email: 'fleet.manager@fi360.com',
    password: 'Pinkypinky@40'
  });
  assert(loginRes.status === 200 && loginRes.data.access_token, 'Fleet Manager Authentication Successful');
  const token = loginRes.data.access_token;

  const [kpisRes, summaryRes, tyresRes, defectsRes] = await Promise.all([
    fetchApi('/api/v1/tyres/kpis', token),
    fetchApi('/api/v1/tyres/summary', token),
    fetchApi('/api/v1/tyres?page=1&limit=20', token),
    fetchApi('/api/v1/defects', token),
  ]);

  assert(kpisRes.status === 200, 'GET /api/v1/tyres/kpis returned 200 OK');
  assert(kpisRes.data.FLEET_TYRE_HEALTH && kpisRes.data.FLEET_TYRE_HEALTH.value === 98.9, 'Governed FLEET_TYRE_HEALTH value is 98.9% (Target: 95.0%, Status: GREEN)');
  assert(kpisRes.data.WEEKLY_TYRE_INSPECTION_COMPLIANCE && kpisRes.data.WEEKLY_TYRE_INSPECTION_COMPLIANCE.kpiId === 'WEEKLY_TYRE_INSPECTION_COMPLIANCE', 'Governed WEEKLY_TYRE_INSPECTION_COMPLIANCE KPI conforms to contract');
  assert(kpisRes.data.TYRE_COST_PER_KM && kpisRes.data.TYRE_COST_PER_KM.status === 'INSUFFICIENT_DATA', 'Governed TYRE_COST_PER_KM returns INSUFFICIENT_DATA token (No fabricated numbers)');
  assert(kpisRes.data.RETREAD_RATIO && kpisRes.data.RETREAD_RATIO.kpiId === 'RETREAD_RATIO', 'Governed RETREAD_RATIO KPI conforms to contract');

  assert(summaryRes.status === 200 && summaryRes.data.totalTyres > 0, `GET /api/v1/tyres/summary returned ${summaryRes.data.totalTyres} total tyres`);
  assert(summaryRes.data.byStatus && summaryRes.data.byStatus.inStock != null, 'Inventory summary contains inStock count');
  assert(summaryRes.data.byStatus && summaryRes.data.byStatus.fitted != null, 'Inventory summary contains fitted count');

  assert(tyresRes.status === 200 && tyresRes.data.data && tyresRes.data.data.length > 0, `GET /api/v1/tyres paginated endpoint returned ${tyresRes.data.data.length} records`);
  assert(tyresRes.data.meta && tyresRes.data.meta.total > 0 && tyresRes.data.meta.totalPages >= 1, `Pagination metadata verified: ${tyresRes.data.meta.total} total tyres across ${tyresRes.data.meta.totalPages} pages`);

  // 3. JAVASCRIPT CONTROLLER AUDIT
  console.log('\n--- 3. JAVASCRIPT CONTROLLER & METHOD AUDIT (main.js) ---');
  const mainJs = fs.readFileSync(path.join(__dirname, '../frontend/main.js'), 'utf8');

  assert(mainJs.includes('window.loadFmTyresCommandCenter ='), '[JS] window.loadFmTyresCommandCenter defined');
  assert(mainJs.includes('window.filterFmTyreTable ='), '[JS] window.filterFmTyreTable defined');
  assert(mainJs.includes('window.filterFmTyreByStatus ='), '[JS] window.filterFmTyreByStatus defined');
  assert(mainJs.includes('window.debounceTyreSearch ='), '[JS] window.debounceTyreSearch defined');
  assert(mainJs.includes('window.resetTyreFilters ='), '[JS] window.resetTyreFilters defined');
  assert(mainJs.includes('window.changeTyrePage ='), '[JS] window.changeTyrePage defined');
  assert(mainJs.includes('window.reloadFmTyresCommandCenter ='), '[JS] window.reloadFmTyresCommandCenter defined');
  assert(mainJs.includes('window.exportTyreReport ='), '[JS] window.exportTyreReport defined');

  // 4. CROSS-DOMAIN & VEHICLE WORKSPACE LINKAGE AUDIT
  console.log('\n--- 4. CROSS-DOMAIN VEHICLE WORKSPACE LINKAGE AUDIT ---');
  assert(mainJs.includes("openVehicleWorkspace('"), '[Integration] Tyre items link to Step 3 openVehicleWorkspace()');
  assert(mainJs.includes("openTyreDetailModal('"), '[Integration] Tyre ID clicks link to openTyreDetailModal()');
  assert(!mainJs.includes("openTyreWorkspace("), '[Scope Discipline] openTyreWorkspace() is NOT implemented prematurely (Reserved for Step 4B)');

  console.log('\n============================================================');
  console.log(`STEP 4A TYRE COMMAND CENTER E2E RESULT: ${failed === 0 ? '100% PASSED CLEAN' : 'FAILURES DETECTED'}`);
  console.log(`Passed: ${passed} | Failed: ${failed}`);
  console.log('============================================================\n');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Fatal error running Step 4A E2E tests:', err);
  process.exit(1);
});
