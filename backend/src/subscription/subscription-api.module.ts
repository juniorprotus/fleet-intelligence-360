import { Module, Injectable, OnModuleInit } from '@nestjs/common';
import { SubscriptionModule } from './subscription.module';
import { EntitlementModule } from '../entitlement/entitlement.module';
import { UsageModule } from '../usage/usage.module';
import { SubscriptionController } from './subscription.controller';
import { EventPublisherService } from '../events/event-publisher.service';
import { EventsModule } from '../events/events.module';

@Injectable()
export class TestEventListener implements OnModuleInit {
  constructor(private readonly publisher: EventPublisherService) {}

  onModuleInit() {
    if (typeof process.send === 'function') {
      const events = [
        'SubscriptionCreated',
        'SubscriptionActivated',
        'SubscriptionPlanChanged',
        'SubscriptionSuspended',
        'SubscriptionCancelled',
        'SubscriptionExpired',
        'SubscriptionRenewed'
      ];
      for (const eventName of events) {
        this.publisher.subscribe(eventName, (envelope) => {
          if (typeof process.send === 'function') {
            process.send({ type: 'EVENT_EMITTED', event: envelope });
          }
        });
      }
    }
  }
}

/**
 * SubscriptionApiModule – registers the SubscriptionController while importing
 * the core SubscriptionModule (which provides the resolver/service) and the
 * dependent Entitlement and Usage modules. This separation avoids a circular
 * dependency between EntitlementModule (which already imports SubscriptionModule)
 * and SubscriptionModule.
 */
@Module({
  imports: [SubscriptionModule, EntitlementModule, UsageModule, EventsModule],
  controllers: [SubscriptionController],
  providers: [TestEventListener],
  exports: [],
})
export class SubscriptionApiModule {}
