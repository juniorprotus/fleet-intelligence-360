import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventPublisherService } from '../events/event-publisher.service';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  /**
   * Register a new spare part / tyre casing item catalogue master
   */
  async createItem(dto: {
    partNumber: string;
    name: string;
    description?: string;
    category?: any;
    unitOfMeasure?: string;
    defaultUnitCost?: number;
  }) {
    const existing = await this.prisma.inventoryItem.findUnique({ where: { partNumber: dto.partNumber } });
    if (existing) {
      return existing;
    }

    const item = await this.prisma.inventoryItem.create({
      data: {
        partNumber: dto.partNumber,
        tenantId: 'TNT-DEFAULT',
        organizationId: 'ORG-DEFAULT',
        name: dto.name,
        description: dto.description,
        category: dto.category || 'GENERAL_SPARE',
        unitOfMeasure: dto.unitOfMeasure || 'EA',
        defaultUnitCost: dto.defaultUnitCost || 0,
      },
    });

    this.logger.log(`Created Inventory Item: ${item.partNumber} - ${item.name}`);
    return item;
  }

  /**
   * Seed / Update Workshop Stock Ledger
   */
  async seedStock(dto: {
    workshopId: string;
    itemId: string;
    quantityOnHand: number;
    reorderPoint?: number;
    reorderQuantity?: number;
    unitCost?: number;
  }) {
    const workshop = await this.prisma.workshop.findUnique({ where: { id: dto.workshopId } });
    if (!workshop) throw new NotFoundException(`Workshop #${dto.workshopId} not found`);

    const item = await this.prisma.inventoryItem.findUnique({ where: { id: dto.itemId } });
    if (!item) throw new NotFoundException(`InventoryItem #${dto.itemId} not found`);

    const stock = await this.prisma.inventoryStock.upsert({
      where: {
        workshopId_itemId: { workshopId: dto.workshopId, itemId: dto.itemId },
      },
      create: {
        tenantId: 'TNT-DEFAULT',
        organizationId: 'ORG-DEFAULT',
        workshopId: dto.workshopId,
        itemId: dto.itemId,
        quantityOnHand: dto.quantityOnHand,
        reorderPoint: dto.reorderPoint || 5,
        reorderQuantity: dto.reorderQuantity || 20,
        unitCost: dto.unitCost || item.defaultUnitCost || 0,
      },
      update: {
        quantityOnHand: dto.quantityOnHand,
        unitCost: dto.unitCost || item.defaultUnitCost || 0,
      },
    });

    // Record Opening Balance in InventoryMovement ledger
    await this.prisma.inventoryMovement.create({
      data: {
        tenantId: 'TNT-DEFAULT',
        organizationId: 'ORG-DEFAULT',
        workshopId: dto.workshopId,
        itemId: dto.itemId,
        movementType: 'OPENING_BALANCE',
        quantity: dto.quantityOnHand,
        unitCost: stock.unitCost,
        totalCost: stock.unitCost * dto.quantityOnHand,
        balanceAfter: dto.quantityOnHand,
        reference: 'Initial Stock Seed',
      },
    });

    this.logger.log(`Stock seeded for ${item.partNumber} at Workshop ${dto.workshopId}: ${stock.quantityOnHand} on hand.`);
    return stock;
  }

  /**
   * Requisition & Issue parts to a Work Order with atomic movement ledger logging
   */
  async requestAndIssueParts(dto: {
    workOrderId: string;
    itemId: string;
    quantity: number;
    requestedById: number;
  }) {
    const wo = await this.prisma.workOrder.findUnique({ where: { id: dto.workOrderId } });
    if (!wo) throw new NotFoundException(`WorkOrder #${dto.workOrderId} not found`);

    const stock = await this.prisma.inventoryStock.findUnique({
      where: { workshopId_itemId: { workshopId: wo.workshopId, itemId: dto.itemId } },
      include: { item: true },
    });

    if (!stock) {
      throw new NotFoundException(`Stock record for item #${dto.itemId} not found at workshop #${wo.workshopId}`);
    }

    if (stock.quantityOnHand < dto.quantity) {
      throw new BadRequestException(
        `Insufficient stock: Required ${dto.quantity}, but only ${stock.quantityOnHand} on hand at workshop.`,
      );
    }

    const unitCost = stock.unitCost || stock.item.defaultUnitCost || 0;
    const totalCost = unitCost * dto.quantity;
    const newBalance = stock.quantityOnHand - dto.quantity;
    const reqNumber = `REQ-${Date.now().toString().slice(-6)}`;

    // 1. Create PartsRequisition
    const requisition = await this.prisma.partsRequisition.create({
      data: {
        reqNumber,
        tenantId: wo.tenantId,
        organizationId: wo.organizationId,
        workOrderId: wo.id,
        itemId: dto.itemId,
        quantity: dto.quantity,
        unitCost,
        totalCost,
        status: 'ISSUED',
        requestedById: dto.requestedById,
        issuedAt: new Date(),
      },
    });

    // 2. Deduct stock position
    const updatedStock = await this.prisma.inventoryStock.update({
      where: { id: stock.id },
      data: { quantityOnHand: newBalance },
    });

    // 3. Log immutable InventoryMovement ledger entry
    await this.prisma.inventoryMovement.create({
      data: {
        tenantId: wo.tenantId,
        organizationId: wo.organizationId,
        workshopId: wo.workshopId,
        itemId: dto.itemId,
        movementType: 'ISSUE',
        quantity: -dto.quantity,
        unitCost,
        totalCost,
        balanceAfter: newBalance,
        workOrderId: wo.id,
        requisitionId: requisition.id,
        reference: `Issued to Work Order ${wo.workOrderNumber}`,
        performedById: String(dto.requestedById),
      },
    });

    // 4. Update WorkOrder parts cost
    await this.prisma.workOrder.update({
      where: { id: wo.id },
      data: { totalPartsCost: wo.totalPartsCost + totalCost },
    });

    // 5. Emit inventory.issued event
    await this.eventPublisher.publish({
      eventType: 'inventory.issued',
      entityId: requisition.id,
      entityType: 'PartsRequisition',
      actorId: String(dto.requestedById),
      payload: {
        requisitionId: requisition.id,
        reqNumber: requisition.reqNumber,
        workOrderId: wo.id,
        itemId: dto.itemId,
        quantity: dto.quantity,
        unitCost,
        totalCost,
        workshopId: wo.workshopId,
      },
    });

    // 6. Low stock check & auto-reorder trigger
    if (newBalance < stock.reorderPoint) {
      await this.eventPublisher.publish({
        eventType: 'inventory.reorder_triggered',
        entityId: stock.id,
        entityType: 'InventoryStock',
        actorId: 'SYSTEM',
        payload: {
          stockId: stock.id,
          workshopId: wo.workshopId,
          itemId: dto.itemId,
          quantityOnHand: newBalance,
          reorderPoint: stock.reorderPoint,
          reorderQuantity: stock.reorderQuantity,
        },
      });
      this.logger.warn(`LOW STOCK WARNING: Item ${stock.item.partNumber} at Workshop ${wo.workshopId} has ${newBalance} on hand (Reorder threshold: ${stock.reorderPoint}).`);
    }

    return requisition;
  }

  async getStockByWorkshop(workshopId: string) {
    return this.prisma.inventoryStock.findMany({
      where: { workshopId },
      include: { item: true, workshop: true },
    });
  }

  async getMovements(workshopId?: string) {
    const where: any = {};
    if (workshopId) where.workshopId = workshopId;

    return this.prisma.inventoryMovement.findMany({
      where,
      include: { item: true, workshop: true, workOrder: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
