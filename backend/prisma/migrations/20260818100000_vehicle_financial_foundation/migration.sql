-- Phase 5D: Vehicle Financial & Acquisition Foundation
-- CreateEnum
CREATE TYPE "VehicleOwnershipType" AS ENUM ('OWNED', 'LEASED', 'FINANCED', 'RENTED');

-- CreateEnum
CREATE TYPE "VehicleDepreciationMethod" AS ENUM ('STRAIGHT_LINE', 'REDUCING_BALANCE', 'USAGE_BASED_KM');

-- CreateEnum
CREATE TYPE "BookValueAuthority" AS ENUM ('FI360', 'EXTERNAL_ERP', 'MANUAL_VERIFIED');

-- CreateEnum
CREATE TYPE "FinancialDataStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VehicleFinanceAgreementType" AS ENUM ('LEASING', 'CHATTEL_MORTGAGE', 'HIRE_PURCHASE', 'OPERATING_LEASE', 'OTHER');

-- CreateEnum
CREATE TYPE "VehicleFinanceAgreementStatus" AS ENUM ('ACTIVE', 'SETTLED', 'TERMINATED', 'DEFAULTED');

-- CreateEnum
CREATE TYPE "VehicleDisposalMethod" AS ENUM ('SALE', 'SCRAP', 'TRADE_IN', 'DONATION', 'INSURANCE_WRITE_OFF', 'OTHER');

-- CreateEnum
CREATE TYPE "VehicleDisposalStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'FINALIZED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FinanceBalanceSource" AS ENUM ('FI360_LEDGER', 'EXTERNAL', 'MANUAL');

-- CreateTable
CREATE TABLE "vehicle_financial_profiles" (
    "profile_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "acquisition_cost" DECIMAL(14,2) NOT NULL,
    "capitalized_cost" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "acquisition_date" TIMESTAMP(3) NOT NULL,
    "in_service_date" TIMESTAMP(3) NOT NULL,
    "ownership_type" "VehicleOwnershipType" NOT NULL DEFAULT 'OWNED',
    "vendor_id" TEXT,
    "purchase_order_reference" TEXT,
    "depreciation_method" "VehicleDepreciationMethod" NOT NULL,
    "depreciation_rate_percent" DECIMAL(5,2) NOT NULL,
    "useful_life_years" INTEGER NOT NULL,
    "useful_life_km" INTEGER NOT NULL,
    "residual_value" DECIMAL(14,2) NOT NULL,
    "book_value_authority" "BookValueAuthority" NOT NULL DEFAULT 'FI360',
    "external_book_value" DECIMAL(14,2),
    "external_book_value_date" TIMESTAMP(3),
    "last_valuation_date" TIMESTAMP(3),
    "financial_data_status" "FinancialDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "tenant_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "vehicle_financial_profiles_pkey" PRIMARY KEY ("profile_id")
);

-- CreateTable
CREATE TABLE "vehicle_finance_agreements" (
    "agreement_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "agreement_number" TEXT NOT NULL,
    "agreement_type" "VehicleFinanceAgreementType" NOT NULL,
    "lender_or_lessor" TEXT NOT NULL,
    "facility_reference" TEXT,
    "principal_amount" DECIMAL(14,2) NOT NULL,
    "down_payment" DECIMAL(14,2) NOT NULL,
    "financed_amount" DECIMAL(14,2) NOT NULL,
    "interest_rate_percent" DECIMAL(5,2) NOT NULL,
    "term_months" INTEGER NOT NULL,
    "monthly_repayment" DECIMAL(14,2) NOT NULL,
    "outstanding_balance" DECIMAL(14,2) NOT NULL,
    "balance_source" "FinanceBalanceSource" NOT NULL DEFAULT 'MANUAL',
    "balance_as_of" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "start_date" TIMESTAMP(3) NOT NULL,
    "maturity_date" TIMESTAMP(3) NOT NULL,
    "annual_mileage_limit_km" INTEGER,
    "residual_balloon_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" "VehicleFinanceAgreementStatus" NOT NULL DEFAULT 'ACTIVE',
    "settled_at" TIMESTAMP(3),
    "settlement_amount" DECIMAL(14,2),
    "document_ref" TEXT,
    "tenant_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "vehicle_finance_agreements_pkey" PRIMARY KEY ("agreement_id")
);

-- CreateTable
CREATE TABLE "vehicle_disposal_records" (
    "disposal_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "disposal_date" TIMESTAMP(3) NOT NULL,
    "disposal_method" "VehicleDisposalMethod" NOT NULL,
    "buyer_name" TEXT,
    "buyer_contact" TEXT,
    "sale_proceeds" DECIMAL(14,2) NOT NULL,
    "disposal_costs" DECIMAL(14,2) NOT NULL,
    "book_value_at_disposal" DECIMAL(14,2) NOT NULL,
    "gain_or_loss_amount" DECIMAL(14,2) NOT NULL,
    "sale_invoice_number" TEXT,
    "reason" TEXT,
    "document_ref" TEXT,
    "status" "VehicleDisposalStatus" NOT NULL DEFAULT 'DRAFT',
    "tenant_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,
    "finalized_at" TIMESTAMP(3),
    "finalized_by" TEXT,

    CONSTRAINT "vehicle_disposal_records_pkey" PRIMARY KEY ("disposal_id")
);

-- CreateIndex: Unique constraint for 1:1 VehicleFinancialProfile
CREATE UNIQUE INDEX "vehicle_financial_profiles_vehicle_id_key" ON "vehicle_financial_profiles"("vehicle_id");

-- CreateIndex: Unique constraint for agreement number
CREATE UNIQUE INDEX "vehicle_finance_agreements_agreement_number_key" ON "vehicle_finance_agreements"("agreement_number");

-- CreateIndex: VehicleFinancialProfile indexes
CREATE INDEX "vehicle_financial_profiles_tenant_id_organization_id_idx" ON "vehicle_financial_profiles"("tenant_id", "organization_id");
CREATE INDEX "vehicle_financial_profiles_vehicle_id_idx" ON "vehicle_financial_profiles"("vehicle_id");

-- CreateIndex: VehicleFinanceAgreement indexes
CREATE INDEX "vehicle_finance_agreements_tenant_id_organization_id_idx" ON "vehicle_finance_agreements"("tenant_id", "organization_id");
CREATE INDEX "vehicle_finance_agreements_vehicle_id_idx" ON "vehicle_finance_agreements"("vehicle_id");

-- CreateIndex: VehicleDisposalRecord indexes
CREATE INDEX "vehicle_disposal_records_tenant_id_organization_id_idx" ON "vehicle_disposal_records"("tenant_id", "organization_id");
CREATE INDEX "vehicle_disposal_records_vehicle_id_idx" ON "vehicle_disposal_records"("vehicle_id");

-- AddForeignKey
ALTER TABLE "vehicle_financial_profiles" ADD CONSTRAINT "vehicle_financial_profiles_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("vehicle_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_financial_profiles" ADD CONSTRAINT "vehicle_financial_profiles_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("vendor_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_finance_agreements" ADD CONSTRAINT "vehicle_finance_agreements_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("vehicle_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_disposal_records" ADD CONSTRAINT "vehicle_disposal_records_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("vehicle_id") ON DELETE CASCADE ON UPDATE CASCADE;
