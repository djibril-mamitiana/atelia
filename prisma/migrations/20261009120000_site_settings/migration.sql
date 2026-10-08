-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "shippingStandard" DECIMAL(10,2) NOT NULL,
    "shippingExpress" DECIMAL(10,2) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);
