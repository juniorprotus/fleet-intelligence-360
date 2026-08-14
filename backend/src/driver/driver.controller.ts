import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DriverService } from './driver.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';

@ApiTags('Driver Intelligence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/driver-intelligence')
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Post('assignments')
  @RequirePermissions(Permission.DRIVER_READ)
  @ApiOperation({ summary: 'Assign a driver to a vehicle shift' })
  async assignDriver(@Body() body: any) {
    return this.driverService.assignDriver(body);
  }

  @Put('assignments/:id/complete')
  @RequirePermissions(Permission.DRIVER_READ)
  @ApiOperation({ summary: 'Complete shift assignment' })
  async completeAssignment(@Param('id') id: string, @Body() body: any) {
    return this.driverService.completeAssignment(id, body.endOdometer);
  }

  @Post('inspections')
  @RequirePermissions(Permission.DRIVER_READ)
  @ApiOperation({ summary: 'Submit digital Pre-Trip / Post-Trip Inspection form' })
  async submitTripInspection(@Request() req, @Body() body: any) {
    const driverId = req.user?.id || body.driverId || 1;
    return this.driverService.submitTripInspection({ ...body, driverId });
  }

  @Get('assignments')
  @RequirePermissions(Permission.DRIVER_READ)
  @ApiOperation({ summary: 'Get shift assignments' })
  async getAssignments(@Query('driverId') driverId?: string) {
    return this.driverService.getAssignments(driverId ? parseInt(driverId, 10) : undefined);
  }

  @Get('inspections')
  @RequirePermissions(Permission.DRIVER_READ)
  @ApiOperation({ summary: 'Get trip inspections' })
  async getInspections(@Query('vehicleId') vehicleId?: string) {
    return this.driverService.getInspections(vehicleId);
  }
}
