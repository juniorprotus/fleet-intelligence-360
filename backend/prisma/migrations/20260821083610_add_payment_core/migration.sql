-- FI360 Step 6E.1: Payment Core Foundation
-- Additive-only migration. No destructive operations.
-- No historical migration modified.
-- No UserRole/users table changes (already reconciled in live DB).

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED', 'REVERSED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateTable: payment_transactions
CREATE TABLE "payment_transactions" (
    "transaction_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "subscription_id" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "provider_code" TEXT NOT NULL,
    "provider_reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateTable: payment_attempts
CREATE TABLE "payment_attempts" (
    "attempt_id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "provider_code" TEXT NOT NULL,
    "provider_reference" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("attempt_id")
);

-- CreateTable: payment_status_history
CREATE TABLE "payment_status_history" (
    "history_id" TEXT NOT NULL,
    "attempt_id" TEXT NOT NULL,
    "old_status" "PaymentStatus" NOT NULL,
    "new_status" "PaymentStatus" NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_by" TEXT,

    CONSTRAINT "payment_status_history_pkey" PRIMARY KEY ("history_id")
);

-- CreateIndex: payment_transactions
CREATE INDEX "payment_transactions_tenant_id_idx" ON "payment_transactions"("tenant_id");
CREATE INDEX "payment_transactions_subscription_id_idx" ON "payment_transactions"("subscription_id");

-- CreateIndex: payment_attempts
CREATE INDEX "payment_attempts_transaction_id_idx" ON "payment_attempts"("transaction_id");
CREATE UNIQUE INDEX "payment_attempts_tenant_id_idempotency_key_key" ON "payment_attempts"("tenant_id", "idempotency_key");

-- CreateIndex: payment_status_history
CREATE INDEX "payment_status_history_attempt_id_idx" ON "payment_status_history"("attempt_id");

-- AddForeignKey: payment_transactions → tenants
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: payment_transactions → subscriptions
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("subscription_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: payment_attempts → payment_transactions
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "payment_transactions"("transaction_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: payment_attempts → tenants
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: payment_status_history → payment_attempts
ALTER TABLE "payment_status_history" ADD CONSTRAINT "payment_status_history_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "payment_attempts"("attempt_id") ON DELETE RESTRICT ON UPDATE CASCADE;
