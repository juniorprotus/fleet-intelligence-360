import { Module } from '@nestjs/common';
import { EntitlementService } from './entitlement.service';
import { EntitlementController } from './entitlement.controller';
import { EntitlementTestController } from './entitlement-test.controller';
import { DevelopmentEntitlementContextResolver } from './development-entitlement-resolver';
import { EntitlementGuard } from './entitlement.guard';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AuthModule, AuditModule, PrismaModule],
  controllers: [EntitlementController, EntitlementTestController],
  providers: [
    EntitlementService,
    DevelopmentEntitlementContextResolver,
    EntitlementGuard,
  ],
  exports: [
    EntitlementService,
    DevelopmentEntitlementContextResolver,
    EntitlementGuard,
  ],
})
export class EntitlementModule {}
