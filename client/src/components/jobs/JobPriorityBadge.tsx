import Badge from "../ui/Badge";

import type { JobPriority } from "../../types/job";

interface JobPriorityBadgeProps {
  priority: JobPriority;
}

const priorityLabels: Record<
  JobPriority,
  string
> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
};

const priorityVariants: Record<
  JobPriority,
  "default" | "success" | "warning" | "danger" | "info"
> = {
  LOW: "default",
  NORMAL: "info",
  HIGH: "warning",
  URGENT: "danger",
};

export default function JobPriorityBadge({
  priority,
}: JobPriorityBadgeProps) {
  return (
    <Badge variant={priorityVariants[priority]}>
      {priorityLabels[priority]}
    </Badge>
  );
}
