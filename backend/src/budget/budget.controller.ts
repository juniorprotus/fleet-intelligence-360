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
import { BudgetService } from './budget.service';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/budget.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';

@ApiTags('Budgets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/budgets')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  @RequirePermissions(Permission.BUDGET_CREATE)
  @ApiOperation({ summary: 'Create budget entry' })
  async create(@Body() dto: CreateBudgetDto) {
    return this.budgetService.create(dto);
  }

  @Get()
  @RequirePermissions(Permission.BUDGET_READ)
  @ApiOperation({ summary: 'List all budget records with filters' })
  async findAll(
    @Query('periodLabel') periodLabel?: string,
    @Query('budgetCategory') budgetCategory?: string,
    @Query('department') department?: string,
  ) {
    return this.budgetService.findAll({ periodLabel, budgetCategory, department });
  }

  @Get('summary')
  @RequirePermissions(Permission.BUDGET_READ)
  @ApiOperation({ summary: 'Get budget vs actual variance summary by category' })
  async getVarianceSummary(@Query('periodLabel') periodLabel?: string) {
    return this.budgetService.getVarianceSummary(periodLabel);
  }

  @Get(':id')
  @RequirePermissions(Permission.BUDGET_READ)
  @ApiOperation({ summary: 'Get single budget record' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.budgetService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions(Permission.BUDGET_UPDATE)
  @ApiOperation({ summary: 'Update budget record' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBudgetDto,
  ) {
    return this.budgetService.update(id, dto);
  }
}
