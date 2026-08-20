import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsageService } from './usage.service';

@ApiTags('Usage & Limits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/usage')
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get current usage and limits summary for the authenticated tenant' })
  async getSummary(@Request() req) {
    const tenantId = req.user?.tenantId;
    return this.usageService.getUsageSummary(tenantId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Alias for getSummary' })
  async getMe(@Request() req) {
    const tenantId = req.user?.tenantId;
    return this.usageService.getUsageSummary(tenantId);
  }
}
