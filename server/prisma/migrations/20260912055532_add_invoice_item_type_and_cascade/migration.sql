-- CreateEnum
CREATE TYPE "InvoiceItemType" AS ENUM ('PART', 'LABOUR');

-- DropForeignKey
ALTER TABLE "InventoryTransaction" DROP CONSTRAINT "InventoryTransaction_partId_fkey";

-- AlterTable
ALTER TABLE "InvoiceItem" ADD COLUMN     "partId" TEXT,
ADD COLUMN     "type" "InvoiceItemType" NOT NULL DEFAULT 'LABOUR';

-- CreateIndex
CREATE INDEX "InvoiceItem_partId_idx" ON "InvoiceItem"("partId");

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE CASCADE ON UPDATE CASCADE;
