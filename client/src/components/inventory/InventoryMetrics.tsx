import {
  AlertTriangle,
  Boxes,
  DollarSign,
  TrendingUp,
  XCircle,
} from "lucide-react";
import type { InventorySummary } from "../../types/part";
import { formatCurrency } from "../../utils/formatters";

interface InventoryMetricsProps {
  summary?: InventorySummary;
  isLoading: boolean;
  activeFilter: "all" | "inStock" | "lowStock" | "outOfStock";
  onSelectFilter: (
    filter: "all" | "inStock" | "lowStock" | "outOfStock",
  ) => void;
}

export default function InventoryMetrics({
  summary,
  isLoading,
  activeFilter,
  onSelectFilter,
}: InventoryMetricsProps) {
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
      {/* Total SKUs */}
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
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Total Catalog
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
            <Boxes size={20} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {summary?.totalSkus ?? 0}
            <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
              unique SKUs
            </span>
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {summary?.totalItems ?? 0} units total in inventory
          </p>
        </div>
      </button>

      {/* In Stock & Valuation */}
      <button
        type="button"
        onClick={() => onSelectFilter("inStock")}
        className={`flex flex-col justify-between rounded-2xl border p-5 text-left transition-all hover:shadow-md cursor-pointer ${
          activeFilter === "inStock"
            ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500 dark:border-emerald-500 dark:bg-emerald-500/10 dark:ring-emerald-500/40"
            : "border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800/80 dark:bg-slate-900/60 dark:hover:border-slate-700"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Inventory Valuation
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
            <DollarSign size={20} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {formatCurrency(summary?.totalValuation)}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <TrendingUp size={13} />
            <span>Retail val: {formatCurrency(summary?.totalRetailValue)}</span>
          </div>
        </div>
      </button>

      {/* Low Stock Alerts */}
      <button
        type="button"
        onClick={() => onSelectFilter("lowStock")}
        className={`flex flex-col justify-between rounded-2xl border p-5 text-left transition-all hover:shadow-md cursor-pointer ${
          activeFilter === "lowStock"
            ? "border-amber-500 bg-amber-50/40 ring-1 ring-amber-500 dark:border-amber-500 dark:bg-amber-500/10 dark:ring-amber-500/40"
            : "border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800/80 dark:bg-slate-900/60 dark:hover:border-slate-700"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Low Stock Warning
          </span>
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              (summary?.lowStockCount ?? 0) > 0
                ? "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 animate-pulse"
                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            }`}
          >
            <AlertTriangle size={20} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {summary?.lowStockCount ?? 0}
            <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
              SKUs below min
            </span>
          </p>
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
            {(summary?.lowStockCount ?? 0) > 0
              ? "Reordering recommended"
              : "All stock at healthy levels"}
          </p>
        </div>
      </button>

      {/* Out of Stock */}
      <button
        type="button"
        onClick={() => onSelectFilter("outOfStock")}
        className={`flex flex-col justify-between rounded-2xl border p-5 text-left transition-all hover:shadow-md cursor-pointer ${
          activeFilter === "outOfStock"
            ? "border-rose-500 bg-rose-50/40 ring-1 ring-rose-500 dark:border-rose-500 dark:bg-rose-500/10 dark:ring-rose-500/40"
            : "border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800/80 dark:bg-slate-900/60 dark:hover:border-slate-700"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Out of Stock
          </span>
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              (summary?.outOfStockCount ?? 0) > 0
                ? "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"
                : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-400"
            }`}
          >
            <XCircle size={20} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {summary?.outOfStockCount ?? 0}
            <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
              items depleted
            </span>
          </p>
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">
            {(summary?.outOfStockCount ?? 0) > 0
              ? "Critical: cannot assign to jobs"
              : "No stockouts currently"}
          </p>
        </div>
      </button>
    </div>
  );
}
