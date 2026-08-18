import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TelematicsService } from './telematics.service';
import {
  CreateIntegrationConnectionDto,
  UpdateIntegrationConnectionDto,
  MapExternalIdentityDto,
  RegisterExternalDeviceDto,
  AssignDeviceToVehicleDto,
  IngestGenericTelemetryDto,
} from './dto/integration.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { DataScopeService } from '../auth/data-scope.service';

@ApiTags('Telematics & Integration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1')
export class TelematicsController {
  constructor(
    private readonly telematicsService: TelematicsService,
    private readonly dataScopeService: DataScopeService,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // INTEGRATION CONNECTIONS
  // ─────────────────────────────────────────────────────────────

  @Post('integrations')
  @RequirePermissions(Permission.INTEGRATION_CONFIGURE)
  @ApiOperation({ summary: 'Register a new external telematics/IoT integration connection' })
  async createConnection(@Request() req, @Body() dto: CreateIntegrationConnectionDto) {
    const scopeCtx = this.dataScopeService.buildContext(req.user);
    return this.telematicsService.createConnection(dto, req.user?.email || req.user?.id, scopeCtx);
  }

  @Get('integrations')
  @RequirePermissions(Permission.INTEGRATION_READ)
  @ApiOperation({ summary: 'List integration connections for the current tenant' })
  async findAllConnections(@Request() req) {
    const scopeCtx = this.dataScopeService.buildContext(req.user);
    return this.telematicsService.findAllConnections(scopeCtx);
  }

  @Get('integrations/:id')
  @RequirePermissions(Permission.INTEGRATION_READ)
  @ApiOperation({ summary: 'Get integration connection details by ID' })
  async findConnectionOne(@Request() req, @Param('id') id: string) {
    const scopeCtx = this.dataScopeService.buildContext(req.user);
    return this.telematicsService.findConnectionOne(id, scopeCtx);
  }

  @Patch('integrations/:id')
  @RequirePermissions(Permission.INTEGRATION_CONFIGURE)
  @ApiOperation({ summary: 'Update integration connection credentials or status' })
  async updateConnection(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateIntegrationConnectionDto,
  ) {
    const scopeCtx = this.dataScopeService.buildContext(req.user);
    return this.telematicsService.updateConnection(id, dto, req.user?.email || req.user?.id, scopeCtx);
  }

  @Post('integrations/:id/test')
  @RequirePermissions(Permission.INTEGRATION_TEST)
  @ApiOperation({ summary: 'Test connection health for an integration' })
  async testConnection(@Request() req, @Param('id') id: string) {
    const scopeCtx = this.dataScopeService.buildContext(req.user);
    return this.telematicsService.testConnection(id, scopeCtx);
  }

  @Post('integrations/:id/discover')
  @RequirePermissions(Permission.INTEGRATION_CONFIGURE)
  @ApiOperation({ summary: 'Discover Geotab devices and produce candidate vehicle matches' })
  async discoverGeotabAssets(@Request() req, @Param('id') id: string) {
    const scopeCtx = this.dataScopeService.buildContext(req.user);
    return this.telematicsService.discoverGeotabAssets(id, scopeCtx);
  }

  @Post('integrations/:id/sync')
  @RequirePermissions(Permission.INTEGRATION_CONFIGURE)
  @ApiOperation({ summary: 'Execute incremental sync (GetFeed) for Geotab integration' })
  async syncGeotabIncremental(@Request() req, @Param('id') id: string) {
    const scopeCtx = this.dataScopeService.buildContext(req.user);
    return this.telematicsService.syncGeotabIncremental(id, scopeCtx);
  }

  // ─────────────────────────────────────────────────────────────
  // VEHICLE EXTERNAL IDENTITY MAPPING & CANDIDATES
  // ─────────────────────────────────────────────────────────────

  @Get('vehicles/:id/external-identities')
  @RequirePermissions(Permission.VEHICLE_READ)
  @ApiOperation({ summary: 'List external provider identities mapped to a vehicle' })
  async listExternalIdentitiesForVehicle(@Request() req, @Param('id') id: string) {
    const scopeCtx = this.dataScopeService.buildContext(req.user);
    return this.telematicsService.listExternalIdentitiesForVehicle(id, scopeCtx);
  }

  @Post('vehicles/:id/external-identities')
  @RequirePermissions(Permission.VEHICLE_UPDATE)
  @ApiOperation({ summary: 'Map an external provider vehicle ID to canonical Vehicle.id' })
  async mapExternalIdentity(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: MapExternalIdentityDto,
  ) {
    const scopeCtx = this.dataScopeService.buildContext(req.user);
    return this.telematicsService.mapExternalIdentity(id, dto, req.user?.email || req.user?.id, scopeCtx);
  }

  @Get('integrations/candidate-matches')
  @RequirePermissions(Permission.VEHICLE_READ)
  @ApiOperation({ summary: 'Find vehicle candidate matches by external ID, VIN or registration' })
  async findCandidateMatches(
    @Request() req,
    @Body() body: { externalVehicleId: string; vin?: string; registration?: string },
  ) {
    const scopeCtx = this.dataScopeService.buildContext(req.user);
    return this.telematicsService.findCandidateMatches(body.externalVehicleId, body.vin, body.registration, scopeCtx);
  }

  // ─────────────────────────────────────────────────────────────
  // EXTERNAL DEVICES & ASSIGNMENT HISTORY
  // ─────────────────────────────────────────────────────────────

  @Post('integrations/devices')
  @RequirePermissions(Permission.INTEGRATION_CONFIGURE)
  @ApiOperation({ summary: 'Register a physical telematics/IoT device' })
  async registerDevice(@Request() req, @Body() dto: RegisterExternalDeviceDto) {
    const scopeCtx = this.dataScopeService.buildContext(req.user);
    return this.telematicsService.registerDevice(dto, req.user?.email || req.user?.id, scopeCtx);
  }

  @Post('vehicles/:id/devices')
  @RequirePermissions(Permission.VEHICLE_UPDATE)
  @ApiOperation({ summary: 'Assign an external device to a vehicle (preserves historical ledger)' })
  async assignDeviceToVehicle(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { deviceId: string; reason?: string },
  ) {
    const scopeCtx = this.dataScopeService.buildContext(req.user);
    return this.telematicsService.assignDeviceToVehicle(
      { deviceId: body.deviceId, vehicleId: id, reason: body.reason },
      req.user?.email || req.user?.id,
      scopeCtx,
    );
  }

  @Get('vehicles/:id/devices')
  @RequirePermissions(Permission.VEHICLE_READ)
  @ApiOperation({ summary: 'List physical devices and historical assignment ledger for a vehicle' })
  async listDevicesForVehicle(@Request() req, @Param('id') id: string) {
    const scopeCtx = this.dataScopeService.buildContext(req.user);
    return this.telematicsService.listDevicesForVehicle(id, scopeCtx);
  }

  // ─────────────────────────────────────────────────────────────
  // TELEMETRY INGESTION & STATUS SUMMARY
  // ─────────────────────────────────────────────────────────────

  @Post('integrations/:connectionId/telemetry/ingest')
  @RequirePermissions(Permission.INTEGRATION_CONFIGURE)
  @ApiOperation({ summary: 'Ingest raw telemetry payload (Generic test provider adapter)' })
  async ingestTelemetry(
    @Request() req,
    @Param('connectionId') connectionId: string,
    @Body() dto: IngestGenericTelemetryDto,
  ) {
    const scopeCtx = this.dataScopeService.buildContext(req.user);
    return this.telematicsService.ingestTelemetry(connectionId, dto, req.user?.email || req.user?.id, scopeCtx);
  }

  @Get('vehicles/:id/telematics/status')
  @RequirePermissions(Permission.VEHICLE_READ)
  @ApiOperation({ summary: 'Get normalized Telematics & Integration status for Vehicle Workspace' })
  async getVehicleTelematicsStatus(@Request() req, @Param('id') id: string) {
    const scopeCtx = this.dataScopeService.buildContext(req.user);
    return this.telematicsService.getVehicleTelematicsStatus(id, scopeCtx);
  }
}
