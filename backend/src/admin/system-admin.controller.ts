import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { SystemAdminService } from './system-admin.service';

@Controller('api/v1/system-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class SystemAdminController {
  constructor(private readonly adminService: SystemAdminService) {}

  @Get('kpis')
  async getKPIs() {
    return this.adminService.getGovernanceKPIs();
  }

  @Get('kpis/:kpiKey/drilldown')
  async getDrillDown(@Param('kpiKey') kpiKey: string) {
    return this.adminService.getSystemDrillDown(kpiKey);
  }

  @Get('reports/:reportId')
  async getReport(@Param('reportId') reportId: string, @Query() query: any) {
    return this.adminService.generateSystemReport(reportId, query);
  }

  @Post('corrections')
  async executeDataCorrection(@Request() req: any, @Body() body: any) {
    return this.adminService.executeDataCorrection(body, req.user);
  }

  @Get('corrections')
  async getDataCorrections(@Query('domain') domain?: string, @Query('entityType') entityType?: string) {
    return this.adminService.getDataCorrections({ domain, entityType });
  }
}
