import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../events/events.module';
import { AuditModule } from '../audit/audit.module';
import { TelematicsService } from './telematics.service';
import { TelematicsController } from './telematics.controller';
import { GenericProviderAdapter } from './adapters/generic-provider.adapter';

@Module({
  imports: [PrismaModule, AuthModule, EventsModule, AuditModule],
  controllers: [TelematicsController],
  providers: [TelematicsService, GenericProviderAdapter],
  exports: [TelematicsService],
})
export class TelematicsModule {}
