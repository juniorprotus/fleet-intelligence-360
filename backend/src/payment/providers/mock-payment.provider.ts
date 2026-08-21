import { Injectable } from '@nestjs/common';
import { IPaymentProvider } from './payment-provider.interface';
import { PaymentStatusContract } from '../payment.types';

@Injectable()
export class MockPaymentProvider implements IPaymentProvider {
  async initiatePayment(attempt: any, tenantId: string): Promise<{ providerReference: string; status: string }> {
    return {
      providerReference: `MOCK-REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: PaymentStatusContract.PENDING,
    };
  }

  async getPaymentStatus(attemptId: string): Promise<string> {
    return PaymentStatusContract.PENDING;
  }

  async cancelPayment(attemptId: string): Promise<void> {
    // Mock cancellation
    return;
  }

  async verifyWebhook(request: any): Promise<{ valid: boolean; provider: string; eventId: string; status: string; providerReference?: string }> {
    // For tests, allow request body to control the valid flag and other fields
    // Real providers would use a signature check here.
    if (request.mockSignature === 'INVALID') {
      return {
        valid: false,
        provider: 'MOCK',
        eventId: request.eventId || `EVT-${Date.now()}`,
        status: request.status || 'UNKNOWN',
        providerReference: request.providerReference,
      };
    }

    return {
      valid: true,
      provider: 'MOCK',
      eventId: request.eventId || `EVT-${Date.now()}`,
      status: request.status || PaymentStatusContract.SUCCESS,
      providerReference: request.providerReference,
    };
  }
}
