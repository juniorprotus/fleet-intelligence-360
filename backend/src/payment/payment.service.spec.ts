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

describe('PaymentService', () => {
  let service: PaymentService;
  let prisma: PrismaService;
  let auditService: AuditService;
  let eventPublisher: EventPublisherService;
  let paymentProvider: MockPaymentProvider;

  const mockUser = { userId: 'usr-1', tenantId: 'TNT-TEST' };
  const mockProviderReference = 'MOCK-REF-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: PrismaService,
          useValue: {
            paymentAttempt: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            paymentTransaction: {
              create: jest.fn(),
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
    eventPublisher = module.get<EventPublisherService>(EventPublisherService);
    paymentProvider = module.get<MockPaymentProvider>(PAYMENT_PROVIDER_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initiatePayment', () => {
    const dto = {
      amount: 1000,
      currency: 'KES',
      providerCode: 'MOCK',
      idempotencyKey: 'idem-1',
    };

    it('should initiate a valid payment and transition to PENDING', async () => {
      prisma.paymentAttempt.findUnique = jest.fn().mockResolvedValue(null);
      prisma.paymentTransaction.create = jest.fn().mockResolvedValue({ id: 'tx-1', createdAt: new Date() });
      prisma.paymentAttempt.create = jest.fn().mockResolvedValue({ id: 'att-1', transactionId: 'tx-1', tenantId: 'TNT-TEST', status: PaymentStatusContract.INITIATED });
      
      const transitionSpy = jest.spyOn(service, 'transitionStatus').mockResolvedValue();

      const result = await service.initiatePayment(mockUser, dto);

      expect(prisma.paymentTransaction.create).toHaveBeenCalled();
      expect(prisma.paymentAttempt.create).toHaveBeenCalled();
      expect(auditService.logAction).toHaveBeenCalled();
      expect(transitionSpy).toHaveBeenCalledWith('att-1', PaymentStatusContract.PENDING, 'usr-1');
      expect(result.status).toBe(PaymentStatusContract.PENDING);
    });

    it('should throw BadRequestException if amount is zero or negative', async () => {
      await expect(service.initiatePayment(mockUser, { ...dto, amount: -100 })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if currency is invalid', async () => {
      await expect(service.initiatePayment(mockUser, { ...dto, currency: 'kes' })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if tenantId is missing', async () => {
      await expect(service.initiatePayment({}, dto)).rejects.toThrow(BadRequestException);
    });

    it('should return existing payment if idempotency key matches', async () => {
      const existingAttempt = {
        status: PaymentStatusContract.PENDING,
        createdAt: new Date(),
        transaction: { id: 'tx-exist' }
      };
      prisma.paymentAttempt.findUnique = jest.fn().mockResolvedValue(existingAttempt);

      const result = await service.initiatePayment(mockUser, dto);
      expect(result.transactionId).toBe('tx-exist');
      expect(result.status).toBe(PaymentStatusContract.PENDING);
      expect(prisma.paymentTransaction.create).not.toHaveBeenCalled();
    });

    it('should handle provider failure by transitioning to FAILED', async () => {
      prisma.paymentAttempt.findUnique = jest.fn().mockResolvedValue(null);
      prisma.paymentTransaction.create = jest.fn().mockResolvedValue({ id: 'tx-1', createdAt: new Date() });
      prisma.paymentAttempt.create = jest.fn().mockResolvedValue({ id: 'att-1', transactionId: 'tx-1', tenantId: 'TNT-TEST', status: PaymentStatusContract.INITIATED });
      
      const transitionSpy = jest.spyOn(service, 'transitionStatus').mockResolvedValue();
      jest.spyOn(paymentProvider, 'initiatePayment').mockRejectedValue(new Error('Provider error'));

      await expect(service.initiatePayment(mockUser, dto)).rejects.toThrow('Provider error');
      expect(transitionSpy).toHaveBeenCalledWith('att-1', PaymentStatusContract.FAILED, 'usr-1');
    });
  });

  describe('transitionStatus', () => {
    it('should transition status successfully', async () => {
      prisma.paymentAttempt.findUnique = jest.fn().mockResolvedValue({ id: 'att-1', status: PaymentStatusContract.PENDING, tenantId: 'TNT-TEST', transactionId: 'tx-1' });
      
      await service.transitionStatus('att-1', PaymentStatusContract.SUCCESS, 'usr-1');

      expect(prisma.paymentAttempt.update).toHaveBeenCalledWith({
        where: { id: 'att-1' },
        data: { status: PaymentStatusContract.SUCCESS },
      });
      expect(eventPublisher.publish).toHaveBeenCalledWith(expect.objectContaining({
        eventType: 'PaymentSucceeded',
        entityId: 'tx-1',
      }));
    });

    it('should reject invalid transitions', async () => {
      prisma.paymentAttempt.findUnique = jest.fn().mockResolvedValue({ id: 'att-1', status: PaymentStatusContract.SUCCESS });
      await expect(service.transitionStatus('att-1', PaymentStatusContract.PENDING, 'usr-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPayment', () => {
    it('should return a payment if tenantId matches', async () => {
      prisma.paymentTransaction.findUnique = jest.fn().mockResolvedValue({ id: 'tx-1', tenantId: 'TNT-TEST' });
      const result = await service.getPayment(mockUser, 'tx-1');
      expect(result.id).toBe('tx-1');
    });

    it('should throw NotFoundException if tenantId does not match (tenant isolation)', async () => {
      prisma.paymentTransaction.findUnique = jest.fn().mockResolvedValue({ id: 'tx-1', tenantId: 'TNT-OTHER' });
      await expect(service.getPayment(mockUser, 'tx-1')).rejects.toThrow(NotFoundException);
    });
  });
});
