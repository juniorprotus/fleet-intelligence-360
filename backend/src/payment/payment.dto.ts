import { IsString, IsNumber, IsPositive, Matches, IsNotEmpty } from 'class-validator';
import { PaymentStatusContract } from './payment.types';

export class CreatePaymentDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'Currency must be exactly 3 uppercase ISO-4217 characters' })
  currency: string;

  @IsString()
  @IsNotEmpty()
  providerCode: string;

  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;
}

export class PaymentResponseDto {
  transactionId: string;
  status: PaymentStatusContract;
  createdAt: string;
}
