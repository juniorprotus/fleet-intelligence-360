import { Module } from '@nestjs/common';
import { TyreController } from './tyre.controller';
import { TyreService } from './tyre.service';
import { AuthModule } from '../auth/auth.module';

import { KpiGovernanceModule } from '../kpi/kpi-governance.module';
import { EventsModule } from '../events/events.module';
import { WorkflowModule } from '../workflow/workflow.module';

@Module({
  imports: [AuthModule, KpiGovernanceModule, EventsModule, WorkflowModule],
  controllers: [TyreController],
  providers: [TyreService],
  exports: [TyreService],
})
export class TyreModule {}
