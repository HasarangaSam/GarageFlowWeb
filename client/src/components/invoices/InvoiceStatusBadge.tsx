import { CheckCircle2, Clock, FileEdit, HelpCircle, XCircle } from "lucide-react";
import type { InvoiceStatus } from "../../types/invoice";

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus | string;
  size?: "sm" | "md";
}

export default function InvoiceStatusBadge({
  status,
  size = "md",
}: InvoiceStatusBadgeProps) {
  const getBadgeConfig = (s: string) => {
    switch (s) {
      case "DRAFT":
        return {
          label: "Draft",
          style:
            "bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700/60",
          Icon: FileEdit,
        };
      case "ISSUED":
        return {
          label: "Issued (Unpaid)",
          style:
            "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30",
          Icon: Clock,
        };
      case "PARTIALLY_PAID":
        return {
          label: "Partially Paid",
          style:
            "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30",
          Icon: Clock,
        };
      case "PAID":
        return {
          label: "Paid",
          style:
            "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30",
          Icon: CheckCircle2,
        };
      case "VOID":
        return {
          label: "Void",
          style:
            "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30",
          Icon: XCircle,
        };
      default:
        return {
          label: s,
          style:
            "bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700/60",
          Icon: HelpCircle,
        };
    }
  };

  const { label, style, Icon } = getBadgeConfig(status);
  const sizeClasses =
    size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors ${sizeClasses} ${style}`}
    >
      <Icon size={size === "sm" ? 12 : 14} />
      <span>{label}</span>
    </span>
  );
}
