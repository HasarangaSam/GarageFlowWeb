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
            className="h-28 animate-pulse rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/60"
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
        className={`flex flex-col justify-between rounded-2xl border p-5 text-left transition-all hover:shadow-md cursor-pointer ${
          activeFilter === "all"
            ? "border-blue-500 bg-blue-50/40 ring-1 ring-blue-500 dark:border-blue-500 dark:bg-blue-500/10 dark:ring-blue-500/40"
            : "border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800/80 dark:bg-slate-900/60 dark:hover:border-slate-700"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Invoiced</span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
            <FileText size={20} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {formatCurrency(summary?.totalInvoiced)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {summary?.totalInvoices ?? 0} total invoices generated
          </p>
        </div>
      </button>

      {/* Revenue Collected */}
      <button
        type="button"
        onClick={() => onSelectFilter("PAID")}
        className={`flex flex-col justify-between rounded-2xl border p-5 text-left transition-all hover:shadow-md cursor-pointer ${
          activeFilter === "PAID"
            ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500 dark:border-emerald-500 dark:bg-emerald-500/10 dark:ring-emerald-500/40"
            : "border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800/80 dark:bg-slate-900/60 dark:hover:border-slate-700"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Payments Received</span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
            <CheckCircle2 size={20} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(summary?.totalPaid)}
          </p>
          <div className="mt-1 flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
            <ArrowUpRight size={13} />
            <span>{summary?.paidCount ?? 0} fully settled invoices</span>
          </div>
        </div>
      </button>

      {/* Outstanding Receivables */}
      <button
        type="button"
        onClick={() => onSelectFilter("ISSUED")}
        className={`flex flex-col justify-between rounded-2xl border p-5 text-left transition-all hover:shadow-md cursor-pointer ${
          activeFilter === "ISSUED" || activeFilter === "PARTIALLY_PAID"
            ? "border-amber-500 bg-amber-50/40 ring-1 ring-amber-500 dark:border-amber-500 dark:bg-amber-500/10 dark:ring-amber-500/40"
            : "border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800/80 dark:bg-slate-900/60 dark:hover:border-slate-700"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Outstanding Balance</span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
            <DollarSign size={20} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {formatCurrency(summary?.totalOutstanding)}
          </p>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
            {(summary?.issuedCount ?? 0) + (summary?.partiallyPaidCount ?? 0)} pending payment
          </p>
        </div>
      </button>

      {/* Draft Invoices */}
      <button
        type="button"
        onClick={() => onSelectFilter("DRAFT")}
        className={`flex flex-col justify-between rounded-2xl border p-5 text-left transition-all hover:shadow-md cursor-pointer ${
          activeFilter === "DRAFT"
            ? "border-purple-500 bg-purple-50/40 ring-1 ring-purple-500 dark:border-purple-500 dark:bg-purple-500/10 dark:ring-purple-500/40"
            : "border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800/80 dark:bg-slate-900/60 dark:hover:border-slate-700"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Draft Invoices</span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400">
            <Clock size={20} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {summary?.draftCount ?? 0}
            <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">drafts</span>
          </p>
          <p className="mt-1 text-xs text-purple-600 dark:text-purple-400 font-medium">
            {(summary?.draftCount ?? 0) > 0 ? "Awaiting review and issue" : "No pending drafts"}
          </p>
        </div>
      </button>
    </div>
  );
}
