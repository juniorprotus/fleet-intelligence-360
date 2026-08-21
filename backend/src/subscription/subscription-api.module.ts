import { Module } from '@nestjs/common';
import { SubscriptionModule } from './subscription.module';
import { EntitlementModule } from '../entitlement/entitlement.module';
import { UsageModule } from '../usage/usage.module';
import { SubscriptionController } from './subscription.controller';

/**
 * SubscriptionApiModule – registers the SubscriptionController while importing
 * the core SubscriptionModule (which provides the resolver/service) and the
 * dependent Entitlement and Usage modules. This separation avoids a circular
 * dependency between EntitlementModule (which already imports SubscriptionModule)
 * and SubscriptionModule.
 */
@Module({
  imports: [SubscriptionModule, EntitlementModule, UsageModule],
  controllers: [SubscriptionController],
  providers: [],
  exports: [],
})
export class SubscriptionApiModule {}
