import { Module } from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { VehicleController } from './vehicle.controller';
import { AuthModule } from '../auth/auth.module';
import { UsageModule } from '../usage/usage.module';
import { EventsModule } from '../events/events.module';
import { WorkflowModule } from '../workflow/workflow.module';

@Module({
  imports: [AuthModule, EventsModule, WorkflowModule, UsageModule],
  controllers: [VehicleController],
  providers: [VehicleService],
  exports: [VehicleService],
})
export class VehicleModule {}
