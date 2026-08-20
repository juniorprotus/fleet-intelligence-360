-- CreateEnum
CREATE TYPE "FeatureStatus" AS ENUM ('ACTIVE', 'INACTIVE');


-- CreateTable
CREATE TABLE "feature_definitions" (
    "feature_id" TEXT NOT NULL,
    "feature_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "status" "FeatureStatus" NOT NULL DEFAULT 'ACTIVE',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_definitions_pkey" PRIMARY KEY ("feature_id")
);

-- CreateTable
CREATE TABLE "plan_entitlements" (
    "entitlement_id" TEXT NOT NULL,
    "plan_version_id" TEXT NOT NULL,
    "feature_id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_entitlements_pkey" PRIMARY KEY ("entitlement_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feature_definitions_feature_code_key" ON "feature_definitions"("feature_code");

-- CreateIndex
CREATE UNIQUE INDEX "plan_entitlements_plan_version_id_feature_id_key" ON "plan_entitlements"("plan_version_id", "feature_id");

-- AddForeignKey
ALTER TABLE "plan_entitlements" ADD CONSTRAINT "plan_entitlements_plan_version_id_fkey" FOREIGN KEY ("plan_version_id") REFERENCES "plan_versions"("plan_version_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_entitlements" ADD CONSTRAINT "plan_entitlements_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "feature_definitions"("feature_id") ON DELETE CASCADE ON UPDATE CASCADE;

