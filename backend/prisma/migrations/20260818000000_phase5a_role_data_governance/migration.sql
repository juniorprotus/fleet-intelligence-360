-- CreateTable
CREATE TABLE "data_corrections" (
    "correction_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'TNT-DEFAULT',
    "organization_id" TEXT NOT NULL DEFAULT 'ORG-DEFAULT',
    "domain" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "field_name" TEXT NOT NULL,
    "original_value" TEXT NOT NULL,
    "corrected_value" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "corrected_by_id" INTEGER NOT NULL,
    "corrected_by_email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "correlation_id" TEXT,
    "audit_log_id" TEXT,

    CONSTRAINT "data_corrections_pkey" PRIMARY KEY ("correction_id")
);

-- CreateIndex
CREATE INDEX "data_corrections_tenant_id_organization_id_idx" ON "data_corrections"("tenant_id", "organization_id");

-- CreateIndex
CREATE INDEX "data_corrections_domain_entity_type_entity_id_idx" ON "data_corrections"("domain", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "data_corrections_corrected_by_id_idx" ON "data_corrections"("corrected_by_id");
