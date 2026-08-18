import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../events/events.module';
import { AuditModule } from '../audit/audit.module';
import { CryptoModule } from '../crypto/crypto.module';
import { TelematicsService } from './telematics.service';
import { TelematicsController } from './telematics.controller';
import { GenericProviderAdapter } from './adapters/generic-provider.adapter';
import { GeotabProviderAdapter } from './adapters/geotab/geotab-provider.adapter';
import { GeotabSessionManager } from './adapters/geotab/geotab.session';
import { GeotabMapper } from './adapters/geotab/geotab.mapper';

@Module({
  imports: [PrismaModule, AuthModule, EventsModule, AuditModule, CryptoModule],
  controllers: [TelematicsController],
  providers: [
    TelematicsService,
    GenericProviderAdapter,
    GeotabProviderAdapter,
    GeotabSessionManager,
    GeotabMapper,
  ],
  exports: [TelematicsService, GeotabProviderAdapter],
})
export class TelematicsModule {}
