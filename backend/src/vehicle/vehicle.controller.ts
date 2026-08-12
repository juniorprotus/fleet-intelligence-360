import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VehicleService } from './vehicle.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { DataScopeService } from '../auth/data-scope.service';

@ApiTags('Vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/vehicles')
export class VehicleController {
  constructor(
    private readonly vehicleService: VehicleService,
    private readonly dataScopeService: DataScopeService,
  ) {}

  @Post()
  @RequirePermissions(Permission.VEHICLE_CREATE)
  @ApiOperation({ summary: 'Register a vehicle in Vehicle Master' })
  @ApiResponse({ status: 201, description: 'Vehicle registered successfully' })
  async create(@Body() dto: CreateVehicleDto) {
    return this.vehicleService.create(dto);
  }

  @Get()
  @RequirePermissions(Permission.VEHICLE_READ)
  @ApiOperation({ summary: 'List all vehicles with optional hierarchical filters' })
  async findAll(
    @Request() req,
    @Query('region') region?: string,
    @Query('depot') depot?: string,
    @Query('vehicleClass') vehicleClass?: string,
    @Query('status') status?: string,
  ) {
    // Apply data-scope filtering based on the user's role scope level
    const scopeCtx = this.dataScopeService.buildContext(req.user);
    const scopeFilter = this.dataScopeService.vehicleWhere(scopeCtx);

    return this.vehicleService.findAll({
      region: region ?? scopeFilter.region,
      depot: depot ?? scopeFilter.depot,
      vehicleClass,
      status,
    });
  }

  @Get('breakdown')
  @RequirePermissions(Permission.VEHICLE_READ)
  @ApiOperation({ summary: 'Get fleet breakdown by region, depot, class, and status' })
  async getFleetBreakdown() {
    return this.vehicleService.getFleetBreakdown();
  }

  @Get('drivers')
  @RequirePermissions(Permission.VEHICLE_READ)
  @ApiOperation({ summary: 'List all drivers available for vehicle assignment' })
  async getDrivers() {
    return this.vehicleService.getDriversForVehicles();
  }

  @Post('assign-driver')
  @RequirePermissions(Permission.VEHICLE_UPDATE)
  @ApiOperation({ summary: 'Assign a vehicle to a driver user' })
  @ApiResponse({ status: 200, description: 'Vehicle assigned to driver' })
  async assignDriver(@Body() body: { vehicleId: string; driverEmail: string }) {
    return this.vehicleService.assignDriver(body.vehicleId, body.driverEmail);
  }

  @Get(':id')
  @RequirePermissions(Permission.VEHICLE_READ)
  @ApiOperation({ summary: 'Get vehicle detail with active tyres and recent history' })
  async findOne(@Param('id') id: string) {
    return this.vehicleService.findOne(id);
  }

  @Get(':id/tyres')
  @RequirePermissions(Permission.TYRE_READ)
  @ApiOperation({ summary: 'Get currently fitted tyres for a vehicle' })
  async getCurrentTyres(@Param('id') id: string) {
    return this.vehicleService.getCurrentTyres(id);
  }

  @Put(':id')
  @RequirePermissions(Permission.VEHICLE_UPDATE)
  @ApiOperation({ summary: 'Update vehicle details' })
  async update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehicleService.update(id, dto);
  }
}
