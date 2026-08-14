import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { UniversalReportService } from './universal-report.service';

@Controller('api/v1/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UniversalReportController {
  constructor(private readonly reportService: UniversalReportService) {}

  @Get('catalogue')
  getCatalogue(@Req() req: any) {
    const userRole = req.user?.role || 'SUPER_ADMIN';
    return {
      role: userRole,
      reports: this.reportService.getReportCatalogueForRole(userRole),
    };
  }

  @Post('generate')
  async generateReport(@Req() req: any, @Body() body: any) {
    const userEmail = req.user?.email || 'admin@fi360.com';
    const userRole = req.user?.role || 'SUPER_ADMIN';
    const reportType = body.reportType || 'system-health';
    const format = body.format || 'CSV';
    const filters = body.filters || {};

    return this.reportService.generateReport({
      reportType,
      userEmail,
      userRole,
      format,
      filters,
    });
  }
}
