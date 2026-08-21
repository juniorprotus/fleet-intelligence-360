import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EventPublisherService } from '../events/event-publisher.service';
import { CryptoService } from '../crypto/crypto.service';
import { PAYMENT_PROVIDER_TOKEN } from './providers/payment-provider.interface';
import { MockPaymentProvider } from './providers/mock-payment.provider';
import { PaymentStatusContract } from './payment.types';

describe('PaymentService - Idempotency', () => {
  let service: PaymentService;
  let prisma: PrismaService;

  const mockUser = { userId: 'usr-1', tenantId: 'TNT-TEST' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: PrismaService,
          useValue: {
            paymentAttempt: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            paymentTransaction: {
              create: jest.fn(),
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
          useValue: {},
        },
        {
          provide: PAYMENT_PROVIDER_TOKEN,
          useClass: MockPaymentProvider,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create new transaction when idempotency key is unique for the tenant', async () => {
    const dto = { amount: 500, currency: 'KES', providerCode: 'MOCK', idempotencyKey: 'new-key' };
    prisma.paymentAttempt.findUnique = jest.fn().mockResolvedValue(null);
    prisma.paymentTransaction.create = jest.fn().mockResolvedValue({ id: 'tx-new', createdAt: new Date() });
    prisma.paymentAttempt.create = jest.fn().mockResolvedValue({ id: 'att-new', transactionId: 'tx-new', tenantId: 'TNT-TEST', status: PaymentStatusContract.INITIATED });
    jest.spyOn(service, 'transitionStatus').mockResolvedValue();

    const result = await service.initiatePayment(mockUser, dto);
    
    expect(prisma.paymentAttempt.findUnique).toHaveBeenCalledWith({
      where: { tenantId_idempotencyKey: { tenantId: 'TNT-TEST', idempotencyKey: 'new-key' } },
      include: { transaction: true }
    });
    expect(prisma.paymentTransaction.create).toHaveBeenCalled();
    expect(result.transactionId).toBe('tx-new');
  });

  it('should return existing transaction when idempotency key already exists for the tenant', async () => {
    const dto = { amount: 500, currency: 'KES', providerCode: 'MOCK', idempotencyKey: 'existing-key' };
    const existingAttempt = {
      status: PaymentStatusContract.PENDING,
      createdAt: new Date(),
      transaction: { id: 'tx-existing' }
    };
    prisma.paymentAttempt.findUnique = jest.fn().mockResolvedValue(existingAttempt);

    const result = await service.initiatePayment(mockUser, dto);
    
    expect(prisma.paymentAttempt.findUnique).toHaveBeenCalledWith({
      where: { tenantId_idempotencyKey: { tenantId: 'TNT-TEST', idempotencyKey: 'existing-key' } },
      include: { transaction: true }
    });
    expect(prisma.paymentTransaction.create).not.toHaveBeenCalled(); // Skips creation
    expect(result.transactionId).toBe('tx-existing');
    expect(result.status).toBe(PaymentStatusContract.PENDING);
  });
});
