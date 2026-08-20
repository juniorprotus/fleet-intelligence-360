import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { ProductCatalogService } from './product-catalog.service';
import {
  CreateProductDto,
  UpdateProductDto,
  CreatePlanDto,
  UpdatePlanDto,
  CreatePlanVersionDto,
  CreatePlanPriceDto,
  UpdatePlanPriceDto,
  CreatePricingBandDto,
  UpdatePricingBandDto,
} from './dto/catalog.dto';

@ApiTags('Product Catalog & Pricing Plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/catalog')
export class ProductCatalogController {
  constructor(private readonly service: ProductCatalogService) {}

  // ─── PRODUCTS ──────────────────────────────────────────────────────────────

  @Get('products')
  @RequirePermissions(Permission.PRODUCT_CATALOG_READ)
  @ApiOperation({ summary: 'List all products' })
  async findProducts() {
    return this.service.findProducts();
  }

  @Get('products/:productKey')
  @RequirePermissions(Permission.PRODUCT_CATALOG_READ)
  @ApiOperation({ summary: 'Find a product by ID or productKey' })
  async findProduct(@Param('productKey') productKey: string) {
    return this.service.findProduct(productKey);
  }

  @Post('products')
  @RequirePermissions(Permission.PRODUCT_CATALOG_MANAGE)
  @ApiOperation({ summary: 'Create a new product' })
  async createProduct(@Request() req, @Body() dto: CreateProductDto) {
    const userEmail = req.user?.email || req.user?.id;
    return this.service.createProduct(dto, userEmail);
  }

  @Patch('products/:id')
  @RequirePermissions(Permission.PRODUCT_CATALOG_MANAGE)
  @ApiOperation({ summary: 'Update product properties' })
  async updateProduct(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    const userEmail = req.user?.email || req.user?.id;
    return this.service.updateProduct(id, dto, userEmail);
  }

  @Post('products/:id/archive')
  @RequirePermissions(Permission.PRODUCT_CATALOG_MANAGE)
  @ApiOperation({ summary: 'Archive a product' })
  async archiveProduct(@Request() req, @Param('id') id: string) {
    const userEmail = req.user?.email || req.user?.id;
    return this.service.archiveProduct(id, userEmail);
  }

  // ─── PLANS ─────────────────────────────────────────────────────────────────

  @Get('plans')
  @RequirePermissions(Permission.PRODUCT_CATALOG_READ)
  @ApiOperation({ summary: 'List plans, optionally filtered by product ID' })
  async findPlans(@Query('productId') productId?: string) {
    return this.service.findPlans(productId);
  }

  @Post('plans')
  @RequirePermissions(Permission.PRODUCT_CATALOG_MANAGE)
  @ApiOperation({ summary: 'Create a plan' })
  async createPlan(@Request() req, @Body() dto: CreatePlanDto) {
    const userEmail = req.user?.email || req.user?.id;
    return this.service.createPlan(dto, userEmail);
  }

  @Patch('plans/:id')
  @RequirePermissions(Permission.PRODUCT_CATALOG_MANAGE)
  @ApiOperation({ summary: 'Update plan properties' })
  async updatePlan(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdatePlanDto,
  ) {
    const userEmail = req.user?.email || req.user?.id;
    return this.service.updatePlan(id, dto, userEmail);
  }

  @Post('plans/:id/archive')
  @RequirePermissions(Permission.PRODUCT_CATALOG_MANAGE)
  @ApiOperation({ summary: 'Archive a plan' })
  async archivePlan(@Request() req, @Param('id') id: string) {
    const userEmail = req.user?.email || req.user?.id;
    return this.service.archivePlan(id, userEmail);
  }

  // ─── PLAN VERSIONS ─────────────────────────────────────────────────────────

  @Get('plans/:planId/versions')
  @RequirePermissions(Permission.PRODUCT_CATALOG_READ)
  @ApiOperation({ summary: 'List all plan versions' })
  async findPlanVersions(@Param('planId') planId: string) {
    return this.service.findPlanVersions(planId);
  }

