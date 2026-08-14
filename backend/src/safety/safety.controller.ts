import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SafetyService } from './safety.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';

@ApiTags('Safety Intelligence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/safety')
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  @Post('incidents')
  @RequirePermissions(Permission.SAFETY_CREATE)
  @ApiOperation({ summary: 'Log a driver safety incident' })
  async logIncident(@Body() body: any) {
    return this.safetyService.logIncident(body);
  }

  @Get('incidents')
  @RequirePermissions(Permission.SAFETY_READ)
  @ApiOperation({ summary: 'Get list of safety incidents' })
  async getIncidents() {
    return this.safetyService.getIncidents();
  }

  @Get('scores/:driverId')
  @RequirePermissions(Permission.SAFETY_READ)
  @ApiOperation({ summary: 'Get driver monthly safety score' })
  async getDriverSafetyScore(@Param('driverId') driverId: string, @Query('month') month?: string) {
    return this.safetyService.getDriverSafetyScore(parseInt(driverId, 10), month);
  }
}
