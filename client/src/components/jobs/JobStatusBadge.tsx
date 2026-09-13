import Badge from "../ui/Badge";

import type { JobStatus } from "../../types/job";

interface JobStatusBadgeProps {
  status: JobStatus;
}

const statusLabels: Record<JobStatus, string> = {
  RECEIVED: "Received",
  IN_PROGRESS: "In Progress",
  WAITING_FOR_PARTS: "Waiting for Parts",
  COMPLETED: "Completed",
  READY_FOR_PICKUP: "Ready for Pickup",
  DELIVERED: "Delivered",
};

const statusVariants: Record<
  JobStatus,
  "default" | "success" | "warning" | "danger" | "info"
> = {
  RECEIVED: "default",
  IN_PROGRESS: "info",
  WAITING_FOR_PARTS: "warning",
  COMPLETED: "success",
  READY_FOR_PICKUP: "success",
  DELIVERED: "default",
};

export default function JobStatusBadge({
  status,
}: JobStatusBadgeProps) {
  return (
    <Badge variant={statusVariants[status]}>
      {statusLabels[status]}
    </Badge>
  );
}
