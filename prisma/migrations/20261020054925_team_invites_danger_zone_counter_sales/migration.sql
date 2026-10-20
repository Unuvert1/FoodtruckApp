-- AlterEnum
ALTER TYPE "OrderSource" ADD VALUE 'COUNTER';

-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "email" TEXT;

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "serviceId" DROP NOT NULL,
ALTER COLUMN "pickupSlotId" DROP NOT NULL,
ALTER COLUMN "customerPhone" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Truck" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "notifyCancellation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifyDailySummary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifyNewOrder" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "truckId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'STAFF',
    "token" TEXT NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invite_token_key" ON "Invite"("token");

-- CreateIndex
CREATE INDEX "Invite_truckId_idx" ON "Invite"("truckId");

-- CreateIndex
CREATE INDEX "Invite_email_idx" ON "Invite"("email");

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE CASCADE ON UPDATE CASCADE;
