import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DefectService } from './defect.service';
import { CreateDefectDto, UpdateDefectStatusDto } from './dto/defect.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('Defects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/defects')
export class DefectController {
  constructor(private readonly defectService: DefectService) {}

  @Post()
  @ApiOperation({ summary: 'Report a tyre defect' })
  async create(@Body() dto: CreateDefectDto) {
    return this.defectService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List defects with optional filters' })
  async findAll(
    @Query('status') status?: string,
    @Query('vehicleId') vehicleId?: string,
    @Query('tyreId') tyreId?: string,
    @Query('severity') severity?: string,
  ) {
    return this.defectService.findAll({
      status,
      vehicleId,
      tyreId: tyreId ? parseInt(tyreId, 10) : undefined,
      severity,
    });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get defect count summary by status' })
  async getSummary() {
    return this.defectService.getSummary();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get defect details' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.defectService.findOne(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update defect status/resolution' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDefectStatusDto,
  ) {
    return this.defectService.updateStatus(id, dto);
  }
}
