-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "ruleDateKey" TEXT,
ADD COLUMN     "ruleId" TEXT;

-- CreateTable
CREATE TABLE "ScheduleRule" (
    "id" TEXT NOT NULL,
    "truckId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "weekdays" INTEGER[],
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "opensHoursBefore" INTEGER NOT NULL,
    "closesMinutesBefore" INTEGER NOT NULL,
    "slotMinutes" INTEGER NOT NULL,
    "ordersPerSlot" INTEGER NOT NULL,
    "publicNote" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduleRule_truckId_idx" ON "ScheduleRule"("truckId");

-- CreateIndex
CREATE UNIQUE INDEX "Service_ruleId_ruleDateKey_key" ON "Service"("ruleId", "ruleDateKey");

-- AddForeignKey
ALTER TABLE "ScheduleRule" ADD CONSTRAINT "ScheduleRule_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleRule" ADD CONSTRAINT "ScheduleRule_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "ScheduleRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

