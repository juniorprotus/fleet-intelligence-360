import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WorkshopService } from './workshop.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';

@ApiTags('Workshop Intelligence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1')
export class WorkshopController {
  constructor(private readonly workshopService: WorkshopService) {}

  @Post('work-orders')
  @RequirePermissions(Permission.WORKSHOP_CREATE)
  @ApiOperation({ summary: 'Create a new maintenance Work Order' })
  async create(@Request() req, @Body() body: any) {
    return this.workshopService.create(body, req.user?.email || req.user?.id);
  }

  @Get('work-orders')
  @RequirePermissions(Permission.WORKSHOP_READ)
  @ApiOperation({ summary: 'List all Work Orders with scoped filters' })
  async findAll(
    @Query('vehicleId') vehicleId?: string,
    @Query('workshopId') workshopId?: string,
    @Query('status') status?: string,
  ) {
    return this.workshopService.findAll({ vehicleId, workshopId, status });
  }

  @Get('work-orders/:id')
  @RequirePermissions(Permission.WORKSHOP_READ)
  @ApiOperation({ summary: 'Get detailed Work Order by ID' })
  async findOne(@Param('id') id: string) {
    return this.workshopService.findOne(id);
  }

  @Post('work-orders/:id/tasks')
  @RequirePermissions(Permission.WORKSHOP_UPDATE)
  @ApiOperation({ summary: 'Add a maintenance task to a Work Order' })
  async addTask(@Param('id') id: string, @Body() body: any) {
    return this.workshopService.addTask(id, body);
  }

  @Put('work-orders/:id/complete')
  @RequirePermissions(Permission.WORKSHOP_UPDATE)
  @ApiOperation({ summary: 'Execute Quality & Safety Sign-off and trigger Vehicle Recovery' })
  async completeWorkOrder(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.workshopService.completeWorkOrder(id, body, req.user?.email || req.user?.id);
  }

  @Get('maintenance-schedules')
  @RequirePermissions(Permission.WORKSHOP_READ)
  @ApiOperation({ summary: 'Get active Preventative Maintenance Schedule triggers' })
  async getMaintenanceSchedules() {
    return this.workshopService.getMaintenanceSchedules();
  }
}
