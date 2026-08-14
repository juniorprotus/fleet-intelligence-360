import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Req,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TyreService } from './tyre.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import {
  CreateTyreDto,
  UpdateTyreDto,
  TyreQueryDto,
  CreateTyreFitmentDto,
  RemoveTyreFitmentDto,
  CreateTyreInspectionDto,
} from './dto';

@ApiTags('Tyres')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/tyres')
export class TyreController {
  constructor(private readonly tyreService: TyreService) {}

  // ──────────────────────────────────────────────
  // STATIC / KPI / OVERVIEW ROUTES (Must be before :id)
  // ──────────────────────────────────────────────

  @Get('supervisor-kpis')
  @RequirePermissions(Permission.TYRE_KPI_READ, Permission.TYRE_READ)
  @ApiOperation({ summary: 'Get Tyre Supervisor KPIs', description: 'Returns 15 operational KPIs for the Tyre Supervisor dashboard' })
  @ApiResponse({ status: 200, description: 'Supervisor KPI dataset' })
  async getSupervisorKPIs(@Req() req: any) {
    return this.tyreService.getSupervisorKPIs(req.user);
  }

  @Get('kpis')
  @RequirePermissions(Permission.TYRE_READ)
  @ApiOperation({ summary: 'Get Governed Tyre KPIs', description: 'Returns governed KPIs evaluated via KpiGovernanceService' })
  async getGovernedKPIs() {
    return this.tyreService.getGovernedTyreKPIs();
  }

  @Get('weekly-schedule')
  @RequirePermissions(Permission.TYRE_READ)
  @ApiOperation({ summary: 'Get 7-Day Weekly Inspection Schedule', description: 'Returns 7-day inspection schedule and tyre-level compliance' })
  async getWeeklySchedule() {
    return this.tyreService.getWeeklyInspectionSchedule(7);
  }

  @Get('mechanic-work-queue')
  @RequirePermissions(Permission.TYRE_READ)
  @ApiOperation({ summary: 'Get Tyre Mechanic Work Queue', description: 'Returns due inspections, open defects, and mechanic weekly inspection KPI' })
  async getMechanicWorkQueue(@Req() req: any) {
    const userId = req.user?.email || 'Mechanic';
    return this.tyreService.getMechanicWorkQueue(userId);
  }

  @Get('supervisor-work-queue')
  @RequirePermissions(Permission.TYRE_READ)
  @ApiOperation({ summary: 'Get Tyre Supervisor Work Queue', description: 'Returns unverified fitments/inspections and open safety alerts' })
  async getSupervisorWorkQueue(@Req() req: any) {
    const workshopId = req.user?.workshopId || 'All Workshops';
    return this.tyreService.getSupervisorWorkQueue(workshopId);
  }

  @Get('summary')
  @RequirePermissions(Permission.TYRE_READ)
  @ApiOperation({ summary: 'Get tyre summary/dashboard', description: 'Returns counts by status for dashboard display' })
  @ApiResponse({ status: 200, description: 'Tyre summary data' })
  async getSummary() {
    return this.tyreService.getSummary();
  }

  @Get('fitments/all')
  @RequirePermissions(Permission.TYRE_READ)
  @ApiOperation({ summary: 'Get all fitment records across the fleet' })
  async getAllFitments() {
    return this.tyreService.getAllFitments();
  }

  @Get('inspections/all')
  @RequirePermissions(Permission.TYRE_READ)
  @ApiOperation({ summary: 'Get all inspection records across the fleet' })
  async getAllInspections() {
    return this.tyreService.getAllInspections();
  }

  // ──────────────────────────────────────────────
  // TYRE REGISTRATION & CRUD
  // ──────────────────────────────────────────────

  @Post('register')
  @RequirePermissions(Permission.TYRE_REGISTER, Permission.TYRE_CREATE)
  @ApiOperation({ summary: 'Register a new physical tyre', description: 'Mints a unique FI360 Tyre ID (e.g. TYR-000001) and creates IN_STOCK registration movement event' })
  @ApiResponse({ status: 201, description: 'Tyre registered successfully with IN_STOCK state' })
  async registerTyre(@Body() dto: CreateTyreDto, @Req() req: any) {
    const userId = req.user?.sub || req.user?.id;
    return this.tyreService.create(dto, String(userId));
  }

