import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';

export interface FI360DomainEventEnvelope<T = any> {
  eventId: string;
  eventType: string;
  eventVersion: string;
  tenantId: string;
  organizationId?: string;
  entityId: string;
  entityType: string;
  occurredAt: string;
  actorId?: string;
  correlationId?: string;
  causationId?: string;
  payload: T;
}

@Injectable()
export class EventPublisherService {
  private readonly logger = new Logger(EventPublisherService.name);
  private readonly eventEmitter = new EventEmitter();

  /**
   * Publish a standardized FI360 Domain Event
   */
  async publish<T>(params: {
    eventType: string;
    entityId: string;
    entityType: string;
    payload: T;
    tenantId?: string;
    organizationId?: string;
    actorId?: string;
    correlationId?: string;
  }): Promise<FI360DomainEventEnvelope<T>> {
    const envelope: FI360DomainEventEnvelope<T> = {
      eventId: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      eventType: params.eventType,
      eventVersion: '1.0',
      tenantId: params.tenantId || 'TNT-DEFAULT',
      organizationId: params.organizationId || 'ORG-DEFAULT',
      entityId: String(params.entityId),
      entityType: params.entityType,
      occurredAt: new Date().toISOString(),
      actorId: params.actorId || 'system',
      correlationId: params.correlationId || `CORR-${Date.now()}`,
      payload: params.payload,
    };

    this.logger.log(`[DOMAIN EVENT PUBLISHED] ${envelope.eventType} on ${envelope.entityType} #${envelope.entityId}`);
    this.eventEmitter.emit(envelope.eventType, envelope);

    return envelope;
  }

  /**
   * Subscribe to a domain event type
   */
  subscribe(eventType: string, handler: (event: FI360DomainEventEnvelope) => void): void {
    this.eventEmitter.on(eventType, handler);
  }
}
