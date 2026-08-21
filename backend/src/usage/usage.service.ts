import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CoreEntitlementResolver } from '../entitlement/core-entitlement.resolver';
import { Prisma } from '@prisma/client';

export interface UsageSnapshot {
  limitCode: string;
  currentUsage: number;
  configuredLimit: number | null;
  isUnlimited: boolean;
  remaining: number | null;
  /**
   * OK            — within limit
   * AT_LIMIT      — exactly at limit
   * OVER_LIMIT    — exceeded limit (data drift)
   * UNLIMITED     — plan grants unlimited usage
   * NOT_CONFIGURED — limit definition not found for the plan
   * INSUFFICIENT_DATA — commercial context unavailable (see reason for code)
   * SUSPENDED     — subscription is suspended
   * EXPIRED       — subscription has expired
   * NO_SUBSCRIPTION — tenant has no subscription
   */
  status:
    | 'OK'
    | 'AT_LIMIT'
    | 'OVER_LIMIT'
    | 'UNLIMITED'
    | 'NOT_CONFIGURED'
    | 'INSUFFICIENT_DATA'
    | 'SUSPENDED'
    | 'EXPIRED'
    | 'NO_SUBSCRIPTION';
  dataQuality: 'VALID' | 'INSUFFICIENT_DATA';
  /**
   * Machine-readable code matching CommercialContext.code when commercial access
   * is denied. Preserves specific denial reason.
   */
  reason?: string;
}