  @Post()
  @RequirePermissions(Permission.TYRE_CREATE)
  @ApiOperation({ summary: 'Create a new tyre', description: 'Register a new tyre in the system' })
  @ApiResponse({ status: 201, description: 'Tyre created successfully' })
  async create(@Body() dto: CreateTyreDto, @Req() req: any) {
    const userId = req.user?.sub || req.user?.id;
    return this.tyreService.create(dto, String(userId));
  }

  @Get()
  @RequirePermissions(Permission.TYRE_READ)
  @ApiOperation({ summary: 'List all tyres', description: 'Retrieve a paginated list of tyres with optional filters' })
  @ApiResponse({ status: 200, description: 'List of tyres with pagination metadata' })
  async findAll(@Query() query: TyreQueryDto) {
    return this.tyreService.findAll(query);
  }

  // ──────────────────────────────────────────────
  // TYRE LIFECYCLE OPERATIONS (Rotation, Repair, Disposal)
  // ──────────────────────────────────────────────

  @Post('rotate')
  @RequirePermissions(Permission.TYRE_ROTATE)
  @ApiOperation({ summary: 'Rotate a tyre position', description: 'Changes tyre position on vehicle and records immutable ROTATION event' })
  async rotateTyre(
    @Body() dto: { tyreId: number; newPositionId: number; newPositionCode?: string; vehicleId: string; odometer?: number; performedBy?: string; notes?: string },
    @Req() req: any,
  ) {
    const userId = req.user?.sub || req.user?.id;
    return this.tyreService.rotateTyre(dto, String(userId));
  }

  @Post('repair')
  @RequirePermissions(Permission.TYRE_REPAIR)
  @ApiOperation({ summary: 'Record tyre repair completion', description: 'Records repair completion and updates status to RETURNED_REPAIR' })
  async repairTyre(
    @Body() dto: { tyreId: number; repairType: string; cost?: number; supplierId?: number; notes?: string },
    @Req() req: any,
  ) {
    const userId = req.user?.sub || req.user?.id;
    return this.tyreService.repairTyre(dto, String(userId));
  }

  @Post(':id/dispose')
  @RequirePermissions(Permission.TYRE_DISPOSE)
  @ApiOperation({ summary: 'Dispose a scrapped/end-of-life tyre', description: 'Marks tyre state as DISPOSED and records DISPOSE movement event' })
  async disposeTyre(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { reason?: string },
    @Req() req: any,
  ) {
    const userId = req.user?.sub || req.user?.id;
    return this.tyreService.disposeTyre(id, dto.reason, String(userId));
  }

  // ──────────────────────────────────────────────
  // SUPERVISOR VERIFICATION ENDPOINTS
  // ──────────────────────────────────────────────

  @Put('fitments/:fitmentId/verify')
  @RequirePermissions(Permission.TYRE_VERIFY)
  @ApiOperation({ summary: 'Supervisor verify fitment', description: 'Approve or reject technician fitment work (segregation of duties enforced)' })
  async verifyFitment(
    @Param('fitmentId', ParseIntPipe) fitmentId: number,
    @Body() dto: { status: 'VERIFIED' | 'REJECTED'; notes?: string },
    @Req() req: any,
  ) {
    const supervisorUserId = req.user?.email || String(req.user?.sub || req.user?.id);
    return this.tyreService.verifyFitment(fitmentId, supervisorUserId, dto.status, dto.notes);
  }

  @Put('inspections/:inspectionId/verify')
  @RequirePermissions(Permission.TYRE_VERIFY)
  @ApiOperation({ summary: 'Supervisor verify inspection', description: 'Approve or reject technician inspection work (segregation of duties enforced)' })
  async verifyInspection(
    @Param('inspectionId', ParseIntPipe) inspectionId: number,
    @Body() dto: { status: 'VERIFIED' | 'REJECTED' | 'REINSPECTION_REQUIRED'; notes?: string },
    @Req() req: any,
  ) {
    const supervisorUserId = req.user?.email || String(req.user?.sub || req.user?.id);
    return this.tyreService.verifyInspection(inspectionId, supervisorUserId, dto.status, dto.notes);
  }

  // ──────────────────────────────────────────────
  // PARAMETERIZED ROUTES (:id)
  // ──────────────────────────────────────────────

