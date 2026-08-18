require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- PHASE 1: BACKFILL VEHICLE IDENTITY ---');

  const vehicles = await prisma.vehicle.findMany({
    include: {
      workOrders: { select: { tenantId: true, organizationId: true } },
      driverAssignments: { select: { tenantId: true, organizationId: true } },
      downtimes: { select: { tenantId: true, organizationId: true } }
    }
  });

  let autoResolved = 0;
  let defaultAssigned = 0;
  let unresolved = 0;
  
  console.log('Starting backfill for ' + vehicles.length + ' vehicles...');

  for (const v of vehicles) {
    const tenants = new Set();
    const orgs = new Set();

    v.workOrders.forEach(w => { tenants.add(w.tenantId); orgs.add(w.organizationId); });
    v.driverAssignments.forEach(d => { tenants.add(d.tenantId); orgs.add(d.organizationId); });
    v.downtimes.forEach(d => { tenants.add(d.tenantId); orgs.add(d.organizationId); });

    let finalTenant = null;
    let finalOrg = null;
    let classification = '';

    if (tenants.size > 1 || orgs.size > 1) {
      classification = 'C - CONFLICTING (Skipping)';
      unresolved++;
    } else if (tenants.size === 1 && orgs.size === 1) {
      finalTenant = Array.from(tenants)[0];
      finalOrg = Array.from(orgs)[0];
      classification = 'A - CLEAN / DETERMINISTIC';
      autoResolved++;
    } else {
      // 0 evidence, this is a seed/demo record as verified in preflight
      finalTenant = 'TNT-DEFAULT';
      finalOrg = 'ORG-DEFAULT';
      classification = 'B - CONTROLLED DEFAULT';
      defaultAssigned++;
    }

    if (finalTenant && finalOrg) {
      await prisma.vehicle.update({
        where: { id: v.id },
        data: {
          tenantId: finalTenant,
          organizationId: finalOrg
        }
      });
      console.log(`[${v.registrationNumber}] -> Tenant: ${finalTenant}, Org: ${finalOrg} (${classification})`);
    } else {
      console.warn(`[${v.registrationNumber}] -> skipped due to conflict.`);
    }
  }

  console.log('--- BACKFILL SUMMARY ---');
  console.log(`Total Vehicles: ${vehicles.length}`);
  console.log(`Auto-resolved: ${autoResolved}`);
  console.log(`Confirmed default: ${defaultAssigned}`);
  console.log(`Conflicts / Unresolved: ${unresolved}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
