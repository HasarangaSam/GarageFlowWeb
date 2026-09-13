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
          style: "bg-gray-100 text-gray-700 border-gray-200",
          Icon: FileEdit,
        };
      case "ISSUED":
        return {
          label: "Issued (Unpaid)",
          style: "bg-blue-100 text-blue-700 border-blue-200",
          Icon: Clock,
        };
      case "PARTIALLY_PAID":
        return {
          label: "Partially Paid",
          style: "bg-amber-100 text-amber-700 border-amber-200",
          Icon: Clock,
        };
      case "PAID":
        return {
          label: "Paid",
          style: "bg-emerald-100 text-emerald-700 border-emerald-200",
          Icon: CheckCircle2,
        };
      case "VOID":
        return {
          label: "Void",
          style: "bg-rose-100 text-rose-700 border-rose-200",
          Icon: XCircle,
        };
      default:
        return {
          label: s,
          style: "bg-gray-100 text-gray-600 border-gray-200",
          Icon: HelpCircle,
        };
    }
  };

  const { label, style, Icon } = getBadgeConfig(status);
  const sizeClasses =
    size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${sizeClasses} ${style}`}
    >
      <Icon size={size === "sm" ? 12 : 14} />
      <span>{label}</span>
    </span>
  );
}
