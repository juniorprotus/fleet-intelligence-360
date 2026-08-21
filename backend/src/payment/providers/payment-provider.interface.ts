export const PAYMENT_PROVIDER_TOKEN = 'PAYMENT_PROVIDER_TOKEN';

export interface IPaymentProvider {
  initiatePayment(attempt: any, tenantId: string): Promise<{ providerReference: string; status: string }>;
  getPaymentStatus(attemptId: string): Promise<string>;
  cancelPayment(attemptId: string): Promise<void>;
  verifyWebhook(request: any): Promise<{ valid: boolean; provider: string; eventId: string; status: string; providerReference?: string }>;
}
