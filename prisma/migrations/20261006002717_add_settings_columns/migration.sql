-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Truck" ADD COLUMN     "defaultOrdersPerSlot" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "defaultSlotMinutes" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "orderingClosesMinutesBefore" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "orderingOpensHoursBefore" INTEGER NOT NULL DEFAULT 24,
ADD COLUMN     "slotLeadMinutes" INTEGER NOT NULL DEFAULT 10;
