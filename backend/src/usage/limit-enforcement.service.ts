import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CoreEntitlementResolver } from '../entitlement/core-entitlement.resolver';
import { UsageService } from './usage.service';
import { AuditService } from '../audit/audit.service';

/**
 * Service responsible for enforcing hard limits such as MAX_VEHICLES.
 * It works within a provided Prisma transaction client to ensure the
 * usage count and limit check are performed atomically.
 */
@Injectable()
export class LimitEnforcementService {
  private readonly logger = new Logger(LimitEnforcementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly resolver: CoreEntitlementResolver,
    private readonly usageService: UsageService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Ensure the tenant is within the specified limit.
   * @param tenantId Authenticated tenant identifier.
   * @param limitCode e.g., 'MAX_VEHICLES'. Currently only this code is supported.
   * @param tx Optional Prisma transaction client. If omitted, the default service client is used.
   * @throws ForbiddenException with a structured message when the limit is exceeded or not configured.
   */
  async assertWithinLimit(
    tenantId: string,
    limitCode: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;

    // Resolve the active PlanVersion for the tenant
    const planVersionId = await this.resolver.resolvePlanVersion(tenantId);
    if (!planVersionId) {
      this.logger.warn(`No entitlement context for tenant ${tenantId}`);
      await this.audit.logAction({
        module: 'limit-enforcement',
        action: 'denied',
        entityType: limitCode,
        entityId: tenantId,
        userId: undefined,
        userEmail: undefined,
        beforeValue: undefined,
        afterValue: undefined,
        ipAddress: undefined,
      });
      throw new ForbiddenException({ code: 'LIMIT_NOT_CONFIGURED', message: 'No entitlement context' });
    }

    // Fetch limit configuration
    const limitConfig = await client.planVersionLimit.findFirst({
      where: {
        planVersionId,
        limitDefinition: { limitCode },
      },
      include: { limitDefinition: true },
    });

    if (!limitConfig) {
      this.logger.warn(`Limit ${limitCode} not configured for tenant ${tenantId}`);
      await this.audit.logAction({
        module: 'limit-enforcement',
        action: 'denied',
        entityType: limitCode,
        entityId: tenantId,
        userId: undefined,
        userEmail: undefined,
        beforeValue: undefined,
        afterValue: undefined,
        ipAddress: undefined,
      });
      throw new ForbiddenException({ code: 'LIMIT_NOT_CONFIGURED', message: 'Limit not configured' });
    }

    if (limitConfig.isUnlimited) {
      // Unlimited – allow
      return;
    }

    const configuredLimit = limitConfig.limitValue;
    if (configuredLimit === null) {
      this.logger.warn(`Limit ${limitCode} has null configured value for tenant ${tenantId}`);
      await this.audit.logAction({
        module: 'limit-enforcement',
        action: 'denied',
        entityType: limitCode,
        entityId: tenantId,
        userId: undefined,
        userEmail: undefined,
        beforeValue: undefined,
        afterValue: undefined,
        ipAddress: undefined,
      });
      throw new ForbiddenException({ code: 'LIMIT_NOT_CONFIGURED', message: 'Limit value null' });
    }

    // Use the UsageService with the same transaction client
    const usage = await this.usageService.getVehicleUsage(tenantId, client);
    const currentUsage = usage.currentUsage;

    if (currentUsage >= configuredLimit) {
      this.logger.warn(`Tenant ${tenantId} exceeded ${limitCode}: ${currentUsage}/${configuredLimit}`);
      await this.audit.logAction({
        module: 'limit-enforcement',
        action: 'denied',
        entityType: limitCode,
        entityId: tenantId,
        userId: undefined,
        userEmail: undefined,
        beforeValue: { currentUsage },
        afterValue: { configuredLimit },
        ipAddress: undefined,
      });
      throw new ForbiddenException({ code: 'LIMIT_REACHED', message: `Limit ${limitCode} reached` });
    }

    // All good – allow
    return;
  }
}
