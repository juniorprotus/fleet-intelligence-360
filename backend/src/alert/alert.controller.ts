import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  Req,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AlertService } from './alert.service';
import { CreateAlertDto, AcknowledgeAlertDto, ResolveAlertDto } from './dto/alert.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('Alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/alerts')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Post()
  @ApiOperation({ summary: 'Create a system alert' })
  async create(@Body() dto: CreateAlertDto) {
    return this.alertService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all alerts with optional filtering' })
  async findAll(
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('vehicleId') vehicleId?: string,
    @Query('tyreId') tyreId?: string,
  ) {
    return this.alertService.findAll({
      status,
      severity,
      vehicleId,
      tyreId: tyreId ? parseInt(tyreId, 10) : undefined,
    });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get summary of open and critical alerts' })
  async getSummary() {
    return this.alertService.getSummary();
  }

  @Get('critical-kpi')
  @ApiOperation({ summary: 'Get Fleet Manager current unresolved critical risk alerts KPI with scope enforcement' })
  async getCriticalKpi(@Req() req: any) {
    return this.alertService.getCriticalKpi(req?.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get alert details' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.alertService.findOne(id);
  }

  @Put(':id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge an alert' })
  async acknowledge(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AcknowledgeAlertDto,
  ) {
    return this.alertService.acknowledge(id, dto);
  }

  @Put(':id/resolve')
  @ApiOperation({ summary: 'Resolve an alert' })
  async resolve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResolveAlertDto,
  ) {
    return this.alertService.resolve(id, dto);
  }
}
