-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "publicSku" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Product_publicSku_key" ON "Product"("publicSku");
