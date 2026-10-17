-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "priceTables" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "specs" JSONB;
