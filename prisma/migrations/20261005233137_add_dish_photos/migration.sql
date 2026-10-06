-- CreateTable
CREATE TABLE "DishPhoto" (
    "id" TEXT NOT NULL,
    "truckId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "bytes" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DishPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DishPhoto_truckId_idx" ON "DishPhoto"("truckId");

-- AddForeignKey
ALTER TABLE "DishPhoto" ADD CONSTRAINT "DishPhoto_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE CASCADE ON UPDATE CASCADE;
