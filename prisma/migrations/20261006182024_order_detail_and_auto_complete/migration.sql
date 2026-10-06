-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "autoCompletedAt" TIMESTAMP(3),
ADD COLUMN     "refundedCents" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OrderLineItem" ADD COLUMN     "voidedAt" TIMESTAMP(3),
ADD COLUMN     "voidedCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "voidedReason" TEXT;

-- CreateIndex
CREATE INDEX "Order_status_readyAt_idx" ON "Order"("status", "readyAt");
