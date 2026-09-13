import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
} from "lucide-react";
import type { InvoiceSummary } from "../../types/invoice";
import { formatCurrency } from "../../utils/formatters";

interface InvoiceMetricsProps {
  summary?: InvoiceSummary;
  isLoading: boolean;
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
}

export default function InvoiceMetrics({
  summary,
  isLoading,
  activeFilter,
  onSelectFilter,
}: InvoiceMetricsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Invoiced */}
      <button
        type="button"
        onClick={() => onSelectFilter("all")}
        className={`flex flex-col justify-between rounded-xl border p-5 text-left transition-all hover:shadow-md ${
          activeFilter === "all"
            ? "border-blue-500 bg-blue-50/40 ring-1 ring-blue-500"
            : "border-gray-200 bg-white hover:border-gray-300"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Total Invoiced</span>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <FileText size={20} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(summary?.totalInvoiced)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {summary?.totalInvoices ?? 0} total invoices generated
          </p>
        </div>
      </button>

      {/* Revenue Collected */}
      <button
        type="button"
        onClick={() => onSelectFilter("PAID")}
        className={`flex flex-col justify-between rounded-xl border p-5 text-left transition-all hover:shadow-md ${
          activeFilter === "PAID"
            ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500"
            : "border-gray-200 bg-white hover:border-gray-300"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Payments Received</span>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
            <CheckCircle2 size={20} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-emerald-600">
            {formatCurrency(summary?.totalPaid)}
          </p>
          <div className="mt-1 flex items-center gap-1 text-xs text-emerald-700">
            <ArrowUpRight size={13} />
            <span>{summary?.paidCount ?? 0} fully settled invoices</span>
          </div>
        </div>
      </button>

      {/* Outstanding Receivables */}
      <button
        type="button"
        onClick={() => onSelectFilter("ISSUED")}
        className={`flex flex-col justify-between rounded-xl border p-5 text-left transition-all hover:shadow-md ${
          activeFilter === "ISSUED" || activeFilter === "PARTIALLY_PAID"
            ? "border-amber-500 bg-amber-50/40 ring-1 ring-amber-500"
            : "border-gray-200 bg-white hover:border-gray-300"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Outstanding Balance</span>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
            <DollarSign size={20} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-amber-600">
            {formatCurrency(summary?.totalOutstanding)}
          </p>
          <p className="mt-1 text-xs text-amber-700">
            {(summary?.issuedCount ?? 0) + (summary?.partiallyPaidCount ?? 0)} pending payment
          </p>
        </div>
      </button>

      {/* Draft Invoices */}
      <button
        type="button"
        onClick={() => onSelectFilter("DRAFT")}
        className={`flex flex-col justify-between rounded-xl border p-5 text-left transition-all hover:shadow-md ${
          activeFilter === "DRAFT"
            ? "border-purple-500 bg-purple-50/40 ring-1 ring-purple-500"
            : "border-gray-200 bg-white hover:border-gray-300"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Draft Invoices</span>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
            <Clock size={20} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-gray-900">
            {summary?.draftCount ?? 0}
            <span className="ml-2 text-xs font-normal text-gray-500">drafts</span>
          </p>
          <p className="mt-1 text-xs text-purple-600 font-medium">
            {(summary?.draftCount ?? 0) > 0 ? "Awaiting review and issue" : "No pending drafts"}
          </p>
        </div>
      </button>
    </div>
  );
}
