import { IsString, IsNotEmpty, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { SubscriptionStatus } from '@prisma/client';

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  planVersionId: string;

  @IsEnum(SubscriptionStatus)
  status: SubscriptionStatus;

  @IsDateString()
  @IsOptional()
  trialEndsAt?: string;

  @IsDateString()
  currentPeriodStart: string;

  @IsDateString()
  currentPeriodEnd: string;
}

export class UpdateSubscriptionStatusDto {
  @IsEnum(SubscriptionStatus)
  status: SubscriptionStatus;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class SubscriptionResponseDto {
  id: string;
  planVersionId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEndsAt?: Date;
  endedAt?: Date;
  cancelledAt?: Date;
}
