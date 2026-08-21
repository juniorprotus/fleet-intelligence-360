import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EventPublisherService } from '../events/event-publisher.service';
import { CryptoService } from '../crypto/crypto.service';
import { PAYMENT_PROVIDER_TOKEN } from './providers/payment-provider.interface';
import { MockPaymentProvider } from './providers/mock-payment.provider';
import { PaymentStatusContract } from './payment.types';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PaymentService - Webhooks', () => {
  let service: PaymentService;
  let prisma: PrismaService;
  let auditService: AuditService;
  let paymentProvider: MockPaymentProvider;

  beforeEach(async () => {
    (global as any).__processedWebhookEvents = new Set(); // Reset processed webhooks

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: PrismaService,
          useValue: {
            paymentAttempt: {
              findFirst: jest.fn(),
              update: jest.fn(),
              findUnique: jest.fn(),
            },
            paymentStatusHistory: {
              create: jest.fn(),
            },
            $transaction: jest.fn((callback) => callback(prisma)),
          },
        },
        {
          provide: AuditService,
          useValue: {
            logAction: jest.fn(),
          },
        },
        {
          provide: EventPublisherService,
          useValue: {
            publish: jest.fn(),
          },
        },
        {
          provide: CryptoService,
          useValue: {
            encrypt: jest.fn(),
            decrypt: jest.fn(),
          },
        },
        {
          provide: PAYMENT_PROVIDER_TOKEN,
          useClass: MockPaymentProvider,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    prisma = module.get<PrismaService>(PrismaService);
    auditService = module.get<AuditService>(AuditService);
    paymentProvider = module.get<MockPaymentProvider>(PAYMENT_PROVIDER_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should process valid webhook and transition to SUCCESS', async () => {
    const req = { eventId: 'evt-1', status: 'SUCCESS', providerReference: 'MOCK-123' };
    const attempt = { id: 'att-1', status: PaymentStatusContract.PENDING, transactionId: 'tx-1', tenantId: 'TNT-TEST' };
    
    prisma.paymentAttempt.findFirst = jest.fn().mockResolvedValue(attempt);
    prisma.paymentAttempt.findUnique = jest.fn().mockResolvedValue(attempt); // For transitionStatus lookup
    const transitionSpy = jest.spyOn(service, 'transitionStatus').mockResolvedValue();

    await service.processWebhook('MOCK', req);

    expect(auditService.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'WEBHOOK_RECEIVED' }));
    expect(transitionSpy).toHaveBeenCalledWith('att-1', PaymentStatusContract.SUCCESS, undefined);
  });

  it('should process valid webhook and transition to FAILED', async () => {
    const req = { eventId: 'evt-2', status: 'FAILED', providerReference: 'MOCK-123' };
    const attempt = { id: 'att-1', status: PaymentStatusContract.PENDING, transactionId: 'tx-1', tenantId: 'TNT-TEST' };
    
    prisma.paymentAttempt.findFirst = jest.fn().mockResolvedValue(attempt);
    prisma.paymentAttempt.findUnique = jest.fn().mockResolvedValue(attempt);
    const transitionSpy = jest.spyOn(service, 'transitionStatus').mockResolvedValue();

    await service.processWebhook('MOCK', req);

    expect(transitionSpy).toHaveBeenCalledWith('att-1', PaymentStatusContract.FAILED, undefined);
  });

  it('should reject webhook with invalid signature', async () => {
    const req = { mockSignature: 'INVALID', eventId: 'evt-3' };
    await expect(service.processWebhook('MOCK', req)).rejects.toThrow(BadRequestException);
    expect(auditService.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'WEBHOOK_REJECTED' }));
  });

  it('should ignore duplicate webhooks', async () => {
    const req = { eventId: 'evt-dup', status: 'SUCCESS', providerReference: 'MOCK-123' };
    const attempt = { id: 'att-1', status: PaymentStatusContract.PENDING, transactionId: 'tx-1', tenantId: 'TNT-TEST' };
    
    prisma.paymentAttempt.findFirst = jest.fn().mockResolvedValue(attempt);
    prisma.paymentAttempt.findUnique = jest.fn().mockResolvedValue(attempt);

    await service.processWebhook('MOCK', req); // First call processes
    
    const transitionSpy = jest.spyOn(service, 'transitionStatus');
    transitionSpy.mockClear();

    await service.processWebhook('MOCK', req); // Second call ignores

    expect(transitionSpy).not.toHaveBeenCalled();
  });
});
