import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SystemAdminService } from './system-admin.service';
import { SystemAdminController } from './system-admin.controller';

import { KpiGovernanceModule } from '../kpi/kpi-governance.module';

@Module({
  imports: [PrismaModule, KpiGovernanceModule],
  controllers: [SystemAdminController],
  providers: [SystemAdminService],
  exports: [SystemAdminService],
})
export class SystemAdminModule {}
