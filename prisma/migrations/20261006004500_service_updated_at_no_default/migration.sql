-- The previous migration needed a default to backfill existing rows; Prisma maintains this column (@updatedAt) itself.
ALTER TABLE "Service" ALTER COLUMN "updatedAt" DROP DEFAULT;
