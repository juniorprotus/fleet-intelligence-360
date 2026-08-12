import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BudgetCategory, BudgetStatus } from '@prisma/client';

export class CreateBudgetDto {
  @ApiProperty({ example: '2025-Q1' })
  @IsString()
  periodLabel: string;

  @ApiProperty({ example: '2025-01-01' })
  @IsDateString()
  periodStart: string;

  @ApiProperty({ example: '2025-03-31' })
  @IsDateString()
  periodEnd: string;

  @ApiPropertyOptional({ example: 'Nairobi Region' })
  @IsOptional()
  @IsString()
  organisationUnit?: string;

  @ApiPropertyOptional({ example: 'Fleet Operations' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: 'CC-101' })
  @IsOptional()
  @IsString()
  costCentre?: string;

  @ApiPropertyOptional({ example: 'Heavy Truck' })
  @IsOptional()
  @IsString()
  vehicleClass?: string;

  @ApiProperty({ enum: BudgetCategory, example: 'TYRES' })
  @IsEnum(BudgetCategory)
  budgetCategory: BudgetCategory;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @Min(0)
  budgetAmount: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualExpenditure?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateBudgetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualExpenditure?: number;

  @ApiPropertyOptional({ enum: BudgetStatus })
  @IsOptional()
  @IsEnum(BudgetStatus)
  budgetStatus?: BudgetStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
