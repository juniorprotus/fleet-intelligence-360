const http = require('http');

const BASE_URL = 'http://localhost:3000';

function request(method, reqPath, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(reqPath, BASE_URL);
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

async function testFmTyreDashboardData() {
  console.log('============================================================');
  console.log('FI360 — FLEET MANAGER TYRE DASHBOARD DATA RECONCILIATION');
  console.log('============================================================\n');

  const loginRes = await request('POST', '/api/v1/auth/login', { email: 'fleet.manager@fi360.com', password: 'Pinkypinky@40' });
  const token = loginRes.body.access_token;

  const [tyreSummary, tyresRes, vehiclesRes, alertsRes, defectsRes, supervisorKpisRes] = await Promise.all([
    request('GET', '/api/v1/tyres/summary', null, token),
    request('GET', '/api/v1/tyres?limit=100', null, token),
    request('GET', '/api/v1/vehicles', null, token),
    request('GET', '/api/v1/alerts', null, token),
    request('GET', '/api/v1/defects', null, token),
    request('GET', '/api/v1/tyres/supervisor-kpis', null, token),
  ]);

  const tyres = Array.isArray(tyresRes.body) ? tyresRes.body : (tyresRes.body?.data || []);
  const vehicles = Array.isArray(vehiclesRes.body) ? vehiclesRes.body : [];
  const defects = Array.isArray(defectsRes.body) ? defectsRes.body : [];

  console.log(`1. Total Tyres: ${tyreSummary.body?.totalTyres || tyres.length}`);
  console.log(`2. Total Vehicles: ${vehicles.length}`);
  console.log(`3. Total Defects: ${defects.length}`);
  console.log(`4. Supervisor KPIs Available: ${supervisorKpisRes.status === 200 ? 'YES' : 'NO'}`);

  // Build Vehicles at Risk list from actual defects & tyres data
  const openDefects = defects.filter(d => d.status === 'OPEN');
  const lowTreadTyres = tyres.filter(t => t.currentTreadDepth != null && parseFloat(t.currentTreadDepth) <= 3.0);

  console.log(`  Open Defects Count: ${openDefects.length}`);
  console.log(`  Low Tread Tyres Count (<= 3.0mm): ${lowTreadTyres.length}`);

  console.log('\n============================================================');
  console.log('FLEET MANAGER TYRE DASHBOARD DATA RECONCILIATION COMPLETE');
  console.log('============================================================\n');
}

testFmTyreDashboardData().catch(console.error);
