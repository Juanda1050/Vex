/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,id]` on the table `branches` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,id]` on the table `customers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,id]` on the table `inventory` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,id]` on the table `product_variants` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,id]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,id]` on the table `purchases` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,id]` on the table `quotes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,id]` on the table `sales` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,id]` on the table `suppliers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,id]` on the table `warehouses` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "branches_tenantId_id_key" ON "branches"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_tenantId_id_key" ON "customers"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_tenantId_id_key" ON "inventory"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_tenantId_id_key" ON "product_variants"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "products_tenantId_id_key" ON "products"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "purchases_tenantId_id_key" ON "purchases"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_tenantId_id_key" ON "quotes"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_tenantId_id_key" ON "sales"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_tenantId_id_key" ON "suppliers"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_tenantId_id_key" ON "warehouses"("tenantId", "id");
