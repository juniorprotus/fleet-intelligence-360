import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PAYMENT_PROVIDER_TOKEN } from './providers/payment-provider.interface';
import { MockPaymentProvider } from './providers/mock-payment.provider';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { EventsModule } from '../events/events.module';
import { CryptoModule } from '../crypto/crypto.module';

@Module({
  imports: [PrismaModule, AuditModule, EventsModule, CryptoModule],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    {
      provide: PAYMENT_PROVIDER_TOKEN,
      useClass: MockPaymentProvider,
    },
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
