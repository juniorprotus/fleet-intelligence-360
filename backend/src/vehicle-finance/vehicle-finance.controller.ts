import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { DataScopeService } from '../auth/data-scope.service';
import { ProfileService } from './profile.service';
import { AgreementService } from './agreement.service';
import { BookValueService } from './book-value.service';
import { DisposalService } from './disposal.service';
import {
  CreateVehicleFinancialProfileDto,
  UpdateVehicleFinancialProfileDto,
  CreateVehicleFinanceAgreementDto,
  SettleAgreementDto,
  CreateVehicleDisposalRecordDto,
  FinalizeDisposalDto,
} from './dto/vehicle-finance.dto';

@ApiTags('Vehicle Financial & Acquisition')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/vehicles')
export class VehicleFinanceController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly agreementService: AgreementService,
    private readonly bookValueService: BookValueService,
    private readonly disposalService: DisposalService,
    private readonly dataScopeService: DataScopeService,
  ) {}

  // ─── Financial Profile ──────────────────────────────────────────────────────

  @Post('financial-profile')
  @RequirePermissions(Permission.VEHICLE_FINANCIAL_MANAGE)
  @ApiOperation({ summary: 'Create or register a vehicle financial profile' })
  @ApiResponse({ status: 201, description: 'Financial profile created successfully' })
  async createProfile(@Request() req, @Body() dto: CreateVehicleFinancialProfileDto) {
    const scopeCtx = this.dataScopeService.buildContext(req.user);
    const tenantId = scopeCtx.tenantId || 'TNT-DEFAULT';
    const organizationId = scopeCtx.organizationId || 'ORG-DEFAULT';
    const userEmail = req.user?.email || req.user?.id;
    return this.profileService.create(dto, tenantId, organizationId, userEmail);
  }

  @Post(':id/financial-profile')
  @RequirePermissions(Permission.VEHICLE_FINANCIAL_MANAGE)
  @ApiOperation({ summary: 'Create or register a vehicle financial profile for vehicle ID' })
  async createProfileForVehicle(
    @Request() req,
    @Param('id') vehicleId: string,
    @Body() dto: CreateVehicleFinancialProfileDto,
  ) {
    const scopeCtx = this.dataScopeService.buildContext(req.user);
    const tenantId = scopeCtx.tenantId || 'TNT-DEFAULT';
    const organizationId = scopeCtx.organizationId || 'ORG-DEFAULT';
    const userEmail = req.user?.email || req.user?.id;
    return this.profileService.create({ ...dto, vehicleId }, tenantId, organizationId, userEmail);
  }

  @Get(':id/financial-profile')
  @RequirePermissions(Permission.VEHICLE_FINANCIAL_READ)
  @ApiOperation({ summary: 'Get vehicle financial profile' })
  async getProfile(@Request() req, @Param('id') vehicleId: string) {
    const scopeCtx = this.dataScopeService.buildContext(req.user);
    const tenantId = scopeCtx.tenantId || 'TNT-DEFAULT';
    const organizationId = scopeCtx.organizationId || 'ORG-DEFAULT';
    return this.profileService.findByVehicle(vehicleId, tenantId, organizationId);
  }

  @Put(':id/financial-profile')
  @RequirePermissions(Permission.VEHICLE_FINANCIAL_MANAGE)
  @ApiOperation({ summary: 'Update vehicle financial profile (PUT)' })
  async updateProfile(
    @Request() req,
    @Param('id') vehicleId: string,
    @Body() dto: UpdateVehicleFinancialProfileDto,
  ) {
    const scopeCtx = this.dataScopeService.buildContext(req.user);
    const tenantId = scopeCtx.tenantId || 'TNT-DEFAULT';
    const organizationId = scopeCtx.organizationId || 'ORG-DEFAULT';
    const userEmail = req.user?.email || req.user?.id;
    return this.profileService.update(vehicleId, dto, tenantId, organizationId, userEmail);
  }

  @Patch(':id/financial-profile')
  @RequirePermissions(Permission.VEHICLE_FINANCIAL_MANAGE)
  @ApiOperation({ summary: 'Update vehicle financial profile (PATCH)' })
  async patchProfile(
    @Request() req,
    @Param('id') vehicleId: string,
    @Body() dto: UpdateVehicleFinancialProfileDto,
  ) {
    const scopeCtx = this.dataScopeService.buildContext(req.user);
    const tenantId = scopeCtx.tenantId || 'TNT-DEFAULT';
    const organizationId = scopeCtx.organizationId || 'ORG-DEFAULT';
    const userEmail = req.user?.email || req.user?.id;
    return this.profileService.update(vehicleId, dto, tenantId, organizationId, userEmail);
  }

  // ─── Book Value & Depreciation ──────────────────────────────────────────────

  @Get(':id/book-value')
  @RequirePermissions(Permission.VEHICLE_BOOK_VALUE_READ)
  @ApiOperation({ summary: 'Get calculated or authority-resolved book value for vehicle' })
  async getBookValue(@Request() req, @Param('id') vehicleId: string) {
    const scopeCtx = this.dataScopeService.buildContext(req.user);
    const tenantId = scopeCtx.tenantId || 'TNT-DEFAULT';
    const organizationId = scopeCtx.organizationId || 'ORG-DEFAULT';
    return this.bookValueService.getBookValue(vehicleId, tenantId, organizationId);
  }

  // ─── Finance Agreements ─────────────────────────────────────────────────────

  @Post('finance-agreements')
  @RequirePermissions(Permission.FINANCE_AGREEMENT_MANAGE)
  @ApiOperation({ summary: 'Create vehicle finance agreement' })
  @ApiResponse({ status: 201, description: 'Finance agreement created successfully' })
  async createAgreement(@Request() req, @Body() dto: CreateVehicleFinanceAgreementDto) {
    const scopeCtx = this.dataScopeService.buildContext(req.user);
    const tenantId = scopeCtx.tenantId || 'TNT-DEFAULT';
    const organizationId = scopeCtx.organizationId || 'ORG-DEFAULT';
    const userEmail = req.user?.email || req.user?.id;
    return this.agreementService.create(dto, tenantId, organizationId, userEmail);
  }

  @Post(':id/finance-agreements')
  @RequirePermissions(Permission.FINANCE_AGREEMENT_MANAGE)
  @ApiOperation({ summary: 'Create vehicle finance agreement for vehicle ID' })
  async createAgreementForVehicle(
    @Request() req,
    @Param('id') vehicleId: string,
    @Body() dto: CreateVehicleFinanceAgreementDto,
  ) {
    const scopeCtx = this.dataScopeService.buildContext(req.user);
    const tenantId = scopeCtx.tenantId || 'TNT-DEFAULT';
    const organizationId = scopeCtx.organizationId || 'ORG-DEFAULT';
    const userEmail = req.user?.email || req.user?.id;
    return this.agreementService.create({ ...dto, vehicleId }, tenantId, organizationId, userEmail);
  }

  @Get(':id/finance-agreements')
  @RequirePermissions(Permission.VEHICLE_FINANCIAL_READ)
  @ApiOperation({ summary: 'List finance agreements for a vehicle' })
  async getAgreements(@Request() req, @Param('id') vehicleId: string) {
    const scopeCtx = this.dataScopeService.buildContext(req.user);
    const tenantId = scopeCtx.tenantId || 'TNT-DEFAULT';
    const organizationId = scopeCtx.organizationId || 'ORG-DEFAULT';
    return this.agreementService.findByVehicle(vehicleId, tenantId, organizationId);
  }

  @Get('finance-agreements/:agreementId')
  @RequirePermissions(Permission.VEHICLE_FINANCIAL_READ)
  @ApiOperation({ summary: 'Get finance agreement details by agreement ID' })
  async getAgreementById(@Request() req, @Param('agreementId') agreementId: string) {
    const scopeCtx = this.dataScopeService.buildContext(req.user);
    const tenantId = scopeCtx.tenantId || 'TNT-DEFAULT';
    const organizationId = scopeCtx.organizationId || 'ORG-DEFAULT';
    return this.agreementService.findOne(agreementId, tenantId, organizationId);
  }

  @Get(':id/finance-agreements/:agreementId')
  @RequirePermissions(Permission.VEHICLE_FINANCIAL_READ)
  @ApiOperation({ summary: 'Get finance agreement details by vehicle ID and agreement ID' })
  async getAgreementByVehicleAndId(
    @Request() req,
    @Param('id') vehicleId: string,
    @Param('agreementId') agreementId: string,
  ) {
    const scopeCtx = this.dataScopeService.buildContext(req.user);
    const tenantId = scopeCtx.tenantId || 'TNT-DEFAULT';
    const organizationId = scopeCtx.organizationId || 'ORG-DEFAULT';
    return this.agreementService.findOne(agreementId, tenantId, organizationId);
  }

  @Post('finance-agreements/:agreementId/settle')
  @RequirePermissions(Permission.FINANCE_AGREEMENT_MANAGE)
  @ApiOperation({ summary: 'Settle a vehicle finance agreement' })
  async settleAgreement(
    @Request() req,
    @Param('agreementId') agreementId: string,
    @Body() dto: SettleAgreementDto,
  ) {
    const scopeCtx = this.dataScopeService.buildContext(req.user);
    const tenantId = scopeCtx.tenantId || 'TNT-DEFAULT';
    const organizationId = scopeCtx.organizationId || 'ORG-DEFAULT';
    const userEmail = req.user?.email || req.user?.id;
    return this.agreementService.settle(agreementId, dto, tenantId, organizationId, userEmail);
  }

  @Post(':id/finance-agreements/:agreementId/settle')
  @RequirePermissions(Permission.FINANCE_AGREEMENT_MANAGE)
  @ApiOperation({ summary: 'Settle a vehicle finance agreement for vehicle ID' })
  async settleAgreementForVehicle(
    @Request() req,
    @Param('id') vehicleId: string,
    @Param('agreementId') agreementId: string,
    @Body() dto: SettleAgreementDto,
  ) {
    const scopeCtx = this.dataScopeService.buildContext(req.user);
    const tenantId = scopeCtx.tenantId || 'TNT-DEFAULT';
    const organizationId = scopeCtx.organizationId || 'ORG-DEFAULT';
    const userEmail = req.user?.email || req.user?.id;
    return this.agreementService.settle(agreementId, dto, tenantId, organizationId, userEmail);
  }

  // ─── Disposal Records ───────────────────────────────────────────────────────

  @Post('disposals')
  @RequirePermissions(Permission.VEHICLE_DISPOSAL_MANAGE)
  @ApiOperation({ summary: 'Create vehicle disposal record (draft)' })
  @ApiResponse({ status: 201, description: 'Disposal record created' })
  async createDisposal(@Request() req, @Body() dto: CreateVehicleDisposalRecordDto) {
    const scopeCtx = this.dataScopeService.buildContext(req.user);
    const tenantId = scopeCtx.tenantId || 'TNT-DEFAULT';
    const organizationId = scopeCtx.organizationId || 'ORG-DEFAULT';
    const userEmail = req.user?.email || req.user?.id;
    return this.disposalService.create(dto, tenantId, organizationId, userEmail);
  }

  @Post(':id/disposals')
  @RequirePermissions(Permission.VEHICLE_DISPOSAL_MANAGE)
  @ApiOperation({ summary: 'Create vehicle disposal record for vehicle ID' })
  async createDisposalForVehicle(
    @Request() req,
    @Param('id') vehicleId: string,
    @Body() dto: CreateVehicleDisposalRecordDto,
  ) {
    const scopeCtx = this.dataScopeService.buildContext(req.user);
    const tenantId = scopeCtx.tenantId || 'TNT-DEFAULT';
    const organizationId = scopeCtx.organizationId || 'ORG-DEFAULT';
    const userEmail = req.user?.email || req.user?.id;
    return this.disposalService.create({ ...dto, vehicleId }, tenantId, organizationId, userEmail);
  }

  @Get(':id/disposals')
  @RequirePermissions(Permission.VEHICLE_FINANCIAL_READ)
  @ApiOperation({ summary: 'List disposal records for a vehicle' })
  async getDisposals(@Request() req, @Param('id') vehicleId: string) {
    const scopeCtx = this.dataScopeService.buildContext(req.user);
    const tenantId = scopeCtx.tenantId || 'TNT-DEFAULT';
    const organizationId = scopeCtx.organizationId || 'ORG-DEFAULT';
    return this.disposalService.findByVehicle(vehicleId, tenantId, organizationId);
  }

  @Get('disposals/:disposalId')
  @RequirePermissions(Permission.VEHICLE_FINANCIAL_READ)
  @ApiOperation({ summary: 'Get disposal record detail' })
  async getDisposalById(@Request() req, @Param('disposalId') disposalId: string) {
    const scopeCtx = this.dataScopeService.buildContext(req.user);
    const tenantId = scopeCtx.tenantId || 'TNT-DEFAULT';
    const organizationId = scopeCtx.organizationId || 'ORG-DEFAULT';
    return this.disposalService.findOne(disposalId, tenantId, organizationId);
  }

  @Get(':id/disposals/:disposalId')
  @RequirePermissions(Permission.VEHICLE_FINANCIAL_READ)
  @ApiOperation({ summary: 'Get disposal record detail by vehicle ID and disposal ID' })
  async getDisposalByVehicleAndId(
    @Request() req,
    @Param('id') vehicleId: string,
    @Param('disposalId') disposalId: string,
  ) {
    const scopeCtx = this.dataScopeService.buildContext(req.user);
    const tenantId = scopeCtx.tenantId || 'TNT-DEFAULT';
    const organizationId = scopeCtx.organizationId || 'ORG-DEFAULT';
    return this.disposalService.findOne(disposalId, tenantId, organizationId);
  }

  @Post('disposals/:disposalId/finalize')
  @RequirePermissions(Permission.VEHICLE_DISPOSAL_MANAGE)
  @ApiOperation({ summary: 'Finalize vehicle disposal, mark vehicle as DISPOSED and lock record' })
  async finalizeDisposal(
    @Request() req,
    @Param('disposalId') disposalId: string,
    @Body() dto: FinalizeDisposalDto,
  ) {
    const scopeCtx = this.dataScopeService.buildContext(req.user);
    const tenantId = scopeCtx.tenantId || 'TNT-DEFAULT';
    const organizationId = scopeCtx.organizationId || 'ORG-DEFAULT';
    const userEmail = req.user?.email || req.user?.id;
    return this.disposalService.finalize(disposalId, dto, tenantId, organizationId, userEmail);
  }

  @Post(':id/disposals/:disposalId/finalize')
  @RequirePermissions(Permission.VEHICLE_DISPOSAL_MANAGE)
  @ApiOperation({ summary: 'Finalize vehicle disposal for vehicle ID, mark vehicle as DISPOSED and lock record' })
  async finalizeDisposalForVehicle(
    @Request() req,
    @Param('id') vehicleId: string,
    @Param('disposalId') disposalId: string,
    @Body() dto: FinalizeDisposalDto,
  ) {
    const scopeCtx = this.dataScopeService.buildContext(req.user);
    const tenantId = scopeCtx.tenantId || 'TNT-DEFAULT';
    const organizationId = scopeCtx.organizationId || 'ORG-DEFAULT';
    const userEmail = req.user?.email || req.user?.id;
    return this.disposalService.finalize(disposalId, dto, tenantId, organizationId, userEmail);
  }
}
