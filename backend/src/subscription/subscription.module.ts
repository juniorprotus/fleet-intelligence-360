import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { SubscriptionService } from './subscription.service';
import { SubscriptionResolverService } from './subscription-resolver.service';
import { SubscriptionController } from './subscription.controller';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, SubscriptionResolverService],
  exports: [SubscriptionService, SubscriptionResolverService],
})
export class SubscriptionModule {}
