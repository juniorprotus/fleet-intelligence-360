import { Module } from '@nestjs/common';
import { ProcurementService } from './procurement.service';
import { ProcurementController } from './procurement.controller';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../events/events.module';
import { WorkflowModule } from '../workflow/workflow.module';

@Module({
  imports: [AuthModule, EventsModule, WorkflowModule],
  controllers: [ProcurementController],
  providers: [ProcurementService],
  exports: [ProcurementService],
})
export class ProcurementModule {}
