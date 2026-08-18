require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- PHASE 0: PREFLIGHT AUDIT ---');

  const vehicleCount = await prisma.vehicle.count();
  console.log(`Total Vehicles: ${vehicleCount}`);

  const vehicles = await prisma.vehicle.findMany({
    include: {
      workOrders: { select: { tenantId: true, organizationId: true } },
      driverAssignments: { select: { tenantId: true, organizationId: true } },
      downtimes: { select: { tenantId: true, organizationId: true } }
    }
  });

  let conflicts = 0;
  let clean = 0;
  let defaulted = 0;
  
  for (const v of vehicles) {
    const tenants = new Set();
    const orgs = new Set();

    v.workOrders.forEach(w => { tenants.add(w.tenantId); orgs.add(w.organizationId); });
    v.driverAssignments.forEach(d => { tenants.add(d.tenantId); orgs.add(d.organizationId); });
    v.downtimes.forEach(d => { tenants.add(d.tenantId); orgs.add(d.organizationId); });

    if (tenants.size > 1 || orgs.size > 1) {
      conflicts++;
    } else if (tenants.size === 1) {
      clean++;
    } else {
      defaulted++;
    }
  }

  console.log(`Clean/Deterministic: ${clean}`);
  console.log(`Defaulted (No history): ${defaulted}`);
  console.log(`Conflicts: ${conflicts}`);

  const registrations = await prisma.vehicle.groupBy({
    by: ['registrationNumber'],
    _count: true,
    having: { registrationNumber: { _count: { gt: 1 } } }
  });
  console.log(`Duplicate Registrations: ${registrations.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
