import { Module } from '@nestjs/common';
import { KpiGovernanceService } from './kpi-governance.service';

@Module({
  providers: [KpiGovernanceService],
  exports: [KpiGovernanceService],
})
export class KpiGovernanceModule {}