  @Get(':id')
  @RequirePermissions(Permission.TYRE_READ)
  @ApiOperation({ summary: 'Get tyre by ID', description: 'Retrieve a single tyre with its recent fitments, inspections, and movements' })
  @ApiParam({ name: 'id', type: Number, description: 'Tyre ID' })
  @ApiResponse({ status: 200, description: 'Tyre details' })
  @ApiResponse({ status: 404, description: 'Tyre not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tyreService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions(Permission.TYRE_UPDATE)
  @ApiOperation({ summary: 'Update a tyre', description: 'Update tyre information' })
  @ApiParam({ name: 'id', type: Number, description: 'Tyre ID' })
  @ApiResponse({ status: 200, description: 'Tyre updated successfully' })
  @ApiResponse({ status: 404, description: 'Tyre not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTyreDto,
    @Req() req: any,
  ) {
    const userId = req.user?.sub || req.user?.id;
    return this.tyreService.update(id, dto, String(userId));
  }

  @Delete(':id')
  @RequirePermissions(Permission.TYRE_UPDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a tyre', description: 'Marks a tyre as inactive (soft delete)' })
  @ApiParam({ name: 'id', type: Number, description: 'Tyre ID' })
  @ApiResponse({ status: 204, description: 'Tyre deleted' })
  @ApiResponse({ status: 404, description: 'Tyre not found' })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user?.sub || req.user?.id;
    await this.tyreService.softDelete(id, String(userId));
  }

  @Post('fitments')
  @RequirePermissions(Permission.TYRE_FIT)
  @ApiOperation({ summary: 'Fit a tyre to a vehicle', description: 'Record the fitment of a tyre onto a vehicle position' })
  @ApiResponse({ status: 201, description: 'Fitment recorded' })
  async fitTyre(@Body() dto: CreateTyreFitmentDto, @Req() req: any) {
    const userId = req.user?.sub || req.user?.id;
    return this.tyreService.fitTyre(dto, String(userId));
  }

  @Put('fitments/:fitmentId/remove')
  @RequirePermissions(Permission.TYRE_REMOVE)
  @ApiOperation({ summary: 'Remove a tyre from a vehicle', description: 'Close a fitment record by recording the removal' })
  @ApiParam({ name: 'fitmentId', type: Number, description: 'Fitment record ID' })
  @ApiResponse({ status: 200, description: 'Tyre removed from vehicle' })
  async removeTyre(
    @Param('fitmentId', ParseIntPipe) fitmentId: number,
    @Body() dto: RemoveTyreFitmentDto,
    @Req() req: any,
  ) {
    const userId = req.user?.sub || req.user?.id;
    return this.tyreService.removeTyre(fitmentId, dto, String(userId));
  }

  @Get(':id/fitments')
  @RequirePermissions(Permission.TYRE_READ)
  @ApiOperation({ summary: 'Get fitment history', description: 'Retrieve the fitment history of a specific tyre' })
  @ApiParam({ name: 'id', type: Number, description: 'Tyre ID' })
  @ApiResponse({ status: 200, description: 'Fitment history' })
  async getFitmentHistory(@Param('id', ParseIntPipe) id: number) {
    return this.tyreService.getFitmentHistory(id);
  }

  @Post('inspections')
  @RequirePermissions(Permission.TYRE_INSPECT)
  @ApiOperation({ summary: 'Record tyre inspection', description: 'Record a tyre inspection with tread measurements and condition assessment' })
  @ApiResponse({ status: 201, description: 'Inspection recorded' })
  async createInspection(@Body() dto: CreateTyreInspectionDto, @Req() req: any) {
    const userId = req.user?.sub || req.user?.id;
    return this.tyreService.createInspection(dto, String(userId));
  }

  @Get(':id/inspections')
  @RequirePermissions(Permission.TYRE_READ)
  @ApiOperation({ summary: 'Get inspection history', description: 'Retrieve the inspection history of a specific tyre' })
  @ApiParam({ name: 'id', type: Number, description: 'Tyre ID' })
  @ApiResponse({ status: 200, description: 'Inspection history' })
  async getInspectionHistory(@Param('id', ParseIntPipe) id: number) {
    return this.tyreService.getInspectionHistory(id);
  }

  @Get(':id/movements')
  @RequirePermissions(Permission.TYRE_READ)
  @ApiOperation({ summary: 'Get movement history', description: 'Retrieve the full movement/lifecycle history of a tyre' })
  @ApiParam({ name: 'id', type: Number, description: 'Tyre ID' })
  @ApiResponse({ status: 200, description: 'Movement history' })
  async getMovementHistory(@Param('id', ParseIntPipe) id: number) {
    return this.tyreService.getMovementHistory(id);
  }
}
