import { Module } from '@nestjs/common';
import { WorkshopService } from './workshop.service';
import { WorkshopController } from './workshop.controller';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../events/events.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { VehicleModule } from '../vehicle/vehicle.module';
import { KpiGovernanceModule } from '../kpi/kpi-governance.module';

@Module({
  imports: [
    AuthModule,
    EventsModule,
    WorkflowModule,
    VehicleModule,
    KpiGovernanceModule,
  ],
  controllers: [WorkshopController],
  providers: [WorkshopService],
  exports: [WorkshopService],
})
export class WorkshopModule {}
