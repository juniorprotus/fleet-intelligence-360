import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateFeatureDto, UpdateFeatureDto, CreatePlanEntitlementDto, UpdatePlanEntitlementDto } from './dto/entitlement.dto';
import { FeatureStatus } from '@prisma/client';

export interface EntitlementDecision {
  allowed: boolean;
  featureCode: string;
  reason: 'ENABLED' | 'FEATURE_NOT_FOUND' | 'DISABLED' | 'NO_PLAN_VERSION' | 'NO_ENTITLEMENT_CONTEXT' | 'NOT_ENTITLED';
}

@Injectable()
export class EntitlementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ─── FEATURE DEFINITIONS ───────────────────────────────────────────────────

  async createFeature(dto: CreateFeatureDto, userEmail?: string) {
    const existing = await this.prisma.featureDefinition.findUnique({
      where: { featureCode: dto.featureCode },
    });
    if (existing) {
      throw new ConflictException(`Feature definition with code ${dto.featureCode} already exists`);
    }

    const feature = await this.prisma.featureDefinition.create({
      data: {
        featureCode: dto.featureCode,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        status: dto.status || FeatureStatus.ACTIVE,
        displayOrder: dto.displayOrder || 0,
      },
    });

    await this.audit.logAction({
      module: 'ENTITLEMENT',
      action: 'FEATURE_CREATE',
      entityType: 'FeatureDefinition',
      entityId: feature.id,
      userEmail,
      afterValue: feature,
    });

    return feature;
  }

  async updateFeature(id: string, dto: UpdateFeatureDto, userEmail?: string) {
    const original = await this.prisma.featureDefinition.findUnique({ where: { id } });
    if (!original) {
      throw new NotFoundException(`Feature definition with ID ${id} not found`);
    }

    const updated = await this.prisma.featureDefinition.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        status: dto.status,
        displayOrder: dto.displayOrder,
      },
    });

    await this.audit.logAction({
      module: 'ENTITLEMENT',
      action: 'FEATURE_UPDATE',
      entityType: 'FeatureDefinition',
      entityId: id,
      userEmail,
      beforeValue: original,
      afterValue: updated,
    });

    return updated;
  }

  async getFeatures() {
    return this.prisma.featureDefinition.findMany({
      orderBy: { displayOrder: 'asc' },
    });
  }

  // ─── PLAN ENTITLEMENTS ─────────────────────────────────────────────────────

  async createPlanEntitlement(dto: CreatePlanEntitlementDto, userEmail?: string) {
    const version = await this.prisma.planVersion.findUnique({
      where: { id: dto.planVersionId },
    });
    if (!version) {
      throw new NotFoundException(`Plan version with ID ${dto.planVersionId} not found`);
    }

    const feature = await this.prisma.featureDefinition.findUnique({
      where: { id: dto.featureId },
    });
    if (!feature) {
      throw new NotFoundException(`Feature definition with ID ${dto.featureId} not found`);
    }

    const existing = await this.prisma.planEntitlement.findUnique({
      where: {
        planVersionId_featureId: {
          planVersionId: dto.planVersionId,
          featureId: dto.featureId,
        },
      },
    });
    if (existing) {
      throw new ConflictException(`Entitlement mapping already exists for plan version ${dto.planVersionId} and feature ${dto.featureId}`);
    }

    const entitlement = await this.prisma.planEntitlement.create({
      data: {
        planVersionId: dto.planVersionId,
        featureId: dto.featureId,
        enabled: dto.enabled !== undefined ? dto.enabled : true,
      },
    });

    await this.audit.logAction({
      module: 'ENTITLEMENT',
      action: 'PLAN_ENTITLEMENT_CREATE',
      entityType: 'PlanEntitlement',
      entityId: entitlement.id,
      userEmail,
      afterValue: entitlement,
    });

    return entitlement;
  }

  async updatePlanEntitlement(id: string, dto: UpdatePlanEntitlementDto, userEmail?: string) {
    const original = await this.prisma.planEntitlement.findUnique({
      where: { id },
    });
    if (!original) {
      throw new NotFoundException(`Plan entitlement with ID ${id} not found`);
    }

    const updated = await this.prisma.planEntitlement.update({
      where: { id },
      data: {
        enabled: dto.enabled,
      },
    });

    await this.audit.logAction({
      module: 'ENTITLEMENT',
      action: 'PLAN_ENTITLEMENT_UPDATE',
      entityType: 'PlanEntitlement',
      entityId: id,
      userEmail,
      beforeValue: original,
      afterValue: updated,
    });

    return updated;
  }

  async getPlanEntitlements(planVersionId?: string) {
    return this.prisma.planEntitlement.findMany({
      where: planVersionId ? { planVersionId } : {},
      include: { feature: true },
    });
  }

  // ─── CORE QUERY LOGIC ──────────────────────────────────────────────────────

  async getFeature(featureCode: string) {
    return this.prisma.featureDefinition.findUnique({
      where: { featureCode },
    });
  }

  async listFeaturesForPlanVersion(planVersionId: string) {
    return this.prisma.planEntitlement.findMany({
      where: { planVersionId },
      include: { feature: true },
    });
  }

  async isFeatureEnabled(planVersionId: string, featureCode: string): Promise<EntitlementDecision> {
    const feature = await this.prisma.featureDefinition.findUnique({
      where: { featureCode },
    });
    if (!feature) {
      return { allowed: false, featureCode, reason: 'FEATURE_NOT_FOUND' };
    }
    if (feature.status === FeatureStatus.INACTIVE) {
      return { allowed: false, featureCode, reason: 'DISABLED' };
    }

    const planVersion = await this.prisma.planVersion.findUnique({
      where: { id: planVersionId },
    });
    if (!planVersion) {
      return { allowed: false, featureCode, reason: 'NO_PLAN_VERSION' };
    }

    const entitlement = await this.prisma.planEntitlement.findUnique({
      where: {
        planVersionId_featureId: {
          planVersionId,
          featureId: feature.id,
        },
      },
    });

    if (!entitlement || !entitlement.enabled) {
      return { allowed: false, featureCode, reason: 'DISABLED' };
    }

    return { allowed: true, featureCode, reason: 'ENABLED' };
  }

  async evaluateFeature(planVersionId: string | null, featureCode: string): Promise<EntitlementDecision> {
    if (!planVersionId) {
      return { allowed: false, featureCode, reason: 'NO_ENTITLEMENT_CONTEXT' };
    }

    const feature = await this.prisma.featureDefinition.findUnique({
      where: { featureCode },
    });
    if (!feature) {
      return { allowed: false, featureCode, reason: 'FEATURE_NOT_FOUND' };
    }
    if (feature.status === FeatureStatus.INACTIVE) {
      return { allowed: false, featureCode, reason: 'DISABLED' };
    }

    const entitlement = await this.prisma.planEntitlement.findUnique({
      where: {
        planVersionId_featureId: {
          planVersionId,
          featureId: feature.id,
        },
      },
    });

    if (!entitlement) {
      return { allowed: false, featureCode, reason: 'NOT_ENTITLED' };
    }

    if (!entitlement.enabled) {
      return { allowed: false, featureCode, reason: 'DISABLED' };
    }

    return { allowed: true, featureCode, reason: 'ENABLED' };
  }

  async listEnabledFeatures(planVersionId: string) {
    const entitlements = await this.prisma.planEntitlement.findMany({
      where: { planVersionId, enabled: true },
      include: { feature: true },
    });
    return entitlements
      .filter((e) => e.feature.status === FeatureStatus.ACTIVE)
      .map((e) => e.feature);
  }
}
