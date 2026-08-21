import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EventPublisherService } from '../events/event-publisher.service';
import { CryptoService } from '../crypto/crypto.service';
import { PaymentStatusContract } from './payment.types';
import { CreatePaymentDto, PaymentResponseDto } from './payment.dto';
import { PAYMENT_PROVIDER_TOKEN } from './providers/payment-provider.interface';
import type { IPaymentProvider } from './providers/payment-provider.interface';
import { Inject } from '@nestjs/common';
import { Prisma, PaymentTransaction, PaymentAttempt, PaymentStatusHistory } from '@prisma/client';

@Injectable()
export class PaymentService {
  private readonly allowedTransitions: Record<PaymentStatusContract, PaymentStatusContract[]> = {
    [PaymentStatusContract.INITIATED]: [PaymentStatusContract.PENDING, PaymentStatusContract.FAILED],
    [PaymentStatusContract.PENDING]: [
      PaymentStatusContract.SUCCESS,
      PaymentStatusContract.FAILED,
      PaymentStatusContract.CANCELLED,
      PaymentStatusContract.EXPIRED,
    ],
    [PaymentStatusContract.SUCCESS]: [],
    [PaymentStatusContract.FAILED]: [],
    [PaymentStatusContract.CANCELLED]: [],
    [PaymentStatusContract.EXPIRED]: [],
    [PaymentStatusContract.REVERSED]: [],
    [PaymentStatusContract.REFUNDED]: [],
    [PaymentStatusContract.PARTIALLY_REFUNDED]: [],
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly eventPublisher: EventPublisherService,
    private readonly cryptoService: CryptoService,
    @Inject(PAYMENT_PROVIDER_TOKEN) private readonly paymentProvider: IPaymentProvider,
  ) {}

  async initiatePayment(user: any, dto: CreatePaymentDto): Promise<PaymentResponseDto> {
    const tenantId = user?.tenantId;
    if (!tenantId) throw new BadRequestException('Missing tenant context');
    if (dto.amount <= 0) throw new BadRequestException('Amount must be positive');
    if (!/^[A-Z]{3}$/.test(dto.currency)) throw new BadRequestException('Invalid ISO‑4217 currency');
    if (!dto.providerCode) throw new BadRequestException('Provider code is required');
    if (!dto.idempotencyKey) throw new BadRequestException('Idempotency key is required');

    const existingAttempt = await this.prisma.paymentAttempt.findUnique({
      where: { tenantId_idempotencyKey: { tenantId, idempotencyKey: dto.idempotencyKey } },
      include: { transaction: true },
    });
    if (existingAttempt) {
      return {
        transactionId: existingAttempt.transaction.id,
        status: existingAttempt.status as PaymentStatusContract,
        createdAt: existingAttempt.createdAt.toISOString(),
      } as PaymentResponseDto;
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.paymentTransaction.create({
        data: { amount: dto.amount, currency: dto.currency, tenantId, providerCode: dto.providerCode },
      });
      const attempt = await tx.paymentAttempt.create({
        data: {
          transactionId: transaction.id,
          tenantId,
          amount: dto.amount,
          currency: dto.currency,
          providerCode: dto.providerCode,
          idempotencyKey: dto.idempotencyKey,
          status: PaymentStatusContract.INITIATED as any,

        },
      });
      await tx.paymentStatusHistory.create({
        data: {
          attemptId: attempt.id,
          oldStatus: PaymentStatusContract.INITIATED,
          newStatus: PaymentStatusContract.INITIATED,
          changedBy: user.userId || null,
        },
      });
      await this.auditService.logAction(
        {
          module: 'PAYMENT',
          action: 'PAYMENT_INITIATED',
          entityType: 'PaymentTransaction',
          entityId: transaction.id,
          userId: user.userId,
          afterValue: { transaction, attempt },
        },
        tx,
      );
      return { transaction, attempt };
    });

    try {
      await this.paymentProvider.initiatePayment(
        { amount: dto.amount, currency: dto.currency, providerCode: dto.providerCode, idempotencyKey: dto.idempotencyKey } as any,
        tenantId,
      );
      await this.transitionStatus(result.attempt.id, PaymentStatusContract.PENDING, user.userId);
    } catch (err) {
      await this.transitionStatus(result.attempt.id, PaymentStatusContract.FAILED, user.userId);
      throw err;
    }

