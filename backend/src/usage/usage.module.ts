import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { LimitEnforcementService } from './limit-enforcement.service';
import { EntitlementModule } from '../entitlement/entitlement.module';
import { UsageService } from './usage.service';
import { UsageController } from './usage.controller';

@Module({
  imports: [PrismaModule, AuthModule, EntitlementModule],
  controllers: [UsageController],
  providers: [UsageService, LimitEnforcementService],
  exports: [UsageService, LimitEnforcementService],
})
export class UsageModule {}
