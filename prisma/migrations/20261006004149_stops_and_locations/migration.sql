-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "lastUsedAt" TIMESTAMP(3),
ADD COLUMN     "postcode" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN     "providerPlaceId" TEXT,
ADD COLUMN     "region" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "publicNote" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Location_truckId_provider_providerPlaceId_idx" ON "Location"("truckId", "provider", "providerPlaceId");
