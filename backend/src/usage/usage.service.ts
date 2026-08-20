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
  status: 'OK' | 'AT_LIMIT' | 'OVER_LIMIT' | 'UNLIMITED' | 'NOT_CONFIGURED' | 'INSUFFICIENT_DATA';
  dataQuality: 'VALID' | 'INSUFFICIENT_DATA';
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
    let planVersionId: string | null = null;
    try {
      planVersionId = await this.resolver.resolvePlanVersion(tenantId);
    } catch (error) {
      return {
        limitCode: 'MAX_VEHICLES',
        currentUsage: 0,
        configuredLimit: null,
        isUnlimited: false,
        remaining: null,
        status: 'NOT_CONFIGURED',
        dataQuality: 'INSUFFICIENT_DATA',
        reason: error.response?.code || 'NO_ENTITLEMENT_CONTEXT',
      };
    }

    if (!planVersionId) {
      return {
        limitCode: 'MAX_VEHICLES',
        currentUsage: 0,
        configuredLimit: null,
        isUnlimited: false,
        remaining: null,
        status: 'NOT_CONFIGURED',
        dataQuality: 'INSUFFICIENT_DATA',
        reason: 'NO_ENTITLEMENT_CONTEXT',
      };
    }

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
    let planVersionId: string | null = null;
    try {
      planVersionId = await this.resolver.resolvePlanVersion(tenantId);
    } catch (error) {
      return {
        limitCode: 'MAX_INTEGRATIONS',
        currentUsage: 0,
        configuredLimit: null,
        isUnlimited: false,
        remaining: null,
        status: 'NOT_CONFIGURED',
        dataQuality: 'INSUFFICIENT_DATA',
        reason: error.response?.code || 'NO_ENTITLEMENT_CONTEXT',
      };
    }

    if (!planVersionId) {
      return {
        limitCode: 'MAX_INTEGRATIONS',
        currentUsage: 0,
        configuredLimit: null,
        isUnlimited: false,
        remaining: null,
        status: 'NOT_CONFIGURED',
        dataQuality: 'INSUFFICIENT_DATA',
        reason: 'NO_ENTITLEMENT_CONTEXT',
      };
    }

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
}
