import { Controller, Post, Get, Body, Param, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto, PaymentResponseDto } from './payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { PaymentStatusContract } from './payment.types';

@Controller('api/v1')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('payments')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.INITIATE_PAYMENT)
  async initiatePayment(@Req() req: any, @Body() dto: CreatePaymentDto) {
    const payment = await this.paymentService.initiatePayment(req.user, dto);
    return {
      paymentId: payment.transactionId,
      status: payment.status,
      amount: dto.amount,
      currency: dto.currency,
      message: this.getStatusMessage(payment.status),
      createdAt: payment.createdAt,
    };
  }

  @Get('payments/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.VIEW_PAYMENT)
  async getPayment(@Req() req: any, @Param('id') id: string) {
    const payment = await this.paymentService.getPayment(req.user, id);
    return {
      paymentId: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      createdAt: payment.createdAt,
    };
  }

  @Get('payments/:id/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.VIEW_PAYMENT)
  async getPaymentStatus(@Req() req: any, @Param('id') id: string) {
    const status = await this.paymentService.getPaymentStatus(req.user, id);
    return {
      paymentId: id,
      status,
      message: this.getStatusMessage(status),
    };
  }

  @Post('payment/webhook/:provider')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Param('provider') provider: string, @Req() req: any) {
    // Note: This endpoint is intentionally unprotected by JwtAuthGuard because webhooks are called by external providers.
    // Security is enforced via cryptographic signature verification within the PaymentService.
    await this.paymentService.processWebhook(provider, req.body);
    return { received: true };
  }

  private getStatusMessage(status: PaymentStatusContract): string {
    switch (status) {
      case PaymentStatusContract.PENDING:
        return 'Payment initiated and awaiting provider confirmation.';
      case PaymentStatusContract.SUCCESS:
        return 'Payment completed successfully.';
      case PaymentStatusContract.FAILED:
        return 'Payment failed. Please retry or use another payment method.';
      case PaymentStatusContract.CANCELLED:
        return 'Payment was cancelled.';
      default:
        return `Payment status: ${status}.`;
    }
  }
}
