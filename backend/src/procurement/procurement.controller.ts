import { Controller, Get, Post, Put, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProcurementService } from './procurement.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';

@ApiTags('Procurement Intelligence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/procurement')
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Post('vendors')
  @RequirePermissions(Permission.PROCUREMENT_CREATE)
  @ApiOperation({ summary: 'Register an approved supplier vendor' })
  async createVendor(@Body() body: any) {
    return this.procurementService.createVendor(body);
  }

  @Post('purchase-orders')
  @RequirePermissions(Permission.PROCUREMENT_CREATE)
  @ApiOperation({ summary: 'Create a new Purchase Order' })
  async createPurchaseOrder(@Request() req, @Body() body: any) {
    return this.procurementService.createPurchaseOrder({ ...body, createdBy: req.user?.email });
  }

  @Put('purchase-orders/:id/approve')
  @RequirePermissions(Permission.PROCUREMENT_UPDATE)
  @ApiOperation({ summary: 'Approve Purchase Order (Segregation of duties checked)' })
  async approvePurchaseOrder(@Request() req, @Param('id') id: string) {
    return this.procurementService.approvePurchaseOrder(id, req.user?.email || 'supervisor@fi360.com');
  }

  @Put('purchase-orders/:id/receive')
  @RequirePermissions(Permission.PROCUREMENT_UPDATE)
  @ApiOperation({ summary: 'Receive goods into workshop inventory stock' })
  async receiveGoods(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.procurementService.receiveGoods(id, body.receivedItems || [], req.user?.email);
  }
}