@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly resolver: CoreEntitlementResolver,
  ) {}

  async getVehicleUsage(tenantId: string | undefined, client?: Prisma.TransactionClient): Promise<UsageSnapshot> {
    // Resolve commercial context — preserves specific denial reason
    const commercialContext = await this.resolver.resolveCommercialContext(tenantId);

    if (commercialContext.status !== 'VALID' || !commercialContext.planVersionId) {
      // Map commercial denial codes to specific UsageSnapshot statuses
      // Section 3 correction: do NOT broadly map everything to NOT_CONFIGURED
      const usageStatus = this.commercialStatusToUsageStatus(commercialContext.status);
      return {
        limitCode: 'MAX_VEHICLES',
        currentUsage: 0,
        configuredLimit: null,
        isUnlimited: false,
        remaining: null,
        status: usageStatus,
        dataQuality: 'INSUFFICIENT_DATA',
        reason: commercialContext.code,
      };
    }

    const planVersionId = commercialContext.planVersionId;
    const prismaClient = client ?? this.prisma;
    const currentUsage = await prismaClient.vehicle.count({
      where: {
        tenantId,
        isActive: true,
      },
    });

    const limitConfig = await prismaClient.planVersionLimit.findFirst({
      where: {
        planVersionId,
        limitDefinition: { limitCode: 'MAX_VEHICLES' },
      },
      include: { limitDefinition: true },
    });

    if (!limitConfig) {
      return {
        limitCode: 'MAX_VEHICLES',
        currentUsage,
        configuredLimit: null,
        isUnlimited: false,
        remaining: null,
        status: 'NOT_CONFIGURED',
        dataQuality: 'VALID',
      };
    }

    if (limitConfig.isUnlimited) {
      return {
        limitCode: 'MAX_VEHICLES',
        currentUsage,
        configuredLimit: null,
        isUnlimited: true,
        remaining: null,
        status: 'UNLIMITED',
        dataQuality: 'VALID',
      };
    }

    const configuredLimit = limitConfig.limitValue;
    if (configuredLimit === null) {
      return {
        limitCode: 'MAX_VEHICLES',
        currentUsage,
        configuredLimit: null,
        isUnlimited: false,
        remaining: null,
        status: 'NOT_CONFIGURED',
        dataQuality: 'VALID',
      };
    }

    const remaining = Math.max(configuredLimit - currentUsage, 0);
    let status: 'OK' | 'AT_LIMIT' | 'OVER_LIMIT' = 'OK';
    if (currentUsage > configuredLimit) {
      status = 'OVER_LIMIT';
    } else if (currentUsage === configuredLimit) {
      status = 'AT_LIMIT';
    }

    return {
      limitCode: 'MAX_VEHICLES',
      currentUsage,
      configuredLimit,
      isUnlimited: false,
      remaining,
      status,
      dataQuality: 'VALID',
    };
  }

  async getWorkshopUsage(tenantId: string | undefined): Promise<UsageSnapshot> {
    return {
      limitCode: 'MAX_WORKSHOPS',
      currentUsage: 0,
      configuredLimit: null,
      isUnlimited: false,
      remaining: null,
      status: 'NOT_CONFIGURED',
      dataQuality: 'INSUFFICIENT_DATA',
      reason: 'Workshop table does not possess a tenantId or organizationId field, preventing tenant-scoped measurement.',
    };
  }

  async getUserUsage(tenantId: string | undefined): Promise<UsageSnapshot> {
    return {
      limitCode: 'MAX_USERS',
      currentUsage: 0,
      configuredLimit: null,
      isUnlimited: false,
      remaining: null,
      status: 'NOT_CONFIGURED',
      dataQuality: 'INSUFFICIENT_DATA',
      reason: 'User table does not possess a tenantId or organizationId field, preventing tenant-scoped measurement.',
    };
  }

  async getIntegrationUsage(tenantId: string | undefined): Promise<UsageSnapshot> {
    // Resolve commercial context — preserves specific denial reason
    const commercialContext = await this.resolver.resolveCommercialContext(tenantId);

    if (commercialContext.status !== 'VALID' || !commercialContext.planVersionId) {
      const usageStatus = this.commercialStatusToUsageStatus(commercialContext.status);
      return {
        limitCode: 'MAX_INTEGRATIONS',
        currentUsage: 0,
        configuredLimit: null,
        isUnlimited: false,
        remaining: null,
        status: usageStatus,
        dataQuality: 'INSUFFICIENT_DATA',
        reason: commercialContext.code,
      };
    }

    const planVersionId = commercialContext.planVersionId;

    const currentUsage = await this.prisma.integrationConnection.count({
      where: {
        tenantId,
        status: {
          notIn: ['DISCONNECTED', 'NOT_CONNECTED'],
        },
      },
    });

    const limitConfig = await this.prisma.planVersionLimit.findFirst({
      where: {
        planVersionId,
        limitDefinition: { limitCode: 'MAX_INTEGRATIONS' },
      },
      include: { limitDefinition: true },
    });

    if (!limitConfig) {
      return {
        limitCode: 'MAX_INTEGRATIONS',
        currentUsage,
        configuredLimit: null,
        isUnlimited: false,
        remaining: null,
        status: 'NOT_CONFIGURED',
        dataQuality: 'VALID',
      };
    }

    if (limitConfig.isUnlimited) {
      return {
        limitCode: 'MAX_INTEGRATIONS',
        currentUsage,
        configuredLimit: null,
        isUnlimited: true,
        remaining: null,
        status: 'UNLIMITED',
        dataQuality: 'VALID',
      };
    }

    const configuredLimit = limitConfig.limitValue;
    if (configuredLimit === null) {
      return {
        limitCode: 'MAX_INTEGRATIONS',
        currentUsage,
        configuredLimit: null,
        isUnlimited: false,
        remaining: null,
        status: 'NOT_CONFIGURED',
        dataQuality: 'VALID',
      };
    }

    const remaining = Math.max(configuredLimit - currentUsage, 0);
    let status: 'OK' | 'AT_LIMIT' | 'OVER_LIMIT' = 'OK';
    if (currentUsage > configuredLimit) {
      status = 'OVER_LIMIT';
    } else if (currentUsage === configuredLimit) {
      status = 'AT_LIMIT';
    }

    return {
      limitCode: 'MAX_INTEGRATIONS',
      currentUsage,
      configuredLimit,
      isUnlimited: false,
      remaining,
      status,
      dataQuality: 'VALID',
    };
  }

  async getUsageSummary(tenantId: string | undefined): Promise<UsageSnapshot[]> {
    return Promise.all([
      this.getVehicleUsage(tenantId),
      this.getUserUsage(tenantId),
      this.getWorkshopUsage(tenantId),
      this.getIntegrationUsage(tenantId),
    ]);
  }

  /**
   * Maps a CommercialContext status to the appropriate UsageSnapshot status.
   * Section 3 correction: do NOT map SUSPENDED/EXPIRED/NO_SUBSCRIPTION to NOT_CONFIGURED.
   */
  private commercialStatusToUsageStatus(
    commercialStatus: string,
  ): UsageSnapshot['status'] {
    switch (commercialStatus) {
      case 'SUSPENDED':
        return 'SUSPENDED';
      case 'EXPIRED':
        return 'EXPIRED';
      case 'NO_SUBSCRIPTION':
        return 'NO_SUBSCRIPTION';
      case 'NOT_CONFIGURED':
        return 'NOT_CONFIGURED';
      default:
        return 'INSUFFICIENT_DATA';
    }
  }
}
