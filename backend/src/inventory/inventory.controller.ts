import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';

@ApiTags('Inventory Intelligence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('items')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  @ApiOperation({ summary: 'Register a new spare part / casing catalogue item' })
  async createItem(@Body() body: any) {
    return this.inventoryService.createItem(body);
  }

  @Post('stock/seed')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  @ApiOperation({ summary: 'Seed or update workshop stock position' })
  async seedStock(@Body() body: any) {
    return this.inventoryService.seedStock(body);
  }

  @Post('requisitions')
  @RequirePermissions(Permission.INVENTORY_UPDATE)
  @ApiOperation({ summary: 'Requisition & issue spare parts against a Work Order' })
  async requestAndIssueParts(@Request() req, @Body() body: any) {
    const userId = req.user?.id || 1;
    return this.inventoryService.requestAndIssueParts({ ...body, requestedById: userId });
  }

  @Get('stock')
  @RequirePermissions(Permission.INVENTORY_READ)
  @ApiOperation({ summary: 'Get inventory stock by workshop' })
  async getStock(@Query('workshopId') workshopId: string) {
    return this.inventoryService.getStockByWorkshop(workshopId || 'a2a40432-ddd2-4918-ba63-b6c46bcc4e0e');
  }

  @Get('movements')
  @RequirePermissions(Permission.INVENTORY_READ)
  @ApiOperation({ summary: 'Get auditable inventory movement ledger' })
  async getMovements(@Query('workshopId') workshopId?: string) {
    return this.inventoryService.getMovements(workshopId);
  }
}
