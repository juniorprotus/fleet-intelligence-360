import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventPublisherService } from '../events/event-publisher.service';
import { ApprovalWorkflowService } from '../workflow/approval-workflow.service';

@Injectable()
export class ProcurementService {
  private readonly logger = new Logger(ProcurementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: EventPublisherService,
    private readonly workflowService: ApprovalWorkflowService,
  ) {}

  async createVendor(dto: { vendorCode: string; name: string; contactEmail?: string; phone?: string; address?: string }) {
    const existing = await this.prisma.vendor.findUnique({ where: { vendorCode: dto.vendorCode } });
    if (existing) return existing;

    return this.prisma.vendor.create({
      data: {
        vendorCode: dto.vendorCode,
        tenantId: 'TNT-DEFAULT',
        organizationId: 'ORG-DEFAULT',
        name: dto.name,
        contactEmail: dto.contactEmail,
        phone: dto.phone,
        address: dto.address,
      },
    });
  }

  async createPurchaseOrder(dto: {
    vendorId: string;
    workshopId: string;
    items: { itemId: string; quantityOrdered: number; unitPrice: number }[];
    createdBy?: string;
  }) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: dto.vendorId } });
    if (!vendor) throw new NotFoundException(`Vendor #${dto.vendorId} not found`);

    const workshop = await this.prisma.workshop.findUnique({ where: { id: dto.workshopId } });
    if (!workshop) throw new NotFoundException(`Workshop #${dto.workshopId} not found`);

    const poNumber = `PO-${Date.now().toString().slice(-6)}`;
    let totalAmount = 0;

    const poItemsData = dto.items.map((i) => {
      const itemTotal = i.quantityOrdered * i.unitPrice;
      totalAmount += itemTotal;
      return {
        itemId: i.itemId,
        quantityOrdered: i.quantityOrdered,
        unitPrice: i.unitPrice,
        totalPrice: itemTotal,
      };
    });

    const po = await this.prisma.purchaseOrder.create({
      data: {
        poNumber,
        tenantId: 'TNT-DEFAULT',
        organizationId: 'ORG-DEFAULT',
        vendorId: dto.vendorId,
        workshopId: dto.workshopId,
        status: 'DRAFT',
        totalAmount,
        items: {
          create: poItemsData,
        },
      },
      include: { vendor: true, workshop: true, items: { include: { item: true } } },
    });

    await this.eventPublisher.publish({
      eventType: 'procurement.po_created',
      entityId: po.id,
      entityType: 'PurchaseOrder',
      actorId: dto.createdBy || 'SYSTEM',
      payload: {
        poId: po.id,
        poNumber: po.poNumber,
        vendorId: po.vendorId,
        workshopId: po.workshopId,
        totalAmount: po.totalAmount,
      },
    });

    this.logger.log(`Created Purchase Order ${po.poNumber} (Total: $${po.totalAmount})`);
    return po;
  }

  async approvePurchaseOrder(poId: string, approverId: string, creatorId?: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id: poId } });
    if (!po) throw new NotFoundException(`PurchaseOrder #${poId} not found`);

    if (po.totalAmount > 1000 && creatorId) {
      this.workflowService.validateSegregationOfDuties(creatorId, approverId);
    }

    return this.prisma.purchaseOrder.update({
      where: { id: poId },
      data: { status: 'APPROVED', approvedBy: approverId },
      include: { items: true, vendor: true },
    });
  }

  async receiveGoods(poId: string, receivedItems: { poItemId: number; quantityReceived: number }[], actorId?: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { items: { include: { item: true } }, workshop: true },
    });
    if (!po) throw new NotFoundException(`PurchaseOrder #${poId} not found`);

    let totalValueReceived = 0;

    for (const rItem of receivedItems) {
      const poItem = po.items.find((i) => i.id === rItem.poItemId);
      if (!poItem) continue;

      const newReceivedQty = poItem.quantityReceived + rItem.quantityReceived;
      await this.prisma.purchaseOrderItem.update({
        where: { id: poItem.id },
        data: { quantityReceived: newReceivedQty },
      });

      // Update InventoryStock position
      const stock = await this.prisma.inventoryStock.upsert({
        where: { workshopId_itemId: { workshopId: po.workshopId, itemId: poItem.itemId } },
        create: {
          tenantId: po.tenantId,
          organizationId: po.organizationId,
          workshopId: po.workshopId,
          itemId: poItem.itemId,
          quantityOnHand: rItem.quantityReceived,
          unitCost: poItem.unitPrice,
        },
        update: {
          quantityOnHand: { increment: rItem.quantityReceived },
          unitCost: poItem.unitPrice,
        },
      });

      // Record RECEIPT in InventoryMovement ledger
      await this.prisma.inventoryMovement.create({
        data: {
          tenantId: po.tenantId,
          organizationId: po.organizationId,
          workshopId: po.workshopId,
          itemId: poItem.itemId,
          movementType: 'RECEIPT',
          quantity: rItem.quantityReceived,
          unitCost: poItem.unitPrice,
          totalCost: poItem.unitPrice * rItem.quantityReceived,
          balanceAfter: stock.quantityOnHand,
          poId: po.id,
          reference: `Goods Receipt from PO ${po.poNumber}`,
          performedById: actorId || 'SYSTEM',
        },
      });

      totalValueReceived += poItem.unitPrice * rItem.quantityReceived;
    }

    const updatedPO = await this.prisma.purchaseOrder.update({
      where: { id: po.id },
      data: { status: 'RECEIVED' },
      include: { items: true, vendor: true, workshop: true },
    });

    await this.eventPublisher.publish({
      eventType: 'procurement.po_received',
      entityId: po.id,
      entityType: 'PurchaseOrder',
      actorId: actorId || 'SYSTEM',
      payload: {
        poId: po.id,
        poNumber: po.poNumber,
        workshopId: po.workshopId,
        receivedItemsCount: receivedItems.length,
        totalValueReceived,
      },
    });

    this.logger.log(`Received Goods for PO ${po.poNumber}. Total value: $${totalValueReceived}`);
    return updatedPO;
  }
}
