import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { RequiresFeature } from './requires-feature.decorator';
import { EntitlementGuard } from './entitlement.guard';

@ApiTags('Commercial Entitlement Integration Tests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, EntitlementGuard)
@Controller('api/v1/entitlement-test')
export class EntitlementTestController {

  @Get('reporting')
  @RequirePermissions(Permission.REPORTS_READ)
  @RequiresFeature('REPORTING')
  @ApiOperation({ summary: 'Read-only test endpoint for verifying runtime entitlement guard sequences' })
  async testReportingEntitlement() {
    return {
      status: 'success',
      message: 'Access granted. Entitlement layer verified successfully.',
    };
  }
}
