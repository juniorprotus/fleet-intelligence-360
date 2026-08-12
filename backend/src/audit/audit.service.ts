import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface LogAuditParams {
  module: string;
  action: string;
  entityType: string;
  entityId: string;
  userId?: string;
  userEmail?: string;
  beforeValue?: any;
  afterValue?: any;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logAction(params: LogAuditParams) {
    try {
      const log = await this.prisma.auditLog.create({
        data: {
          module: params.module,
          action: params.action,
          entityType: params.entityType,
          entityId: String(params.entityId),
          userId: params.userId,
          userEmail: params.userEmail,
          beforeValue: params.beforeValue ? JSON.parse(JSON.stringify(params.beforeValue)) : undefined,
          afterValue: params.afterValue ? JSON.parse(JSON.stringify(params.afterValue)) : undefined,
          ipAddress: params.ipAddress,
        },
      });
      return log;
    } catch (err) {
      this.logger.error(`Failed to record audit log: ${err.message}`, err.stack);
    }
  }

  async findAll(filters?: {
    module?: string;
    action?: string;
    entityType?: string;
    userId?: string;
  }) {
    return this.prisma.auditLog.findMany({
      where: {
        ...(filters?.module && { module: filters.module }),
        ...(filters?.action && { action: filters.action }),
        ...(filters?.entityType && { entityType: filters.entityType }),
        ...(filters?.userId && { userId: filters.userId }),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