  @Post('plans/:planId/versions')
  @RequirePermissions(Permission.PRODUCT_CATALOG_MANAGE)
  @ApiOperation({ summary: 'Create a plan version' })
  async createPlanVersion(
    @Request() req,
    @Param('planId') planId: string,
    @Body() dto: CreatePlanVersionDto,
  ) {
    const userEmail = req.user?.email || req.user?.id;
    return this.service.createPlanVersion({ ...dto, planId }, userEmail);
  }

  @Post('plan-versions/:id/activate')
  @RequirePermissions(Permission.PRODUCT_CATALOG_MANAGE)
  @ApiOperation({ summary: 'Activate a plan version' })
  async activatePlanVersion(@Request() req, @Param('id') id: string) {
    const userEmail = req.user?.email || req.user?.id;
    return this.service.activatePlanVersion(id, userEmail);
  }

  @Post('plan-versions/:id/supersede')
  @RequirePermissions(Permission.PRODUCT_CATALOG_MANAGE)
  @ApiOperation({ summary: 'Supersede a plan version' })
  async supersedePlanVersion(@Request() req, @Param('id') id: string) {
    const userEmail = req.user?.email || req.user?.id;
    return this.service.supersedePlanVersion(id, userEmail);
  }

  // ─── PRICING ───────────────────────────────────────────────────────────────

  @Get('plan-versions/:id/pricing')
  @RequirePermissions(Permission.PRODUCT_CATALOG_READ)
  @ApiOperation({ summary: 'Get pricing config for a version' })
  async findPlanPrices(@Param('id') id: string) {
    return this.service.findPlanPrices(id);
  }

  @Post('plan-versions/:id/pricing')
  @RequirePermissions(Permission.PRODUCT_CATALOG_MANAGE)
  @ApiOperation({ summary: 'Add a pricing record' })
  async createPlanPrice(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: CreatePlanPriceDto,
  ) {
    const userEmail = req.user?.email || req.user?.id;
    return this.service.createPlanPrice(id, dto, userEmail);
  }

  @Patch('pricing/:priceId')
  @RequirePermissions(Permission.PRODUCT_CATALOG_MANAGE)
  @ApiOperation({ summary: 'Update custom pricing record' })
  async updatePlanPrice(
    @Request() req,
    @Param('priceId') priceId: string,
    @Body() dto: UpdatePlanPriceDto,
  ) {
    const userEmail = req.user?.email || req.user?.id;
    return this.service.updatePlanPrice(priceId, dto, userEmail);
  }

  // ─── VEHICLE PRICING BANDS ─────────────────────────────────────────────────

  @Get('plan-versions/:id/pricing-bands')
  @RequirePermissions(Permission.PRODUCT_CATALOG_READ)
  @ApiOperation({ summary: 'Get pricing bands for a version' })
  async findPricingBands(@Param('id') id: string) {
    return this.service.findPricingBands(id);
  }

  @Post('plan-versions/:id/pricing-bands')
  @RequirePermissions(Permission.PRODUCT_CATALOG_MANAGE)
  @ApiOperation({ summary: 'Add a pricing band' })
  async createPricingBand(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: CreatePricingBandDto,
  ) {
    const userEmail = req.user?.email || req.user?.id;
    return this.service.createPricingBand(id, dto, userEmail);
  }

  @Patch('pricing-bands/:bandId')
  @RequirePermissions(Permission.PRODUCT_CATALOG_MANAGE)
  @ApiOperation({ summary: 'Update a pricing band' })
  async updatePricingBand(
    @Request() req,
    @Param('bandId') bandId: string,
    @Body() dto: UpdatePricingBandDto,
  ) {
    const userEmail = req.user?.email || req.user?.id;
    return this.service.updatePricingBand(bandId, dto, userEmail);
  }
}
