-- AlterTable
ALTER TABLE "User" ADD COLUMN "company" TEXT,
ADD COLUMN "customerCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_customerCode_key" ON "User"("customerCode");
