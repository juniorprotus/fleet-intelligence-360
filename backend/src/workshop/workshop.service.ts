import { Injectable, Logger, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventPublisherService } from '../events/event-publisher.service';
import { ApprovalWorkflowService } from '../workflow/approval-workflow.service';
import { VehicleService } from '../vehicle/vehicle.service';
import { KpiGovernanceService } from '../kpi/kpi-governance.service';

@Injectable()
export class WorkshopService implements OnModuleInit {
  private readonly logger = new Logger(WorkshopService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: EventPublisherService,
    private readonly workflowService: ApprovalWorkflowService,
    private readonly vehicleService: VehicleService,
    private readonly kpiGovernance: KpiGovernanceService,
  ) {}

  onModuleInit() {
    // Subscribe to domain event for automatic work order creation upon vehicle grounding
    this.eventPublisher.subscribe('vehicle.grounded', async (event) => {
      try {
        await this.handleVehicleGrounded(event);
      } catch (err: any) {
        this.logger.error(`Failed to handle vehicle.grounded event: ${err?.message || err}`);
      }
    });
  }

  /**
   * Auto-create Workshop Work Order upon vehicle grounding event (Idempotent)
   */
  async handleVehicleGrounded(event: any) {
    const payload = event.payload || {};
    const vehicleId = payload.vehicleId || event.entityId;
    const downtimeId = payload.downtimeId;
    const workshopId = payload.workshopId;
    const reason = payload.reason || 'Vehicle Grounded due to Safety Critical Defect';

    if (!vehicleId || !workshopId) {
      this.logger.warn(`Skipping auto work order creation: Missing vehicleId or workshopId in event payload`);
      return;
    }

    // Idempotency check: Ensure an active WorkOrder does not already exist for this downtime record
    if (downtimeId) {
      const existingWO = await this.prisma.workOrder.findFirst({
        where: { downtimeId, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
      });
      if (existingWO) {
        this.logger.log(`Idempotency check: Work Order ${existingWO.workOrderNumber} already exists for downtime #${downtimeId}`);
        return existingWO;
      }
    }

    const woNumber = `WO-${Date.now().toString().slice(-6)}`;
    const workOrder = await this.prisma.workOrder.create({
      data: {
        workOrderNumber: woNumber,
        tenantId: event.tenantId || 'TNT-DEFAULT',
        organizationId: event.organizationId || 'ORG-DEFAULT',
        vehicleId,
        workshopId,
        downtimeId,
        title: `Emergency Repair: ${reason}`,
        description: `Auto-generated work order following safety grounding event. Downtime ID: ${downtimeId || 'N/A'}`,
        maintenanceType: 'SAFETY_GROUNDING',
        priority: 'HIGH',
        status: 'SCHEDULED',
        createdBy: event.actorId || 'SYSTEM_EVENT',
      },
    });

    await this.eventPublisher.publish({
      eventType: 'workorder.created',
      entityId: workOrder.id,
      entityType: 'WorkOrder',
      actorId: event.actorId || 'SYSTEM',
      payload: {
        workOrderId: workOrder.id,
        workOrderNumber: workOrder.workOrderNumber,
        vehicleId: workOrder.vehicleId,
        workshopId: workOrder.workshopId,
        downtimeId: workOrder.downtimeId,
        maintenanceType: workOrder.maintenanceType,
        priority: workOrder.priority,
      },
    });

    this.logger.log(`Auto-created Work Order ${workOrder.workOrderNumber} for grounded vehicle ${vehicleId}`);
    return workOrder;
  }

  /**
   * Manually create a Work Order
   */
  async create(dto: {
    vehicleId: string;
    workshopId: string;
    title: string;
    description?: string;
    maintenanceType?: any;
    priority?: any;
    downtimeId?: string;
    defectId?: number;
    assignedTechId?: number;
    estimatedHours?: number;
  }, userId?: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle #${dto.vehicleId} not found`);
    }

    const workshop = await this.prisma.workshop.findUnique({ where: { id: dto.workshopId } });
    if (!workshop) {
      throw new NotFoundException(`Workshop #${dto.workshopId} not found`);
    }

    if (dto.downtimeId) {
      const existingWO = await this.prisma.workOrder.findFirst({
        where: { downtimeId: dto.downtimeId, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
        include: { vehicle: true, workshop: true, tasks: true },
      });
      if (existingWO) {
        this.logger.log(`Idempotency check: Returning existing active Work Order ${existingWO.workOrderNumber} for downtime ${dto.downtimeId}`);
        return existingWO;
      }
    }

    const woNumber = `WO-${Date.now().toString().slice(-6)}`;
    const workOrder = await this.prisma.workOrder.create({
      data: {
        workOrderNumber: woNumber,
        tenantId: 'TNT-DEFAULT',
        organizationId: 'ORG-DEFAULT',
        vehicleId: dto.vehicleId,
        workshopId: dto.workshopId,
        downtimeId: dto.downtimeId,
        defectId: dto.defectId,
        title: dto.title,
        description: dto.description,
        maintenanceType: dto.maintenanceType || 'CORRECTIVE',
        priority: dto.priority || 'MEDIUM',
        status: dto.assignedTechId ? 'SCHEDULED' : 'DRAFT',
        assignedTechId: dto.assignedTechId,
        estimatedHours: dto.estimatedHours,
        createdBy: userId || 'SYSTEM',
      },
      include: {
        vehicle: true,
        workshop: true,
        tasks: true,
      },
    });

    await this.eventPublisher.publish({
      eventType: 'workorder.created',
      entityId: workOrder.id,
      entityType: 'WorkOrder',
      actorId: userId || 'SYSTEM',
      payload: {
        workOrderId: workOrder.id,
        workOrderNumber: workOrder.workOrderNumber,
        vehicleId: workOrder.vehicleId,
        workshopId: workOrder.workshopId,
        maintenanceType: workOrder.maintenanceType,
        priority: workOrder.priority,
      },
    });

    this.logger.log(`Work Order ${workOrder.workOrderNumber} created by ${userId || 'SYSTEM'}`);
    return workOrder;
  }

  async findAll(filter?: { vehicleId?: string; workshopId?: string; status?: string }) {
    const where: any = {};
    if (filter?.vehicleId) where.vehicleId = filter.vehicleId;
    if (filter?.workshopId) where.workshopId = filter.workshopId;
    if (filter?.status) where.status = filter.status as any;

    return this.prisma.workOrder.findMany({
      where,
      include: {
        vehicle: true,
        workshop: true,
        tasks: true,
        defect: true,
        downtime: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const wo = await this.prisma.workOrder.findUnique({
      where: { id },
      include: {
        vehicle: true,
        workshop: true,
        tasks: {
          include: { assignedTo: true },
        },
        defect: true,
        downtime: true,
      },
    });
    if (!wo) {
      throw new NotFoundException(`Work Order #${id} not found`);
    }
    return wo;
  }

  async addTask(workOrderId: string, dto: { taskName: string; description?: string; assignedToId?: number; estimatedMin?: number }) {
    const wo = await this.findOne(workOrderId);

    const task = await this.prisma.workOrderTask.create({
      data: {
        workOrderId: wo.id,
        taskName: dto.taskName,
        description: dto.description,
        assignedToId: dto.assignedToId,
        estimatedMin: dto.estimatedMin,
        status: 'PENDING',
      },
    });

    if (dto.assignedToId) {
      await this.eventPublisher.publish({
        eventType: 'workorder.assigned',
        entityId: wo.id,
        entityType: 'WorkOrder',
        actorId: 'SYSTEM',
        payload: {
          workOrderId: wo.id,
          workOrderNumber: wo.workOrderNumber,
          taskId: task.id,
          assignedToId: dto.assignedToId,
        },
      });
    }

    return task;
  }

  /**
   * Complete Work Order & Execute Quality Sign-off with Segregation of Duties
   */
  async completeWorkOrder(
    workOrderId: string,
    dto: { actualHours?: number; totalLaborCost?: number; totalPartsCost?: number; notes?: string; approvedBy?: string },
    approverId?: string,
  ) {
    const wo = await this.findOne(workOrderId);
    if (wo.status === 'COMPLETED') {
      throw new BadRequestException(`Work Order ${wo.workOrderNumber} is already completed.`);
    }

    const effectiveApprover = dto.approvedBy || approverId || 'supervisor@fi360.com';
    const technicianId = wo.assignedTechId ? String(wo.assignedTechId) : (wo.createdBy || 'tech1');

    // Enforce Segregation of Duties: Technician executing work cannot approve their own Work Order
    this.workflowService.validateSegregationOfDuties(technicianId, effectiveApprover);

    // Update all pending tasks to DONE
    await this.prisma.workOrderTask.updateMany({
      where: { workOrderId: wo.id },
      data: { status: 'DONE' },
    });

    const now = new Date();
    const updatedWO = await this.prisma.workOrder.update({
      where: { id: wo.id },
      data: {
        status: 'COMPLETED',
        completedAt: now,
        actualHours: dto.actualHours || wo.estimatedHours || 2.0,
        totalLaborCost: dto.totalLaborCost || 150.0,
        totalPartsCost: dto.totalPartsCost || 450.0,
        approvedBy: effectiveApprover,
      },
      include: { vehicle: true, workshop: true, downtime: true },
    });

    // Authoritatively trigger vehicle recovery via Fleet & Asset boundary
    let recoveryResult: any = null;
    if (wo.vehicle.vehicleStatus === 'GROUNDED' || wo.downtimeId) {
      recoveryResult = await this.vehicleService.recoverVehicle(
        wo.vehicleId,
        effectiveApprover,
        `Recovered upon Work Order completion #${wo.workOrderNumber}: ${dto.notes || 'Maintenance complete'}`,
      );
    }

    await this.eventPublisher.publish({
      eventType: 'workorder.completed',
      entityId: wo.id,
      entityType: 'WorkOrder',
      actorId: effectiveApprover,
      payload: {
        workOrderId: wo.id,
        workOrderNumber: wo.workOrderNumber,
        vehicleId: wo.vehicleId,
        workshopId: wo.workshopId,
        actualHours: updatedWO.actualHours,
        totalLaborCost: updatedWO.totalLaborCost,
        totalPartsCost: updatedWO.totalPartsCost,
        approvedBy: effectiveApprover,
      },
    });

    this.logger.log(`Work Order ${wo.workOrderNumber} signed off as COMPLETED by ${effectiveApprover}`);
    return {
      message: `Work Order ${wo.workOrderNumber} completed and quality sign-off verified.`,
      workOrder: updatedWO,
      recovery: recoveryResult,
    };
  }

  async getMaintenanceSchedules() {
    let schedules = await this.prisma.maintenanceSchedule.findMany({
      where: { isActive: true },
    });

    if (schedules.length === 0) {
      // Seed default PM rule if empty
      const defaultSchedule = await this.prisma.maintenanceSchedule.create({
        data: {
          tenantId: 'TNT-DEFAULT',
          organizationId: 'ORG-DEFAULT',
          vehicleClass: 'Heavy Truck',
          serviceName: 'A-Service 10K Odometer PM',
          intervalKm: 10000,
          intervalDays: 90,
          isActive: true,
        },
      });
      schedules = [defaultSchedule];
    }
    return schedules;
  }
}
