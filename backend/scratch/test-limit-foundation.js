const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const adapter = new PrismaPg({ connectionString: 'postgresql://postgres:Pinkypinky%4040@localhost:5432/fi360_tyres?schema=public' });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- RUNNING LIMIT FOUNDATION TEST ---');

  // 1. LimitDefinition exists
  const defs = await prisma.limitDefinition.findMany();
  console.log(`[TEST] Found ${defs.length} limit definitions.`);
  if (defs.length === 0) throw new Error('No limit definitions found.');

  // 2. limitCode unique
  const codes = defs.map(d => d.limitCode);
  const uniqueCodes = new Set(codes);
  if (codes.length !== uniqueCodes.size) throw new Error('Limit codes are not unique.');
  console.log('[TEST] Limit codes are unique.');

  // 11, 12. No tenantId or organizationId on global limit tables
  const defsWithTenant = defs.filter(d => d.tenantId || d.organizationId);
  if (defsWithTenant.length > 0) throw new Error('Global LimitDefinition contains tenant/organization fields.');

  // 3. PlanVersionLimit exists
  const pvl = await prisma.planVersionLimit.findMany({ include: { limitDefinition: true, planVersion: { include: { plan: true } } } });
  console.log(`[TEST] Found ${pvl.length} plan version limits.`);
  if (pvl.length === 0) throw new Error('No plan version limits found.');

  const pvlWithTenant = pvl.filter(p => p.tenantId || p.organizationId);
  if (pvlWithTenant.length > 0) throw new Error('Global PlanVersionLimit contains tenant/organization fields.');

  // 8. STARTER MAX_VEHICLES = 10
  // 9. ENTERPRISE MAX_VEHICLES = unlimited
  // 10. Unresolved values remain NOT CONFIGURED (isUnlimited: false, limitValue: null)
  for (const limit of pvl) {
    const planKey = limit.planVersion.plan.planKey;
    const limitCode = limit.limitDefinition.limitCode;
    const isUnlimited = limit.isUnlimited;
    const limitValue = limit.limitValue;

    if (planKey === 'STARTER' && limitCode === 'MAX_VEHICLES') {
      if (isUnlimited || limitValue !== 10) throw new Error(`STARTER MAX_VEHICLES is incorrect. Got isUnlimited=${isUnlimited}, limitValue=${limitValue}`);
      console.log(`[TEST] STARTER MAX_VEHICLES is correctly set to 10.`);
    } else if (planKey === 'ENTERPRISE' && limitCode === 'MAX_VEHICLES') {
      if (!isUnlimited || limitValue !== null) throw new Error(`ENTERPRISE MAX_VEHICLES is incorrect. Got isUnlimited=${isUnlimited}, limitValue=${limitValue}`);
      console.log(`[TEST] ENTERPRISE MAX_VEHICLES is correctly set to unlimited.`);
    } else {
      if (isUnlimited !== false || limitValue !== null) {
        throw new Error(`Unresolved limit is not configured correctly for ${planKey} ${limitCode}. Expected false/null, got ${isUnlimited}/${limitValue}`);
      }
    }
  }

  // 13. No orphan PlanVersionLimit rows
  const orphanPvl = pvl.filter(p => !p.planVersionId || !p.limitDefinitionId);
  if (orphanPvl.length > 0) throw new Error('Found orphan PlanVersionLimit rows.');

  // 15. Existing Product Catalog remains intact
  const products = await prisma.product.findMany();
  if (products.length === 0) throw new Error('Product catalog empty.');
  console.log(`[TEST] Found ${products.length} products.`);

  console.log('--- ALL TESTS PASSED ---');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
