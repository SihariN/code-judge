-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Verdict" ADD VALUE 'PENDING';
ALTER TYPE "Verdict" ADD VALUE 'JUDGING';

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "failure" JSONB,
ALTER COLUMN "passedTests" SET DEFAULT 0,
ALTER COLUMN "totalTests" SET DEFAULT 0,
ALTER COLUMN "timeMs" SET DEFAULT 0;
