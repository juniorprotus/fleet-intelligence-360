-- CreateEnum
CREATE TYPE "LimitType" AS ENUM ('COUNT', 'RETENTION_DAYS');

-- CreateTable
CREATE TABLE "limit_definitions" (
    "limit_id" TEXT NOT NULL,
    "limit_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "limit_type" "LimitType" NOT NULL,
    "unit" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "limit_definitions_pkey" PRIMARY KEY ("limit_id")
);

-- CreateTable
CREATE TABLE "plan_version_limits" (
    "plan_limit_id" TEXT NOT NULL,
    "plan_version_id" TEXT NOT NULL,
    "limit_definition_id" TEXT NOT NULL,
    "limit_value" INTEGER,
    "is_unlimited" BOOLEAN NOT NULL DEFAULT false,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_version_limits_pkey" PRIMARY KEY ("plan_limit_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "limit_definitions_limit_code_key" ON "limit_definitions"("limit_code");

-- CreateIndex
CREATE INDEX "plan_version_limits_plan_version_id_idx" ON "plan_version_limits"("plan_version_id");

-- CreateIndex
CREATE INDEX "plan_version_limits_limit_definition_id_idx" ON "plan_version_limits"("limit_definition_id");

-- CreateIndex
CREATE UNIQUE INDEX "plan_version_limits_plan_version_id_limit_definition_id_key" ON "plan_version_limits"("plan_version_id", "limit_definition_id");

-- AddForeignKey
ALTER TABLE "plan_version_limits" ADD CONSTRAINT "plan_version_limits_plan_version_id_fkey" FOREIGN KEY ("plan_version_id") REFERENCES "plan_versions"("plan_version_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_version_limits" ADD CONSTRAINT "plan_version_limits_limit_definition_id_fkey" FOREIGN KEY ("limit_definition_id") REFERENCES "limit_definitions"("limit_id") ON DELETE CASCADE ON UPDATE CASCADE;
