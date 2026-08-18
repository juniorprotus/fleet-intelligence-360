require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- PHASE 2: VALIDATE VEHICLE IDENTITY ---');

  const vehicles = await prisma.vehicle.findMany({
    include: {
      workOrders: { select: { tenantId: true } },
      driverAssignments: { select: { tenantId: true } },
      downtimes: { select: { tenantId: true } }
    }
  });

  let nullFields = 0;
  let mismatches = 0;

  for (const v of vehicles) {
    if (!v.tenantId || !v.organizationId) {
      nullFields++;
      console.log(`[!] Vehicle ${v.id} missing tenant or org`);
    }

    const checkMatch = (records) => {
      for (const r of records) {
        if (r.tenantId !== v.tenantId) {
          mismatches++;
          console.log(`[!] Mismatch on Vehicle ${v.id}`);
        }
      }
    };

    checkMatch(v.workOrders);
    checkMatch(v.driverAssignments);
    checkMatch(v.downtimes);
  }

  console.log(`Validation Results:`);
  console.log(`Vehicles Checked: ${vehicles.length}`);
  console.log(`Missing Tenant/Org: ${nullFields}`);
  console.log(`Cross-Tenant Mismatches: ${mismatches}`);

  if (nullFields === 0 && mismatches === 0) {
    console.log('VALIDATION PASSED');
    process.exit(0);
  } else {
    console.log('VALIDATION FAILED');
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
