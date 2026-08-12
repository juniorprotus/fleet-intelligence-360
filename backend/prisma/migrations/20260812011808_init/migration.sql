-- CreateEnum
CREATE TYPE "TyreType" AS ENUM ('NEW', 'RETREAD', 'USED', 'REMOULD');

-- CreateEnum
CREATE TYPE "TyreStatus" AS ENUM ('IN_STOCK', 'FITTED', 'REMOVED', 'SENT_FOR_RETREAD', 'IN_RETREAD', 'RETURNED_RETREAD', 'SENT_FOR_REPAIR', 'IN_REPAIR', 'RETURNED_REPAIR', 'SCRAP', 'SOLD', 'TRANSFERRED', 'LOST');

-- CreateEnum
CREATE TYPE "TyreCondition" AS ENUM ('GOOD', 'FAIR', 'POOR', 'DAMAGED', 'UNSERVICEABLE');

-- CreateEnum
CREATE TYPE "TyreMovementType" AS ENUM ('RECEIPT', 'FITMENT', 'REMOVAL', 'ROTATION', 'TRANSFER', 'SENT_RETREAD', 'RECEIVED_RETREAD', 'SENT_REPAIR', 'RECEIVED_REPAIR', 'SCRAP', 'SALE', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'USER', 'READ_ONLY');

-- CreateTable
CREATE TABLE "tyres" (
    "id" SERIAL NOT NULL,
    "tyre_identifier" TEXT NOT NULL,
    "serial_number" TEXT,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "tyre_type" "TyreType" NOT NULL DEFAULT 'NEW',
    "load_index" INTEGER,
    "speed_rating" TEXT,
    "pattern" TEXT,
    "ply_rating" TEXT,
    "dot_code" TEXT,
    "purchase_date" TIMESTAMP(3),
    "purchase_cost" DECIMAL(12,2),
    "purchase_order_number" TEXT,
    "supplier_id" INTEGER,
    "current_status" "TyreStatus" NOT NULL DEFAULT 'IN_STOCK',
    "current_position_id" INTEGER,
    "current_vehicle_id" TEXT,
    "current_odometer" INTEGER,
    "original_tread_depth" DECIMAL(5,2),
    "current_tread_depth" DECIMAL(5,2),
    "minimum_tread_depth" DECIMAL(5,2),
    "retread_count" INTEGER NOT NULL DEFAULT 0,
    "repair_count" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "tyres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tyre_suppliers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "contact_name" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tyre_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tyre_fitments" (
    "id" SERIAL NOT NULL,
    "tyre_id" INTEGER NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "position_id" INTEGER NOT NULL,
    "fitment_date" TIMESTAMP(3) NOT NULL,
    "fitment_odometer" INTEGER,
    "fitment_tread_depth" DECIMAL(5,2),
    "removal_date" TIMESTAMP(3),
    "removal_odometer" INTEGER,
    "removal_tread_depth" DECIMAL(5,2),
    "removal_reason" TEXT,
    "fitted_by" TEXT,
    "removed_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tyre_fitments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tyre_inspections" (
    "id" SERIAL NOT NULL,
    "tyre_id" INTEGER NOT NULL,
    "inspection_date" TIMESTAMP(3) NOT NULL,
    "vehicle_id" TEXT,
    "position_id" INTEGER,
    "odometer" INTEGER,
    "tread_depth_left" DECIMAL(5,2),
    "tread_depth_center" DECIMAL(5,2),
    "tread_depth_right" DECIMAL(5,2),
    "average_tread_depth" DECIMAL(5,2),
    "pressure" DECIMAL(5,2),
    "condition" "TyreCondition" DEFAULT 'GOOD',
    "damage_type" TEXT,
    "damage_description" TEXT,
    "recommendation" TEXT,
    "inspected_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tyre_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tyre_movements" (
    "id" SERIAL NOT NULL,
    "tyre_id" INTEGER NOT NULL,
    "movement_type" "TyreMovementType" NOT NULL,
    "movement_date" TIMESTAMP(3) NOT NULL,
    "from_status" "TyreStatus",
    "to_status" "TyreStatus" NOT NULL,
    "from_vehicle_id" TEXT,
    "to_vehicle_id" TEXT,
    "from_position" INTEGER,
    "to_position" INTEGER,
    "odometer" INTEGER,
    "reason" TEXT,
    "performed_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tyre_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tyres_tyre_identifier_key" ON "tyres"("tyre_identifier");

-- CreateIndex
CREATE INDEX "tyres_current_status_idx" ON "tyres"("current_status");

-- CreateIndex
CREATE INDEX "tyres_current_vehicle_id_idx" ON "tyres"("current_vehicle_id");

-- CreateIndex
CREATE INDEX "tyres_brand_model_idx" ON "tyres"("brand", "model");

-- CreateIndex
CREATE UNIQUE INDEX "tyre_suppliers_code_key" ON "tyre_suppliers"("code");

-- CreateIndex
CREATE INDEX "tyre_fitments_tyre_id_idx" ON "tyre_fitments"("tyre_id");

-- CreateIndex
CREATE INDEX "tyre_fitments_vehicle_id_idx" ON "tyre_fitments"("vehicle_id");

-- CreateIndex
CREATE INDEX "tyre_fitments_fitment_date_idx" ON "tyre_fitments"("fitment_date");

-- CreateIndex
CREATE INDEX "tyre_inspections_tyre_id_idx" ON "tyre_inspections"("tyre_id");

-- CreateIndex
CREATE INDEX "tyre_inspections_inspection_date_idx" ON "tyre_inspections"("inspection_date");

-- CreateIndex
CREATE INDEX "tyre_inspections_vehicle_id_idx" ON "tyre_inspections"("vehicle_id");

-- CreateIndex
CREATE INDEX "tyre_movements_tyre_id_idx" ON "tyre_movements"("tyre_id");

-- CreateIndex
CREATE INDEX "tyre_movements_movement_date_idx" ON "tyre_movements"("movement_date");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "tyres" ADD CONSTRAINT "tyres_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "tyre_suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tyre_fitments" ADD CONSTRAINT "tyre_fitments_tyre_id_fkey" FOREIGN KEY ("tyre_id") REFERENCES "tyres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tyre_inspections" ADD CONSTRAINT "tyre_inspections_tyre_id_fkey" FOREIGN KEY ("tyre_id") REFERENCES "tyres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tyre_movements" ADD CONSTRAINT "tyre_movements_tyre_id_fkey" FOREIGN KEY ("tyre_id") REFERENCES "tyres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
