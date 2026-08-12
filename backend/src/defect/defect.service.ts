import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDefectDto, UpdateDefectStatusDto } from './dto/defect.dto';
import { DefectStatus } from '@prisma/client';

@Injectable()
export class DefectService {
  private readonly logger = new Logger(DefectService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDefectDto) {
    const defect = await this.prisma.tyreDefect.create({
      data: {
        ...dto,
        status: DefectStatus.OPEN,
      },
    });
    this.logger.log(`Defect logged: [${defect.defectType}] on vehicle ${defect.vehicleId}`);
    return defect;
  }

  async findAll(filters?: {
    status?: string;
    vehicleId?: string;
    tyreId?: number;
    severity?: string;
  }) {
    return this.prisma.tyreDefect.findMany({
      where: {
        ...(filters?.status && { status: filters.status as any }),
        ...(filters?.vehicleId && { vehicleId: filters.vehicleId }),
        ...(filters?.tyreId && { tyreId: filters.tyreId }),
        ...(filters?.severity && { severity: filters.severity as any }),
      },
      include: {
        vehicle: true,
        tyre: true,
      },
      orderBy: { reportedAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const defect = await this.prisma.tyreDefect.findUnique({
      where: { id },
      include: { vehicle: true, tyre: true },
    });
    if (!defect) throw new NotFoundException(`Defect ${id} not found`);
    return defect;
  }

  async updateStatus(id: number, dto: UpdateDefectStatusDto, userId?: string) {
    await this.findOne(id);
    const updateData: any = {
      status: dto.status,
    };

    if (dto.assignedTo) {
      updateData.assignedTo = dto.assignedTo;
      updateData.assignedAt = new Date();
    }

    if (dto.status === DefectStatus.RESOLVED || dto.status === DefectStatus.CLOSED) {
      updateData.resolvedBy = userId || 'SYSTEM_USER';
      updateData.resolvedAt = new Date();
      if (dto.resolutionNote) updateData.resolutionNote = dto.resolutionNote;
    }

    return this.prisma.tyreDefect.update({
      where: { id },
      data: updateData,
    });
  }

  async getSummary() {
    const [open, inProgress, resolved, total] = await Promise.all([
      this.prisma.tyreDefect.count({ where: { status: DefectStatus.OPEN } }),
      this.prisma.tyreDefect.count({ where: { status: DefectStatus.IN_PROGRESS } }),
      this.prisma.tyreDefect.count({ where: { status: DefectStatus.RESOLVED } }),
      this.prisma.tyreDefect.count(),
    ]);
    return { open, inProgress, resolved, total };
  }
}