    return {
      transactionId: result.transaction.id,
      status: PaymentStatusContract.PENDING,
      createdAt: result.transaction.createdAt.toISOString(),
    } as PaymentResponseDto;
  }

  async getPayment(user: any, transactionId: string): Promise<PaymentTransaction> {
    const tenantId = user?.tenantId;
    const tx = await this.prisma.paymentTransaction.findUnique({ where: { id: transactionId } });
    if (!tx || tx.tenantId !== tenantId) throw new NotFoundException('Payment not found');
    return tx;
  }

  async getPaymentStatus(user: any, transactionId: string): Promise<PaymentStatusContract> {
    const tenantId = user?.tenantId;
    const attempt = await this.prisma.paymentAttempt.findFirst({
      where: { transactionId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
    if (!attempt) throw new NotFoundException('Payment attempt not found');
    return attempt.status as PaymentStatusContract;
  }

  async transitionStatus(attemptId: string, newStatus: PaymentStatusContract, changedBy?: string): Promise<void> {
    const attempt = await this.prisma.paymentAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt) throw new NotFoundException('Payment attempt not found');
    const allowed = this.allowedTransitions[attempt.status as PaymentStatusContract];
    if (!allowed.includes(newStatus)) throw new BadRequestException(`Invalid transition from ${attempt.status} to ${newStatus}`);
    await this.prisma.$transaction(async (tx) => {
      await tx.paymentAttempt.update({ where: { id: attemptId }, data: { status: newStatus } });
      await tx.paymentStatusHistory.create({
        data: { attemptId, oldStatus: attempt.status as PaymentStatusContract, newStatus, changedBy: changedBy || null },
      });
      await this.auditService.logAction(
        {
          module: 'PAYMENT',
          action: 'PAYMENT_STATUS_CHANGED',
          entityType: 'PaymentAttempt',
          entityId: attemptId,
          userId: changedBy,
          beforeValue: { status: attempt.status },
          afterValue: { status: newStatus },
        },
        tx,
      );
    });
    const eventMap: Record<PaymentStatusContract, string> = {
      [PaymentStatusContract.SUCCESS]: 'PaymentSucceeded',
      [PaymentStatusContract.FAILED]: 'PaymentFailed',
      [PaymentStatusContract.CANCELLED]: 'PaymentCancelled',
      [PaymentStatusContract.PENDING]: 'PaymentPending',
      [PaymentStatusContract.INITIATED]: 'PaymentInitiated',
      [PaymentStatusContract.EXPIRED]: 'PaymentExpired',
      [PaymentStatusContract.REVERSED]: 'PaymentReversed',
      [PaymentStatusContract.REFUNDED]: 'PaymentRefunded',
      [PaymentStatusContract.PARTIALLY_REFUNDED]: 'PaymentPartiallyRefunded',
    };
    const eventType = eventMap[newStatus];
    if (eventType) {
      await this.eventPublisher.publish({
        eventType,
        entityId: attempt.transactionId,
        entityType: 'PaymentTransaction',
        tenantId: attempt.tenantId,
        actorId: changedBy,
        payload: { attemptId, newStatus },
      });
    }
  }

  async processWebhook(provider: string, req: any): Promise<void> {
    const verification = await this.paymentProvider.verifyWebhook(req);
    if (!verification.valid) {
      await this.auditService.logAction({
        module: 'PAYMENT',
        action: 'WEBHOOK_REJECTED',
        entityType: 'Payment',
        entityId: 'UNKNOWN',
        afterValue: { provider, reason: 'Invalid signature' },
      });
      throw new BadRequestException('Invalid webhook signature');
    }
    const { eventId, status, providerReference } = verification;
    const processedSet: Set<string> = (global as any).__processedWebhookEvents || new Set();
    if (processedSet.has(eventId)) return;
    processedSet.add(eventId);
    (global as any).__processedWebhookEvents = processedSet;
    const attempt = await this.prisma.paymentAttempt.findFirst({ where: { providerReference } });
    if (!attempt) {
      await this.auditService.logAction({
        module: 'PAYMENT',
        action: 'WEBHOOK_REJECTED',
        entityType: 'PaymentAttempt',
        entityId: 'UNKNOWN',
        afterValue: { provider, providerReference },
      });
      throw new NotFoundException('Payment attempt not found for webhook');
    }
    const mappedStatus = (PaymentStatusContract as any)[status] as PaymentStatusContract;
    if (!mappedStatus) {
      await this.auditService.logAction({
        module: 'PAYMENT',
        action: 'WEBHOOK_REJECTED',
        entityType: 'PaymentAttempt',
        entityId: attempt.id,
        afterValue: { provider, status },
      });
      throw new BadRequestException('Unsupported status from provider');
    }
    await this.auditService.logAction({
      module: 'PAYMENT',
      action: 'WEBHOOK_RECEIVED',
      entityType: 'PaymentAttempt',
      entityId: attempt.id,
      afterValue: { provider, eventId, status },
    });
    await this.transitionStatus(attempt.id, mappedStatus, undefined);
  }
}
