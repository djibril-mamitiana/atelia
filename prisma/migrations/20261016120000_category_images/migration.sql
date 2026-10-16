-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
