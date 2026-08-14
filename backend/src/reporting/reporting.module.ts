import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { KpiGovernanceModule } from '../kpi/kpi-governance.module';
import { UniversalReportService } from './universal-report.service';
import { UniversalReportController } from './universal-report.controller';

@Module({
  imports: [PrismaModule, KpiGovernanceModule],
  controllers: [UniversalReportController],
  providers: [UniversalReportService],
  exports: [UniversalReportService],
})
export class ReportingModule {}
