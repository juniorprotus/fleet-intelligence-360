-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'DEPRECATED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PlanVersionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUPERSEDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PricingModel" AS ENUM ('FLAT', 'PER_VEHICLE', 'TIERED', 'PROGRESSIVE');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'ANNUAL');

-- CreateTable
CREATE TABLE "products" (
    "product_id" TEXT NOT NULL,
    "product_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "plans" (
    "plan_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "plan_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "PlanStatus" NOT NULL DEFAULT 'DRAFT',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("plan_id")
);

-- CreateTable
CREATE TABLE "plan_versions" (
    "plan_version_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "status" "PlanVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "pricing_model" "PricingModel" NOT NULL DEFAULT 'FLAT',
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "billing_interval" "BillingInterval" NOT NULL DEFAULT 'MONTHLY',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_versions_pkey" PRIMARY KEY ("plan_version_id")
);

-- CreateTable
CREATE TABLE "plan_prices" (
    "plan_price_id" TEXT NOT NULL,
    "plan_version_id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "billing_interval" "BillingInterval" NOT NULL,
    "amount" DECIMAL(12,2),
    "is_default" BOOLEAN NOT NULL DEFAULT true,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_prices_pkey" PRIMARY KEY ("plan_price_id")
);

-- CreateTable
CREATE TABLE "plan_vehicle_pricing_bands" (
    "pricing_band_id" TEXT NOT NULL,
    "plan_version_id" TEXT NOT NULL,
    "min_vehicles" INTEGER NOT NULL DEFAULT 0,
    "max_vehicles" INTEGER,
    "price_per_vehicle" DECIMAL(12,2),
    "flat_price" DECIMAL(12,2),
    "currency" TEXT NOT NULL,
    "billing_interval" "BillingInterval" NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_vehicle_pricing_bands_pkey" PRIMARY KEY ("pricing_band_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "products_product_key_key" ON "products"("product_key");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "products"("status");

-- CreateIndex
CREATE INDEX "plans_product_id_status_idx" ON "plans"("product_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "plans_product_id_plan_key_key" ON "plans"("product_id", "plan_key");

-- CreateIndex
CREATE INDEX "plan_versions_plan_id_status_idx" ON "plan_versions"("plan_id", "status");

-- CreateIndex
CREATE INDEX "plan_versions_effective_from_effective_to_idx" ON "plan_versions"("effective_from", "effective_to");

-- CreateIndex
CREATE UNIQUE INDEX "plan_versions_plan_id_version_number_key" ON "plan_versions"("plan_id", "version_number");

-- CreateIndex
CREATE INDEX "plan_prices_plan_version_id_idx" ON "plan_prices"("plan_version_id");

-- CreateIndex
CREATE INDEX "plan_prices_currency_billing_interval_idx" ON "plan_prices"("currency", "billing_interval");

-- CreateIndex
CREATE INDEX "plan_vehicle_pricing_bands_plan_version_id_idx" ON "plan_vehicle_pricing_bands"("plan_version_id");

-- CreateIndex
CREATE INDEX "plan_vehicle_pricing_bands_currency_billing_interval_idx" ON "plan_vehicle_pricing_bands"("currency", "billing_interval");

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_versions" ADD CONSTRAINT "plan_versions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("plan_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_prices" ADD CONSTRAINT "plan_prices_plan_version_id_fkey" FOREIGN KEY ("plan_version_id") REFERENCES "plan_versions"("plan_version_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_vehicle_pricing_bands" ADD CONSTRAINT "plan_vehicle_pricing_bands_plan_version_id_fkey" FOREIGN KEY ("plan_version_id") REFERENCES "plan_versions"("plan_version_id") ON DELETE RESTRICT ON UPDATE CASCADE;

