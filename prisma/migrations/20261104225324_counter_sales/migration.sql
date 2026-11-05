-- CreateEnum
CREATE TYPE "TenderType" AS ENUM ('CASH', 'CARD', 'OTHER');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "tender" "TenderType";

-- AlterTable
ALTER TABLE "Truck" ADD COLUMN     "counterSeq" INTEGER NOT NULL DEFAULT 0;
