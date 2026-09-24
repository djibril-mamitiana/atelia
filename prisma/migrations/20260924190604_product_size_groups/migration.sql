-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "groupKey" TEXT,
ADD COLUMN     "sizeLabel" TEXT,
ADD COLUMN     "sizeOrder" DOUBLE PRECISION,
ADD COLUMN     "sizeSpecs" TEXT;

-- CreateIndex
CREATE INDEX "Product_groupKey_idx" ON "Product"("groupKey");
