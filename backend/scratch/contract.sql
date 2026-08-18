-- DropIndex
DROP INDEX "vehicles_registration_number_key";

-- AlterTable
ALTER TABLE "vehicles" ALTER COLUMN "organization_id" SET NOT NULL,
ALTER COLUMN "tenant_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_tenant_id_registration_number_key" ON "vehicles"("tenant_id", "registration_number");
