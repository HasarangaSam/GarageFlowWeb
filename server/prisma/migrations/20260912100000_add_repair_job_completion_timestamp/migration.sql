-- Preserve the first time a job is completed so dashboard reporting remains
-- accurate after the job advances to ready for pickup or delivered.
ALTER TABLE "RepairJob" ADD COLUMN "completedAt" TIMESTAMP(3);

CREATE INDEX "RepairJob_completedAt_idx" ON "RepairJob"("completedAt");
