-- CreateEnum
CREATE TYPE "InventoryCategory" AS ENUM ('TYRE_CASING', 'VALVE', 'RIM', 'BRAKE_PAD', 'FILTER', 'FLUID', 'GENERAL_SPARE');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('RECEIPT', 'ISSUE', 'RETURN', 'TRANSFER', 'ADJUSTMENT', 'OPENING_BALANCE', 'STOCKTAKE_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "RequisitionStatus" AS ENUM ('PENDING', 'APPROVED', 'ISSUED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');

-- CreateTable
CREATE TABLE "inventory_items" (
    "item_id" TEXT NOT NULL,
    "part_number" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'TNT-DEFAULT',
    "organization_id" TEXT NOT NULL DEFAULT 'ORG-DEFAULT',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "InventoryCategory" NOT NULL DEFAULT 'GENERAL_SPARE',
    "unit_of_measure" TEXT NOT NULL DEFAULT 'EA',
    "default_unit_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("item_id")
);

-- CreateTable
CREATE TABLE "inventory_stocks" (
    "stock_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'TNT-DEFAULT',
    "organization_id" TEXT NOT NULL DEFAULT 'ORG-DEFAULT',
    "workshop_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "quantity_on_hand" INTEGER NOT NULL DEFAULT 0,
    "quantity_reserved" INTEGER NOT NULL DEFAULT 0,
    "reorder_point" INTEGER NOT NULL DEFAULT 5,
    "reorder_quantity" INTEGER NOT NULL DEFAULT 20,
    "unit_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_stocks_pkey" PRIMARY KEY ("stock_id")
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" SERIAL NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'TNT-DEFAULT',
    "organization_id" TEXT NOT NULL DEFAULT 'ORG-DEFAULT',
    "workshop_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "movement_type" "InventoryMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_cost" DOUBLE PRECISION NOT NULL,
    "total_cost" DOUBLE PRECISION NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "work_order_id" TEXT,
    "requisition_id" TEXT,
    "po_id" TEXT,
    "reference" TEXT,
    "performed_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parts_requisitions" (
    "requisition_id" TEXT NOT NULL,
    "req_number" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'TNT-DEFAULT',
    "organization_id" TEXT NOT NULL DEFAULT 'ORG-DEFAULT',
    "work_order_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_cost" DOUBLE PRECISION NOT NULL,
    "total_cost" DOUBLE PRECISION NOT NULL,
    "status" "RequisitionStatus" NOT NULL DEFAULT 'PENDING',
    "requested_by_id" INTEGER NOT NULL,
    "issued_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parts_requisitions_pkey" PRIMARY KEY ("requisition_id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "vendor_id" TEXT NOT NULL,
    "vendor_code" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'TNT-DEFAULT',
    "organization_id" TEXT NOT NULL DEFAULT 'ORG-DEFAULT',
    "name" TEXT NOT NULL,
    "contact_email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("vendor_id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "po_id" TEXT NOT NULL,
    "po_number" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'TNT-DEFAULT',
    "organization_id" TEXT NOT NULL DEFAULT 'ORG-DEFAULT',
    "vendor_id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "total_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "approved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("po_id")
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" SERIAL NOT NULL,
    "po_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "quantity_ordered" INTEGER NOT NULL,
    "quantity_received" INTEGER NOT NULL DEFAULT 0,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "total_price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_part_number_key" ON "inventory_items"("part_number");
CREATE INDEX "inventory_items_tenant_id_organization_id_idx" ON "inventory_items"("tenant_id", "organization_id");
CREATE INDEX "inventory_items_category_idx" ON "inventory_items"("category");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_stocks_workshop_id_item_id_key" ON "inventory_stocks"("workshop_id", "item_id");
CREATE INDEX "inventory_stocks_tenant_id_organization_id_idx" ON "inventory_stocks"("tenant_id", "organization_id");
CREATE INDEX "inventory_stocks_workshop_id_idx" ON "inventory_stocks"("workshop_id");

-- CreateIndex
CREATE INDEX "inventory_movements_tenant_id_organization_id_idx" ON "inventory_movements"("tenant_id", "organization_id");
CREATE INDEX "inventory_movements_workshop_id_idx" ON "inventory_movements"("workshop_id");
CREATE INDEX "inventory_movements_item_id_idx" ON "inventory_movements"("item_id");
CREATE INDEX "inventory_movements_movement_type_idx" ON "inventory_movements"("movement_type");

-- CreateIndex
CREATE UNIQUE INDEX "parts_requisitions_req_number_key" ON "parts_requisitions"("req_number");
CREATE INDEX "parts_requisitions_tenant_id_organization_id_idx" ON "parts_requisitions"("tenant_id", "organization_id");
CREATE INDEX "parts_requisitions_work_order_id_idx" ON "parts_requisitions"("work_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_vendor_code_key" ON "vendors"("vendor_code");
CREATE INDEX "vendors_tenant_id_organization_id_idx" ON "vendors"("tenant_id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_po_number_key" ON "purchase_orders"("po_number");
CREATE INDEX "purchase_orders_tenant_id_organization_id_idx" ON "purchase_orders"("tenant_id", "organization_id");
CREATE INDEX "purchase_orders_vendor_id_idx" ON "purchase_orders"("vendor_id");
CREATE INDEX "purchase_orders_workshop_id_idx" ON "purchase_orders"("workshop_id");

-- CreateIndex
CREATE INDEX "purchase_order_items_po_id_idx" ON "purchase_order_items"("po_id");

-- AddForeignKey
ALTER TABLE "inventory_stocks" ADD CONSTRAINT "inventory_stocks_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("workshop_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_stocks" ADD CONSTRAINT "inventory_stocks_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "inventory_items"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("workshop_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "inventory_items"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("work_order_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parts_requisitions" ADD CONSTRAINT "parts_requisitions_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("work_order_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "parts_requisitions" ADD CONSTRAINT "parts_requisitions_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "inventory_items"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "parts_requisitions" ADD CONSTRAINT "parts_requisitions_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("vendor_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("workshop_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "purchase_orders"("po_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "inventory_items"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;
