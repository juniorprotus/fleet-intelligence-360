import { PrismaClient, ProductStatus, PlanStatus, PlanVersionStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('--- STARTING PRODUCT CATALOG SEED ---');
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in environment');
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.$connect();

    // 1. Seed Product
    const productKey = 'FI360_PLATFORM';
    const product = await prisma.product.upsert({
      where: { productKey },
      update: {
        name: 'FI360 Fleet Intelligence Platform',
        description: 'Core multi-tenant fleet management and telemetry monitoring product.',
        status: ProductStatus.ACTIVE,
      },
      create: {
        productKey,
        name: 'FI360 Fleet Intelligence Platform',
        description: 'Core multi-tenant fleet management and telemetry monitoring product.',
        status: ProductStatus.ACTIVE,
        displayOrder: 1,
      },
    });
    console.log(`[SEED] Product seeded: ${product.name} (ID: ${product.id})`);

    // 2. Seed Plans
    const plansToSeed = [
      {
        planKey: 'STARTER',
        name: 'Starter Plan',
        description: 'Entry-level fleet tracking for up to 10 vehicles.',
        displayOrder: 1,
      },
      {
        planKey: 'PROFESSIONAL',
        name: 'Professional Plan',
        description: 'Full telemetry, tyre inspection governance, and automated work orders.',
        displayOrder: 2,
      },
      {
        planKey: 'ENTERPRISE',
        name: 'Enterprise Plan',
        description: 'Uncapped vehicles, dedicated support, and predictive intelligence models.',
        displayOrder: 3,
      },
      {
        planKey: 'GROUP',
        name: 'Group Plan',
        description: 'Consolidated commercial rate for corporate conglomerates.',
        displayOrder: 4,
      },
    ];

    // Seed Features
    const featuresToSeed = [
      { featureCode: 'VEHICLE_MASTER', name: 'Vehicle Master Management', category: 'CORE' },
      { featureCode: 'TYRE_INTELLIGENCE', name: 'Tyre Intelligence & Inspections', category: 'TYRE' },
      { featureCode: 'WORKSHOP', name: 'Workshop & Maintenance Ops', category: 'WORKSHOP' },
      { featureCode: 'TELEMATICS', name: 'Advanced Telematics & IoT Ingestion', category: 'TELEMATICS' },
      { featureCode: 'VEHICLE_FINANCE', name: 'Vehicle Financial Profile & Lifecycle', category: 'FINANCE' },
      { featureCode: 'REPORTING', name: 'Universal Reporting & Exports', category: 'REPORTING' },
      { featureCode: 'KPI_GOVERNANCE', name: 'KPI Governance Engine', category: 'KPI' },
      { featureCode: 'INTEGRATIONS', name: 'External API & Integrations', category: 'INTEGRATIONS' },
    ];

    const seededFeatures: Record<string, any> = {};

    for (const fData of featuresToSeed) {
      const feat = await prisma.featureDefinition.upsert({
        where: { featureCode: fData.featureCode },
        update: { name: fData.name, category: fData.category },
        create: {
          featureCode: fData.featureCode,
          name: fData.name,
          category: fData.category,
          status: 'ACTIVE',
        },
      });
      seededFeatures[fData.featureCode] = feat;
      console.log(`[SEED] Feature seeded: ${feat.featureCode}`);
    }

    const planFeatureMatrix: Record<string, Record<string, boolean | 'REQUIRES_BUSINESS_DECISION'>> = {
      STARTER: {
        VEHICLE_MASTER: true,
        TYRE_INTELLIGENCE: false,
        WORKSHOP: false,
        TELEMATICS: false,
        VEHICLE_FINANCE: false,
        REPORTING: 'REQUIRES_BUSINESS_DECISION',
        KPI_GOVERNANCE: false,
        INTEGRATIONS: false,
      },
      PROFESSIONAL: {
        VEHICLE_MASTER: true,
        TYRE_INTELLIGENCE: true,
        WORKSHOP: true,
        TELEMATICS: true,
        VEHICLE_FINANCE: 'REQUIRES_BUSINESS_DECISION',
        REPORTING: true,
        KPI_GOVERNANCE: 'REQUIRES_BUSINESS_DECISION',
        INTEGRATIONS: 'REQUIRES_BUSINESS_DECISION',
      },
      ENTERPRISE: {
        VEHICLE_MASTER: true,
        TYRE_INTELLIGENCE: true,
        WORKSHOP: true,
        TELEMATICS: true,
        VEHICLE_FINANCE: true,
        REPORTING: true,
        KPI_GOVERNANCE: true,
        INTEGRATIONS: true,
      },
      GROUP: {
        VEHICLE_MASTER: 'REQUIRES_BUSINESS_DECISION',
        TYRE_INTELLIGENCE: 'REQUIRES_BUSINESS_DECISION',
        WORKSHOP: 'REQUIRES_BUSINESS_DECISION',
        TELEMATICS: 'REQUIRES_BUSINESS_DECISION',
        VEHICLE_FINANCE: 'REQUIRES_BUSINESS_DECISION',
        REPORTING: 'REQUIRES_BUSINESS_DECISION',
        KPI_GOVERNANCE: 'REQUIRES_BUSINESS_DECISION',
        INTEGRATIONS: 'REQUIRES_BUSINESS_DECISION',
      },
    };

    for (const planData of plansToSeed) {
      const plan = await prisma.plan.upsert({
        where: {
          productId_planKey: {
            productId: product.id,
            planKey: planData.planKey,
          },
        },
        update: {
          name: planData.name,
          description: planData.description,
          status: PlanStatus.ACTIVE,
          isPublic: true,
        },
        create: {
          productId: product.id,
          planKey: planData.planKey,
          name: planData.name,
          description: planData.description,
          status: PlanStatus.ACTIVE,
          displayOrder: planData.displayOrder,
          isPublic: true,
        },
      });
      console.log(`[SEED] Plan seeded: ${plan.name} (Key: ${plan.planKey})`);

      // 3. Initial Plan Version for each plan (Idempotent: check if version 1 exists)
      let version = await prisma.planVersion.findUnique({
        where: {
          planId_versionNumber: {
            planId: plan.id,
            versionNumber: 1,
          },
        },
      });

      if (!version) {
        version = await prisma.planVersion.create({
          data: {
            planId: plan.id,
            versionNumber: 1,
            effectiveFrom: new Date('2026-01-01T00:00:00Z'),
            status: PlanVersionStatus.ACTIVE,
            pricingModel: 'FLAT',
            currency: 'KES',
            billingInterval: 'MONTHLY',
          },
        });
        console.log(`[SEED] Initial PlanVersion 1 created for ${plan.name}`);

        // Seed initial PlanPrice for KES - amount is NULL as instructed (Do not invent price)
        await prisma.planPrice.create({
          data: {
            planVersionId: version.id,
            currency: 'KES',
            billingInterval: 'MONTHLY',
            amount: null,
            isDefault: true,
            effectiveFrom: new Date('2026-01-01T00:00:00Z'),
          },
        });
        console.log(`[SEED] Initial Null Price configuration created for ${plan.name}`);
      } else {
        console.log(`[SEED] PlanVersion 1 already exists for ${plan.name}, skipping creation`);
      }

      // Seed Entitlements for this Version
      const matrix = planFeatureMatrix[planData.planKey];
      if (matrix) {
        for (const [featCode, decision] of Object.entries(matrix)) {
          const feature = seededFeatures[featCode];
          if (!feature) continue;

          let isEnabled = false;
          if (decision === 'REQUIRES_BUSINESS_DECISION') {
            console.warn(`[SEED WARNING] Feature ${featCode} for Plan ${planData.planKey} REQUIRES_BUSINESS_DECISION. Defaulting to disabled.`);
            isEnabled = false;
          } else {
            isEnabled = decision;
          }

          await prisma.planEntitlement.upsert({
            where: {
              planVersionId_featureId: {
                planVersionId: version.id,
                featureId: feature.id,
              },
            },
            update: { enabled: isEnabled },
            create: {
              planVersionId: version.id,
              featureId: feature.id,
              enabled: isEnabled,
            },
          });
        }
        console.log(`[SEED] Entitlements seeded for ${plan.name} PlanVersion 1`);
      }
    }

    // 4. Seed Limit Definitions
    const limitsToSeed = [
      { limitCode: 'MAX_VEHICLES', name: 'Maximum Vehicles', limitType: 'COUNT' },
      { limitCode: 'MAX_USERS', name: 'Maximum Users', limitType: 'COUNT' },
      { limitCode: 'MAX_WORKSHOPS', name: 'Maximum Workshops', limitType: 'COUNT' },
      { limitCode: 'MAX_INTEGRATIONS', name: 'Maximum Integrations', limitType: 'COUNT' },
      { limitCode: 'RETENTION_DAYS', name: 'Data Retention Days', limitType: 'RETENTION_DAYS', unit: 'Days' },
    ];

    const seededLimits: Record<string, any> = {};

    for (const lData of limitsToSeed) {
      const limitDef = await prisma.limitDefinition.upsert({
        where: { limitCode: lData.limitCode },
        update: { name: lData.name, limitType: lData.limitType as any, unit: lData.unit },
        create: {
          limitCode: lData.limitCode,
          name: lData.name,
          limitType: lData.limitType as any,
          unit: lData.unit,
          status: 'ACTIVE',
        },
      });
      seededLimits[lData.limitCode] = limitDef;
      console.log(`[SEED] Limit Definition seeded: ${limitDef.limitCode}`);
    }

    // Seed PlanVersion Limits
    // REQUIRES_BUSINESS_DECISION mapped to isUnlimited: false, limitValue: null
    const planLimitMatrix: Record<string, Record<string, { isUnlimited: boolean; limitValue: number | null }>> = {
      STARTER: {
        MAX_VEHICLES: { isUnlimited: false, limitValue: 10 },
        MAX_USERS: { isUnlimited: false, limitValue: null },
        MAX_WORKSHOPS: { isUnlimited: false, limitValue: null },
        MAX_INTEGRATIONS: { isUnlimited: false, limitValue: null },
        RETENTION_DAYS: { isUnlimited: false, limitValue: null },
      },
      PROFESSIONAL: {
        MAX_VEHICLES: { isUnlimited: false, limitValue: null },
        MAX_USERS: { isUnlimited: false, limitValue: null },
        MAX_WORKSHOPS: { isUnlimited: false, limitValue: null },
        MAX_INTEGRATIONS: { isUnlimited: false, limitValue: null },
        RETENTION_DAYS: { isUnlimited: false, limitValue: null },
      },
      ENTERPRISE: {
        MAX_VEHICLES: { isUnlimited: true, limitValue: null },
        MAX_USERS: { isUnlimited: false, limitValue: null },
        MAX_WORKSHOPS: { isUnlimited: false, limitValue: null },
        MAX_INTEGRATIONS: { isUnlimited: false, limitValue: null },
        RETENTION_DAYS: { isUnlimited: false, limitValue: null },
      },
      GROUP: {
        MAX_VEHICLES: { isUnlimited: false, limitValue: null },
        MAX_USERS: { isUnlimited: false, limitValue: null },
        MAX_WORKSHOPS: { isUnlimited: false, limitValue: null },
        MAX_INTEGRATIONS: { isUnlimited: false, limitValue: null },
        RETENTION_DAYS: { isUnlimited: false, limitValue: null },
      },
    };

    for (const planData of plansToSeed) {
      const plan = await prisma.plan.findUnique({
        where: { productId_planKey: { productId: product.id, planKey: planData.planKey } },
      });
      if (!plan) continue;

      const version = await prisma.planVersion.findUnique({
        where: { planId_versionNumber: { planId: plan.id, versionNumber: 1 } },
      });
      if (!version) continue;

      const limits = planLimitMatrix[planData.planKey];
      if (limits) {
        for (const [limitCode, config] of Object.entries(limits)) {
          const limitDef = seededLimits[limitCode];
          if (!limitDef) continue;

          await prisma.planVersionLimit.upsert({
            where: {
              planVersionId_limitDefinitionId: {
                planVersionId: version.id,
                limitDefinitionId: limitDef.id,
              },
            },
            update: {
              isUnlimited: config.isUnlimited,
              limitValue: config.limitValue,
            },
            create: {
              planVersionId: version.id,
              limitDefinitionId: limitDef.id,
              isUnlimited: config.isUnlimited,
              limitValue: config.limitValue,
            },
          });
        }
        console.log(`[SEED] Limits seeded for ${plan.name} PlanVersion 1`);
      }
    }

    console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
  } catch (error) {
    console.error('[SEED ERROR]', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
