import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateProductDto,
  UpdateProductDto,
  CreatePlanDto,
  UpdatePlanDto,
  CreatePlanVersionDto,
  CreatePlanPriceDto,
  UpdatePlanPriceDto,
  CreatePricingBandDto,
  UpdatePricingBandDto,
} from './dto/catalog.dto';
import { ProductStatus, PlanStatus, PlanVersionStatus } from '@prisma/client';

@Injectable()
export class ProductCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ────────────────────────────────────────────────────────────────────────────
  // PRODUCT SERVICE
  // ────────────────────────────────────────────────────────────────────────────

  async createProduct(dto: CreateProductDto, userEmail?: string) {
    const existing = await this.prisma.product.findUnique({
      where: { productKey: dto.productKey },
    });
    if (existing) {
      throw new ConflictException(`Product with key ${dto.productKey} already exists`);
    }

    const product = await this.prisma.product.create({
      data: {
        productKey: dto.productKey,
        name: dto.name,
        description: dto.description,
        status: dto.status || ProductStatus.DRAFT,
        displayOrder: dto.displayOrder || 0,
      },
    });

    await this.audit.logAction({
      module: 'PRODUCT_CATALOG',
      action: 'PRODUCT_CREATE',
      entityType: 'Product',
      entityId: product.id,
      userEmail,
      afterValue: product,
    });

    return product;
  }

  async updateProduct(id: string, dto: UpdateProductDto, userEmail?: string) {
    const original = await this.prisma.product.findUnique({ where: { id } });
    if (!original) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        status: dto.status,
        displayOrder: dto.displayOrder,
      },
    });

    await this.audit.logAction({
      module: 'PRODUCT_CATALOG',
      action: 'PRODUCT_UPDATE',
      entityType: 'Product',
      entityId: id,
      userEmail,
      beforeValue: original,
      afterValue: updated,
    });

    return updated;
  }

  async archiveProduct(id: string, userEmail?: string) {
    const original = await this.prisma.product.findUnique({ where: { id } });
    if (!original) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.ARCHIVED },
    });

    await this.audit.logAction({
      module: 'PRODUCT_CATALOG',
      action: 'PRODUCT_ARCHIVE',
      entityType: 'Product',
      entityId: id,
      userEmail,
      beforeValue: original,
      afterValue: updated,
    });

    return updated;
  }

  async findProducts() {
    return this.prisma.product.findMany({
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findProduct(idOrKey: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        OR: [{ id: idOrKey }, { productKey: idOrKey }],
      },
    });
    if (!product) {
      throw new NotFoundException(`Product ${idOrKey} not found`);
    }
    return product;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // PLAN SERVICE
  // ────────────────────────────────────────────────────────────────────────────

  async createPlan(dto: CreatePlanDto, userEmail?: string) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) {
      throw new NotFoundException(`Parent Product with ID ${dto.productId} not found`);
    }

    const existing = await this.prisma.plan.findUnique({
      where: {
        productId_planKey: {
          productId: dto.productId,
          planKey: dto.planKey,
        },
      },
    });
    if (existing) {
      throw new ConflictException(`Plan with key ${dto.planKey} already exists under this product`);
    }

    const plan = await this.prisma.plan.create({
      data: {
        productId: dto.productId,
        planKey: dto.planKey,
        name: dto.name,
        description: dto.description,
        status: dto.status || PlanStatus.DRAFT,
        displayOrder: dto.displayOrder || 0,
        isPublic: dto.isPublic || false,
      },
    });

    await this.audit.logAction({
      module: 'PRODUCT_CATALOG',
      action: 'PLAN_CREATE',
      entityType: 'Plan',
      entityId: plan.id,
      userEmail,
      afterValue: plan,
    });

    return plan;
  }

  async updatePlan(id: string, dto: UpdatePlanDto, userEmail?: string) {
    const original = await this.prisma.plan.findUnique({ where: { id } });
    if (!original) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    const updated = await this.prisma.plan.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        status: dto.status,
        displayOrder: dto.displayOrder,
        isPublic: dto.isPublic,
      },
    });

    await this.audit.logAction({
      module: 'PRODUCT_CATALOG',
      action: 'PLAN_UPDATE',
      entityType: 'Plan',
      entityId: id,
      userEmail,
      beforeValue: original,
      afterValue: updated,
    });

    return updated;
  }

  async archivePlan(id: string, userEmail?: string) {
    const original = await this.prisma.plan.findUnique({ where: { id } });
    if (!original) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    const updated = await this.prisma.plan.update({
      where: { id },
      data: { status: PlanStatus.ARCHIVED },
    });

    await this.audit.logAction({
      module: 'PRODUCT_CATALOG',
      action: 'PLAN_ARCHIVE',
      entityType: 'Plan',
      entityId: id,
      userEmail,
      beforeValue: original,
      afterValue: updated,
    });

    return updated;
  }

  async findPlans(productId?: string) {
    return this.prisma.plan.findMany({
      where: productId ? { productId } : {},
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findPlan(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }
    return plan;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // PLAN VERSION SERVICE
  // ────────────────────────────────────────────────────────────────────────────

  async createPlanVersion(dto: CreatePlanVersionDto, userEmail?: string) {
    if (!dto.planId) {
      throw new BadRequestException('planId is required');
    }
    const planId = dto.planId;

    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }

    const existing = await this.prisma.planVersion.findUnique({
      where: {
        planId_versionNumber: {
          planId,
          versionNumber: dto.versionNumber,
        },
      },
    });
    if (existing) {
      throw new ConflictException(`Version number ${dto.versionNumber} already exists for this plan`);
    }

    const start = new Date(dto.effectiveFrom);
    const end = dto.effectiveTo ? new Date(dto.effectiveTo) : null;
    if (end && start >= end) {
      throw new BadRequestException('effectiveFrom must be prior to effectiveTo');
    }

    const version = await this.prisma.planVersion.create({
      data: {
        planId,
        versionNumber: dto.versionNumber,
        effectiveFrom: start,
        effectiveTo: end,
        status: dto.status || PlanVersionStatus.DRAFT,
        pricingModel: dto.pricingModel || 'FLAT',
        currency: dto.currency || 'KES',
        billingInterval: dto.billingInterval || 'MONTHLY',
      },
    });

    await this.audit.logAction({
      module: 'PRODUCT_CATALOG',
      action: 'PLAN_VERSION_CREATE',
      entityType: 'PlanVersion',
      entityId: version.id,
      userEmail,
      afterValue: version,
    });

    return version;
  }

  async activatePlanVersion(id: string, userEmail?: string) {
    const version = await this.prisma.planVersion.findUnique({
      where: { id },
      include: { plan: { include: { product: true } } },
    });
    if (!version) {
      throw new NotFoundException(`PlanVersion with ID ${id} not found`);
    }

    if (version.plan.product.status !== ProductStatus.ACTIVE) {
      throw new BadRequestException('Parent Product must be ACTIVE to activate a plan version');
    }
    if (version.plan.status !== PlanStatus.ACTIVE) {
      throw new BadRequestException('Parent Plan must be ACTIVE to activate a plan version');
    }

    const start = new Date(version.effectiveFrom);
    const end = version.effectiveTo ? new Date(version.effectiveTo) : null;

    // Check overlapping ACTIVE versions for the same Plan
    const activeVersions = await this.prisma.planVersion.findMany({
      where: {
        planId: version.planId,
        status: PlanVersionStatus.ACTIVE,
        id: { not: id },
      },
    });

    for (const av of activeVersions) {
      const avStart = new Date(av.effectiveFrom);
      const avEnd = av.effectiveTo ? new Date(av.effectiveTo) : null;

      const overlap = (
        (!end || avStart < end) &&
        (!avEnd || start < avEnd)
      );

      if (overlap) {
        throw new BadRequestException(
          `Activation failed: Overlaps with existing ACTIVE version ${av.versionNumber}`,
        );
      }
    }

    const updated = await this.prisma.planVersion.update({
      where: { id },
      data: { status: PlanVersionStatus.ACTIVE },
    });

    await this.audit.logAction({
      module: 'PRODUCT_CATALOG',
      action: 'PLAN_VERSION_ACTIVATE',
      entityType: 'PlanVersion',
      entityId: id,
      userEmail,
      beforeValue: version,
      afterValue: updated,
    });

    return updated;
  }

  async supersedePlanVersion(id: string, userEmail?: string) {
    const version = await this.prisma.planVersion.findUnique({ where: { id } });
    if (!version) {
      throw new NotFoundException(`PlanVersion with ID ${id} not found`);
    }

    const updated = await this.prisma.planVersion.update({
      where: { id },
      data: { status: PlanVersionStatus.SUPERSEDED },
    });

    await this.audit.logAction({
      module: 'PRODUCT_CATALOG',
      action: 'PLAN_VERSION_SUPERSEDE',
      entityType: 'PlanVersion',
      entityId: id,
      userEmail,
      beforeValue: version,
      afterValue: updated,
    });

    return updated;
  }

  async findPlanVersions(planId: string) {
    return this.prisma.planVersion.findMany({
      where: { planId },
      orderBy: { versionNumber: 'desc' },
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // PRICE SERVICE
  // ────────────────────────────────────────────────────────────────────────────

  async createPlanPrice(versionId: string, dto: CreatePlanPriceDto, userEmail?: string) {
    const version = await this.prisma.planVersion.findUnique({ where: { id: versionId } });
    if (!version) {
      throw new NotFoundException(`PlanVersion with ID ${versionId} not found`);
    }

    if (dto.amount !== undefined && dto.amount < 0) {
      throw new BadRequestException('Price amount must be greater than or equal to 0');
    }

    const start = dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date();
    const end = dto.effectiveTo ? new Date(dto.effectiveTo) : null;
    if (end && start >= end) {
      throw new BadRequestException('effectiveFrom must be prior to effectiveTo');
    }

    const price = await this.prisma.planPrice.create({
      data: {
        planVersionId: versionId,
        currency: dto.currency,
        billingInterval: dto.billingInterval,
        amount: dto.amount,
        isDefault: dto.isDefault !== undefined ? dto.isDefault : true,
        effectiveFrom: start,
        effectiveTo: end,
      },
    });

    await this.audit.logAction({
      module: 'PRODUCT_CATALOG',
      action: 'PLAN_PRICE_CREATE',
      entityType: 'PlanPrice',
      entityId: price.id,
      userEmail,
      afterValue: price,
    });

    return price;
  }

  async updatePlanPrice(priceId: string, dto: UpdatePlanPriceDto, userEmail?: string) {
    const original = await this.prisma.planPrice.findUnique({ where: { id: priceId } });
    if (!original) {
      throw new NotFoundException(`PlanPrice with ID ${priceId} not found`);
    }

    if (dto.amount !== undefined && dto.amount < 0) {
      throw new BadRequestException('Price amount must be greater than or equal to 0');
    }

    const start = dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date(original.effectiveFrom);
    const end = dto.effectiveTo ? new Date(dto.effectiveTo) : (original.effectiveTo ? new Date(original.effectiveTo) : null);
    if (end && start >= end) {
      throw new BadRequestException('effectiveFrom must be prior to effectiveTo');
    }

    const updated = await this.prisma.planPrice.update({
      where: { id: priceId },
      data: {
        amount: dto.amount,
        isDefault: dto.isDefault,
        effectiveFrom: dto.effectiveFrom ? start : undefined,
        effectiveTo: dto.effectiveTo !== undefined ? end : undefined,
      },
    });

    await this.audit.logAction({
      module: 'PRODUCT_CATALOG',
      action: 'PLAN_PRICE_UPDATE',
      entityType: 'PlanPrice',
      entityId: priceId,
      userEmail,
      beforeValue: original,
      afterValue: updated,
    });

    return updated;
  }

  async findPlanPrices(versionId: string) {
    return this.prisma.planPrice.findMany({
      where: { planVersionId: versionId },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // VEHICLE PRICING BANDS SERVICE
  // ────────────────────────────────────────────────────────────────────────────

  async createPricingBand(versionId: string, dto: CreatePricingBandDto, userEmail?: string) {
    const version = await this.prisma.planVersion.findUnique({ where: { id: versionId } });
    if (!version) {
      throw new NotFoundException(`PlanVersion with ID ${versionId} not found`);
    }

    if (dto.minVehicles < 0) {
      throw new BadRequestException('minVehicles must be greater than or equal to 0');
    }
    if (dto.maxVehicles !== undefined && dto.maxVehicles !== null && dto.maxVehicles < dto.minVehicles) {
      throw new BadRequestException('maxVehicles must be greater than or equal to minVehicles');
    }

    const start = dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date();
    const end = dto.effectiveTo ? new Date(dto.effectiveTo) : null;
    if (end && start >= end) {
      throw new BadRequestException('effectiveFrom must be prior to effectiveTo');
    }

    // Overlap checks for the same currency, billingInterval, and PlanVersion
    const existingBands = await this.prisma.planVehiclePricingBand.findMany({
      where: {
        planVersionId: versionId,
        currency: dto.currency,
        billingInterval: dto.billingInterval,
      },
    });

    const isNewOpenEnded = dto.maxVehicles === null || dto.maxVehicles === undefined;

    for (const b of existingBands) {
      const bMin = b.minVehicles;
      const bMax = b.maxVehicles === null ? Infinity : b.maxVehicles;
      const newMin = dto.minVehicles;
      const newMax = (dto.maxVehicles === null || dto.maxVehicles === undefined) ? Infinity : dto.maxVehicles;

      // Reject multiple open-ended bands
      if (isNewOpenEnded && b.maxVehicles === null) {
        throw new BadRequestException('Only one open-ended band is allowed per plan version, currency, and interval');
      }

      // Check range overlaps
      const overlap = (newMin <= bMax && newMax >= bMin);
      if (overlap) {
        throw new BadRequestException(`Overlapping range rejected: Range [${newMin}, ${newMax === Infinity ? 'NULL' : newMax}] overlaps with existing band [${bMin}, ${b.maxVehicles === null ? 'NULL' : b.maxVehicles}]`);
      }
    }

    const band = await this.prisma.planVehiclePricingBand.create({
      data: {
        planVersionId: versionId,
        minVehicles: dto.minVehicles,
        maxVehicles: dto.maxVehicles,
        pricePerVehicle: dto.pricePerVehicle,
        flatPrice: dto.flatPrice,
        currency: dto.currency,
        billingInterval: dto.billingInterval,
        effectiveFrom: start,
        effectiveTo: end,
      },
    });

    await this.audit.logAction({
      module: 'PRODUCT_CATALOG',
      action: 'PRICING_BAND_CREATE',
      entityType: 'PlanVehiclePricingBand',
      entityId: band.id,
      userEmail,
      afterValue: band,
    });

    return band;
  }

  async updatePricingBand(bandId: string, dto: UpdatePricingBandDto, userEmail?: string) {
    const original = await this.prisma.planVehiclePricingBand.findUnique({ where: { id: bandId } });
    if (!original) {
      throw new NotFoundException(`Pricing band with ID ${bandId} not found`);
    }

    const minVehicles = dto.minVehicles !== undefined ? dto.minVehicles : original.minVehicles;
    const maxVehicles = dto.maxVehicles !== undefined ? dto.maxVehicles : original.maxVehicles;

    if (minVehicles < 0) {
      throw new BadRequestException('minVehicles must be greater than or equal to 0');
    }
    if (maxVehicles !== null && maxVehicles !== undefined && maxVehicles < minVehicles) {
      throw new BadRequestException('maxVehicles must be greater than or equal to minVehicles');
    }

    const start = dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date(original.effectiveFrom);
    const end = dto.effectiveTo ? new Date(dto.effectiveTo) : (original.effectiveTo ? new Date(original.effectiveTo) : null);
    if (end && start >= end) {
      throw new BadRequestException('effectiveFrom must be prior to effectiveTo');
    }

    const isNewOpenEnded = maxVehicles === null || maxVehicles === undefined;

    const existingBands = await this.prisma.planVehiclePricingBand.findMany({
      where: {
        planVersionId: original.planVersionId,
        currency: original.currency,
        billingInterval: original.billingInterval,
        id: { not: bandId },
      },
    });

    for (const b of existingBands) {
      const bMin = b.minVehicles;
      const bMax = b.maxVehicles === null ? Infinity : b.maxVehicles;
      const newMin = minVehicles;
      const newMax = (maxVehicles === null || maxVehicles === undefined) ? Infinity : maxVehicles;

      if (isNewOpenEnded && b.maxVehicles === null) {
        throw new BadRequestException('Only one open-ended band is allowed per plan version, currency, and interval');
      }

      const overlap = (newMin <= bMax && newMax >= bMin);
      if (overlap) {
        throw new BadRequestException(`Overlapping range rejected: Range [${newMin}, ${newMax === Infinity ? 'NULL' : newMax}] overlaps with existing band [${bMin}, ${b.maxVehicles === null ? 'NULL' : b.maxVehicles}]`);
      }
    }

    const updated = await this.prisma.planVehiclePricingBand.update({
      where: { id: bandId },
      data: {
        minVehicles: dto.minVehicles,
        maxVehicles: dto.maxVehicles,
        pricePerVehicle: dto.pricePerVehicle,
        flatPrice: dto.flatPrice,
        effectiveFrom: dto.effectiveFrom ? start : undefined,
        effectiveTo: dto.effectiveTo !== undefined ? end : undefined,
      },
    });

    await this.audit.logAction({
      module: 'PRODUCT_CATALOG',
      action: 'PRICING_BAND_UPDATE',
      entityType: 'PlanVehiclePricingBand',
      entityId: bandId,
      userEmail,
      beforeValue: original,
      afterValue: updated,
    });

    return updated;
  }

  async findPricingBands(versionId: string) {
    return this.prisma.planVehiclePricingBand.findMany({
      where: { planVersionId: versionId },
      orderBy: { minVehicles: 'asc' },
    });
  }
}
