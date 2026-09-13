-- Jobs completed before completedAt was introduced have no status-history row.
-- Use their last recorded update as the best available completion timestamp.
UPDATE "RepairJob"
SET "completedAt" = "updatedAt"
WHERE "completedAt" IS NULL
  AND "status" IN ('COMPLETED', 'READY_FOR_PICKUP', 'DELIVERED');
