require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const p = new PrismaClient({ adapter });

async function main() {
  try {
    // 1. List all tables
    const tables = await p.$queryRawUnsafe("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
    console.log('=== DATABASE TABLES ===');
    tables.forEach(t => console.log(' ', t.tablename));
    
    // 2. Check if vehicles table exists
    const hasVehicles = tables.some(t => t.tablename === 'vehicles');
    console.log('\n=== VEHICLES TABLE EXISTS:', hasVehicles, '===');
    
    if (hasVehicles) {
      const vCount = await p.$queryRawUnsafe("SELECT COUNT(*) as cnt FROM vehicles");
      console.log('Vehicle count:', vCount[0].cnt);
      
      const vehicles = await p.$queryRawUnsafe("SELECT vehicle_id, tenant_id, organization_id FROM vehicles LIMIT 5");
      console.log('Sample vehicles:', JSON.stringify(vehicles, null, 2));
    }
    
    // 3. Migration history
    const migrations = await p.$queryRawUnsafe("SELECT migration_name, finished_at, logs FROM _prisma_migrations ORDER BY started_at");
    console.log('\n=== MIGRATION HISTORY ===');
    migrations.forEach(m => {
      const status = m.finished_at ? 'APPLIED' : 'FAILED';
      console.log(' ', m.migration_name, '-', status);
      if (!m.finished_at && m.logs) {
        console.log('    LOGS:', m.logs.substring(0, 200));
      }
    });
    
    // 4. Check for product catalog tables
    const catalogTables = ['products', 'plans', 'plan_versions', 'plan_prices', 'plan_vehicle_pricing_bands'];
    console.log('\n=== CATALOG TABLES ===');
    for (const ct of catalogTables) {
      const exists = tables.some(t => t.tablename === ct);
      console.log(' ', ct, ':', exists ? 'EXISTS' : 'MISSING');
    }
    
    // 5. Check workshops table
    const hasWorkshops = tables.some(t => t.tablename === 'workshops');
    console.log('\n=== WORKSHOPS TABLE EXISTS:', hasWorkshops, '===');
    
    if (hasWorkshops) {
      const wCount = await p.$queryRawUnsafe("SELECT COUNT(*) as cnt FROM workshops");
      console.log('Workshop count:', wCount[0].cnt);
    }
    
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await p.$disconnect();
  }
}

main();
