import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * DevelopmentEntitlementContextResolver
 *
 * Temporary test/development infrastructure to map runtime tenant IDs to commercial catalog PlanVersions.
 * Maps:
 *   - TEST_TENANT_STARTER -> STARTER
 *   - TEST_TENANT_PROFESSIONAL -> PROFESSIONAL
 *   - TEST_TENANT_ENTERPRISE -> ENTERPRISE
 *
 * This resolver must be removed/replaced in Step 6D once permanent subscription management database structures are introduced.
 * Any unknown or non-test tenants will fail closed (no plan version mapped).
 */
@Injectable()
export class DevelopmentEntitlementContextResolver {
  private readonly logger = new Logger(DevelopmentEntitlementContextResolver.name);

  // Tenant-to-plan mappings explicitly isolated for development/test purposes.
  private readonly testMappings: Record<string, string> = {
    TEST_TENANT_STARTER: 'STARTER',
    TEST_TENANT_PROFESSIONAL: 'PROFESSIONAL',
    TEST_TENANT_ENTERPRISE: 'ENTERPRISE',
  };

  constructor(private readonly prisma: PrismaService) {}

  async resolvePlanVersion(tenantId: string | undefined): Promise<string | null> {
    if (!tenantId) {
      this.logger.debug('No tenantId resolved in authentication context.');
      return null;
    }

    const planKey = this.testMappings[tenantId];
    if (!planKey) {
      this.logger.debug(`Tenant ${tenantId} is not configured for test entitlements.`);
      return null;
    }

    // Resolve PlanVersion ID from the global commercial catalog
    const plan = await this.prisma.plan.findFirst({
      where: {
        planKey,
        product: { productKey: 'FI360_PLATFORM' },
      },
      include: {
        versions: {
          where: { status: 'ACTIVE' },
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });

    if (!plan || plan.versions.length === 0) {
      this.logger.error(`No active version found for plan ${planKey}`);
      return null;
    }

    return plan.versions[0].id;
  }
}
