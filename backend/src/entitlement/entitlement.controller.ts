import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { EntitlementService } from './entitlement.service';
import { DevelopmentEntitlementContextResolver } from './development-entitlement-resolver';
import { CreateFeatureDto, UpdateFeatureDto, CreatePlanEntitlementDto, UpdatePlanEntitlementDto } from './dto/entitlement.dto';

@ApiTags('Commercial Entitlement & Feature Access')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/entitlement')
export class EntitlementController {
  constructor(
    private readonly service: EntitlementService,
    private readonly resolver: DevelopmentEntitlementContextResolver,
  ) {}

  // ─── FEATURE DEFINITIONS ───────────────────────────────────────────────────

  @Get('my-features')
  @ApiOperation({ summary: 'Get enabled features for the current user tenant' })
  async getMyFeatures(@Request() req) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return [];
    const planVersionId = await this.resolver.resolvePlanVersion(tenantId);
    if (!planVersionId) return [];
    
    const features = await this.service.listEnabledFeatures(planVersionId);
    return features.map(f => f.featureCode);
  }

  @Get('features')
  @RequirePermissions(Permission.PRODUCT_CATALOG_READ)
  @ApiOperation({ summary: 'Get all feature definitions' })
  async getFeatures() {
    return this.service.getFeatures();
  }

  @Post('features')
  @RequirePermissions(Permission.PRODUCT_CATALOG_MANAGE)
  @ApiOperation({ summary: 'Create a feature definition' })
  async createFeature(@Request() req, @Body() dto: CreateFeatureDto) {
    const userEmail = req.user?.email || req.user?.id;
    return this.service.createFeature(dto, userEmail);
  }

  @Patch('features/:id')
  @RequirePermissions(Permission.PRODUCT_CATALOG_MANAGE)
  @ApiOperation({ summary: 'Update a feature definition' })
  async updateFeature(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateFeatureDto,
  ) {
    const userEmail = req.user?.email || req.user?.id;
    return this.service.updateFeature(id, dto, userEmail);
  }

  // ─── PLAN ENTITLEMENTS ─────────────────────────────────────────────────────

  @Get('entitlements')
  @RequirePermissions(Permission.PRODUCT_CATALOG_READ)
  @ApiOperation({ summary: 'Get plan entitlements, optionally filtered by planVersionId' })
  async getPlanEntitlements(@Query('planVersionId') planVersionId?: string) {
    return this.service.getPlanEntitlements(planVersionId);
  }

  @Post('entitlements')
  @RequirePermissions(Permission.PRODUCT_CATALOG_MANAGE)
  @ApiOperation({ summary: 'Create a plan version entitlement mapping' })
  async createPlanEntitlement(@Request() req, @Body() dto: CreatePlanEntitlementDto) {
    const userEmail = req.user?.email || req.user?.id;
    return this.service.createPlanEntitlement(dto, userEmail);
  }

  @Patch('entitlements/:id')
  @RequirePermissions(Permission.PRODUCT_CATALOG_MANAGE)
  @ApiOperation({ summary: 'Update a plan version entitlement mapping' })
  async updatePlanEntitlement(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdatePlanEntitlementDto,
  ) {
    const userEmail = req.user?.email || req.user?.id;
    return this.service.updatePlanEntitlement(id, dto, userEmail);
  }
}
