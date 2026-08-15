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

async function runTyreForensicAssessment() {
  console.log('============================================================');
  console.log('FI360 — TYRE INTELLIGENCE FORENSIC ASSIGNMENT & DISCOVERY');
  console.log('============================================================\n');

  // Login as Tyre Supervisor to test supervisor KPIs
  const loginRes = await request('POST', '/api/v1/auth/login', { email: 'supervisor@fi360.com', password: 'Pinkypinky@40' });
  const token = loginRes.body.access_token;

  // 1. Fetch Tyre Summary & Master Data
  const [summaryRes, tyresRes, supervisorKpisRes, governedKpisRes, weeklyScheduleRes, mechQueueRes, supQueueRes, fitmentsRes, inspectionsRes] = await Promise.all([
    request('GET', '/api/v1/tyres/summary', null, token),
    request('GET', '/api/v1/tyres', null, token),
    request('GET', '/api/v1/tyres/supervisor-kpis', null, token),
    request('GET', '/api/v1/tyres/kpis', null, token),
    request('GET', '/api/v1/tyres/weekly-schedule', null, token),
    request('GET', '/api/v1/tyres/mechanic-work-queue', null, token),
    request('GET', '/api/v1/tyres/supervisor-work-queue', null, token),
    request('GET', '/api/v1/tyres/fitments/all', null, token),
    request('GET', '/api/v1/tyres/inspections/all', null, token),
  ]);

  const tyres = Array.isArray(tyresRes.body) ? tyresRes.body : (tyresRes.body?.data || []);
  const fitments = Array.isArray(fitmentsRes.body) ? fitmentsRes.body : [];
  const inspections = Array.isArray(inspectionsRes.body) ? inspectionsRes.body : [];

  console.log('--- 1. DATABASE & RECORD COUNTS ---');
  console.log(`  Tyre Summary Endpoint Status: ${summaryRes.status}`);
  console.log(`  Total Tyres in Database: ${tyres.length}`);
  console.log(`  Total Fitment Records: ${fitments.length}`);
  console.log(`  Total Inspection Records: ${inspections.length}`);
  console.log(`  Summary Status Breakdown:`, summaryRes.body?.statusCounts || summaryRes.body);

  console.log('\n--- 2. SUPERVISOR & GOVERNED KPIS ---');
  console.log(`  Supervisor KPIs Status: ${supervisorKpisRes.status}`);
  if (supervisorKpisRes.status === 200) {
    console.log(`  Supervisor KPI Keys (${Object.keys(supervisorKpisRes.body).length}):`, Object.keys(supervisorKpisRes.body));
  console.log(`  Supervisor KPI Detail:`, JSON.stringify(supervisorKpisRes.body.kpis, null, 2));
  }
  console.log(`  Governed KPIs Status: ${governedKpisRes.status}`);
  if (governedKpisRes.status === 200) {
    console.log(`  Governed KPI Array Length: ${Array.isArray(governedKpisRes.body) ? governedKpisRes.body.length : 'N/A'}`);
  }

  console.log('\n--- 3. OPERATIONAL QUEUES & SCHEDULES ---');
  console.log(`  Weekly Schedule Status: ${weeklyScheduleRes.status}`);
  console.log(`  Mechanic Work Queue Status: ${mechQueueRes.status}`);
  console.log(`  Supervisor Work Queue Status: ${supQueueRes.status}`);

  console.log('\n============================================================');
  console.log('TYRE INTELLIGENCE FORENSIC ASSIGNMENT DISCOVERY COMPLETE');
  console.log('============================================================\n');
}

runTyreForensicAssessment().catch(console.error);
