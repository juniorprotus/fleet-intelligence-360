import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { EntitlementModule } from '../entitlement/entitlement.module';
import { UsageService } from './usage.service';
import { UsageController } from './usage.controller';

@Module({
  imports: [PrismaModule, AuthModule, EntitlementModule],
  controllers: [UsageController],
  providers: [UsageService],
  exports: [UsageService],
})
export class UsageModule {}
