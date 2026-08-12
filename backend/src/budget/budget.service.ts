import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/budget.dto';

@Injectable()
export class BudgetService {
  private readonly logger = new Logger(BudgetService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBudgetDto, userId?: string) {
    const budgetAmount = dto.budgetAmount;
    const actualExpenditure = dto.actualExpenditure || 0;
    const varianceAmount = budgetAmount - actualExpenditure;
    const variancePercent = budgetAmount > 0 ? (varianceAmount / budgetAmount) * 100 : 0;

    const budget = await this.prisma.budget.create({
      data: {
        ...dto,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        actualExpenditure,
        varianceAmount,
        variancePercent,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    this.logger.log(`Budget created: ${budget.periodLabel} - ${budget.budgetCategory}`);
    return budget;
  }

  async findAll(filters?: {
    periodLabel?: string;
    budgetCategory?: string;
    department?: string;
  }) {
    return this.prisma.budget.findMany({
      where: {
        ...(filters?.periodLabel && { periodLabel: filters.periodLabel }),
        ...(filters?.budgetCategory && { budgetCategory: filters.budgetCategory as any }),
        ...(filters?.department && { department: filters.department }),
      },
      orderBy: { periodStart: 'desc' },
    });
  }

  async findOne(id: number) {
    const budget = await this.prisma.budget.findUnique({ where: { id } });
    if (!budget) throw new NotFoundException(`Budget record ${id} not found`);
    return budget;
  }

  async update(id: number, dto: UpdateBudgetDto, userId?: string) {
    const existing = await this.findOne(id);
    const newBudget = dto.budgetAmount !== undefined ? dto.budgetAmount : Number(existing.budgetAmount);
    const newActual = dto.actualExpenditure !== undefined ? dto.actualExpenditure : Number(existing.actualExpenditure);
    const varianceAmount = newBudget - newActual;
    const variancePercent = newBudget > 0 ? (varianceAmount / newBudget) * 100 : 0;

    return this.prisma.budget.update({
      where: { id },
      data: {
        ...dto,
        varianceAmount,
        variancePercent,
        updatedBy: userId,
      },
    });
  }

  async getVarianceSummary(periodLabel?: string) {
    const budgets = await this.prisma.budget.findMany({
      where: {
        ...(periodLabel && { periodLabel }),
      },
    });

    const categorySummary: Record<string, { budget: number; actual: number; variance: number }> = {};

    for (const b of budgets) {
      const cat = b.budgetCategory;
      if (!categorySummary[cat]) {
        categorySummary[cat] = { budget: 0, actual: 0, variance: 0 };
      }
      categorySummary[cat].budget += Number(b.budgetAmount);
      categorySummary[cat].actual += Number(b.actualExpenditure);
      categorySummary[cat].variance += Number(b.varianceAmount || 0);
    }

    return categorySummary;
  }
}
