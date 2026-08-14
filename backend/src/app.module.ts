import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TyreModule } from './tyre/tyre.module';
import { AuthModule } from './auth/auth.module';
import { VehicleModule } from './vehicle/vehicle.module';
import { BudgetModule } from './budget/budget.module';
import { AlertModule } from './alert/alert.module';
import { DefectModule } from './defect/defect.module';
import { AuditModule } from './audit/audit.module';
import { UserModule } from './user/user.module';
import { SystemAdminModule } from './admin/system-admin.module';
import { KpiGovernanceModule } from './kpi/kpi-governance.module';
import { ReportingModule } from './reporting/reporting.module';
import { EventsModule } from './events/events.module';
import { WorkflowModule } from './workflow/workflow.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    TyreModule,
    VehicleModule,
    BudgetModule,
    AlertModule,
    DefectModule,
    AuditModule,
    SystemAdminModule,
    KpiGovernanceModule,
    ReportingModule,
    EventsModule,
    WorkflowModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
